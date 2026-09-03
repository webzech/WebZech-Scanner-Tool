import * as cheerio from 'cheerio';
import { URL } from 'url';
import {
  ConsentAnalysis,
  CookieItem,
  Finding,
  LegalPageAnalysis,
  NetworkRequestItem,
  RiskLevel,
  ScanResult,
  ThirdPartyService,
  TrackerItem,
} from '../src/types.js';
import { validateAndNormalizeUrl } from './security.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; WebZechDSGVOScan/1.0; +https://webzech.de/scanner)';

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB max
const FETCH_TIMEOUT_MS = 18000;

/**
 * Safe fetch wrapper with timeout, size limit, and SSRF re-validation
 */
async function safeFetch(targetUrl: string, redirectCount = 0): Promise<{ response: Response; bodyText: string; finalUrl: string }> {
  if (redirectCount > 5) {
    throw new Error('Zu viele Weiterleitungen (maximal 5 Weiterleitungen erlaubt).');
  }

  // SSRF check on current URL
  const validation = await validateAndNormalizeUrl(targetUrl);
  if (!validation.isValid || !validation.normalizedUrl) {
    throw new Error(validation.error || 'Sicherheitsfehler bei URL-Validierung.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(validation.normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
      redirect: 'manual', // Manual handling for redirect SSRF validation
    });

    // Check redirect
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Weiterleitung ohne Zieladresse erhalten.');
      }
      const resolvedRedirect = new URL(location, validation.normalizedUrl).toString();
      clearTimeout(timeout);
      return safeFetch(resolvedRedirect, redirectCount + 1);
    }

    if (!response.ok) {
      throw new Error(`Website antwortete mit HTTP-Status ${response.status} (${response.statusText}).`);
    }

    // Read body safely with length limit
    const reader = response.body?.getReader();
    if (!reader) {
      const text = await response.text();
      return { response, bodyText: text, finalUrl: validation.normalizedUrl };
    }

    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedLength += value.length;
        if (receivedLength > MAX_RESPONSE_BYTES) {
          reader.cancel();
          throw new Error('Die Antwort der Website überschreitet die maximale Sicherheitsgrenze (5 MB).');
        }
        chunks.push(value);
      }
    }

    const totalBuffer = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      totalBuffer.set(chunk, position);
      position += chunk.length;
    }

    const decoder = new TextDecoder('utf-8');
    const bodyText = decoder.decode(totalBuffer);

    return { response, bodyText, finalUrl: validation.normalizedUrl };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Die Website konnte innerhalb des Zeitlimits (18 Sekunden) nicht geladen werden.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Main scanner function
 */
export async function performDsgvoScan(rawUrl: string): Promise<ScanResult> {
  const startTime = Date.now();
  const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Step 1: Initial SSRF and normalization
  const security = await validateAndNormalizeUrl(rawUrl);
  if (!security.isValid || !security.normalizedUrl || !security.domain) {
    throw new Error(security.error || 'Ungültige oder unsichere URL.');
  }

  const initialUrl = security.normalizedUrl;
  const domain = security.domain;
  const isHttps = initialUrl.startsWith('https://');

  // Step 2: Fetch homepage
  let mainPageFetch: { response: Response; bodyText: string; finalUrl: string };
  try {
    mainPageFetch = await safeFetch(initialUrl);
  } catch (err: any) {
    // If https failed on non-https domain or vice versa, attempt fallback
    if (isHttps && err.message.includes('ECONNREFUSED')) {
      const httpFallback = initialUrl.replace('https://', 'http://');
      mainPageFetch = await safeFetch(httpFallback);
    } else {
      throw err;
    }
  }

  const html = mainPageFetch.bodyText;
  const finalUrl = mainPageFetch.finalUrl;
  const finalIsHttps = finalUrl.startsWith('https://');
  const $ = cheerio.load(html);

  // Extract set-cookie headers from main page
  const rawSetCookie = mainPageFetch.response.headers.get('set-cookie') || '';
  const initialCookies: CookieItem[] = parseCookiesFromHeaders(rawSetCookie, domain, true);

  // Network requests & Third-party analysis
  const networkRequests: NetworkRequestItem[] = [];
  const thirdPartyServices: ThirdPartyService[] = [];
  const trackers: TrackerItem[] = [];
  const findings: Finding[] = [];

  let score = 100;

  // 1. HTTPS Check
  if (!finalIsHttps) {
    score -= 25;
    findings.push({
      id: 'f_https_missing',
      category: 'ssl',
      severity: 'CRITICAL',
      title: 'Keine HTTPS-Verschlüsselung aktiv',
      description: 'Die Website wird unverschlüsselt über HTTP ausgeliefert. Personenbezogene Daten können im Klartext mitgelesen oder manipuliert werden.',
      evidence: finalUrl,
      recommendation: 'Aktivieren Sie unverzüglich ein SSL/TLS-Zertifikat und richten Sie eine serverseitige 301-Weiterleitung von HTTP auf HTTPS ein (gemäß Art. 32 DSGVO – Sicherheit der Verarbeitung).',
    });
  }

  // 2. Extract scripts, stylesheets, iframes, images
  const scriptSources: string[] = [];
  const scriptContents: string[] = [];
  $('script').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      scriptSources.push(src);
    } else {
      const content = $(el).html();
      if (content) scriptContents.push(content);
    }
  });

  const linkHrefs: string[] = [];
  $('link').each((_, el) => {
    const href = $(el).attr('href');
    if (href) linkHrefs.push(href);
  });

  const iframeSources: string[] = [];
  $('iframe').each((_, el) => {
    const src = $(el).attr('src');
    if (src) iframeSources.push(src);
  });

  const allExternalUrls = [...scriptSources, ...linkHrefs, ...iframeSources];
  const combinedScriptsText = scriptContents.join('\n');

  // 3. Analyze Network Requests & External Destinations
  for (const rawSrc of allExternalUrls) {
    try {
      const parsed = new URL(rawSrc, finalUrl);
      const reqDomain = parsed.hostname.toLowerCase();
      const isThirdParty = !reqDomain.endsWith(domain.replace(/^www\./, ''));

      let cat: NetworkRequestItem['category'] = 'Unknown';
      let resType = 'other';
      if (rawSrc.includes('.js') || scriptSources.includes(rawSrc)) resType = 'script';
      else if (rawSrc.includes('.css') || linkHrefs.includes(rawSrc)) resType = 'stylesheet';
      else if (iframeSources.includes(rawSrc)) resType = 'iframe';

      if (/google-analytics|googletagmanager|analytics|matomo|clarity|hotjar/i.test(reqDomain)) {
        cat = 'Analytics';
      } else if (/doubleclick|googleadservices|facebook|snap\.licdn|tiktok/i.test(reqDomain)) {
        cat = 'Marketing';
      } else if (/fonts\.googleapis|fonts\.gstatic|use\.typekit/i.test(reqDomain)) {
        cat = 'Fonts';
      } else if (/maps\.googleapis|maps\.google|openstreetmap/i.test(reqDomain)) {
        cat = 'Maps';
      } else if (/youtube|vimeo/i.test(reqDomain)) {
        cat = 'Video';
      } else if (/cloudflare|unpkg|jsdelivr|bootstrapcdn/i.test(reqDomain)) {
        cat = 'CDN';
      }

      if (isThirdParty && !networkRequests.some((r) => r.domain === reqDomain && r.resourceType === resType)) {
        networkRequests.push({
          url: parsed.href,
          domain: reqDomain,
          resourceType: resType,
          isThirdParty: true,
          category: cat,
          timestamp: Date.now(),
        });
      }
    } catch {
      // ignore invalid relative resource strings
    }
  }

  // 4. CMP / Cookie Banner Detection
  const consent = detectConsentSystem($, html, combinedScriptsText, scriptSources);

  // 5. Detect Trackers & Pre-Consent Execution
  const detectedTrackers = detectTrackers(scriptSources, combinedScriptsText, html, initialCookies);
  trackers.push(...detectedTrackers);

  // Check: Is tracking executing pre-consent?
  const preConsentTrackers = trackers.filter((t) => t.detected && t.isPreConsent);
  if (preConsentTrackers.length > 0) {
    score -= 25;
    findings.push({
      id: 'f_tracking_preconsent',
      category: 'consent',
      severity: 'HIGH',
      title: 'Tracking-Aktivität vor Einwilligung erkannt (Pre-Consent)',
      description: `Es wurden ${preConsentTrackers.length} Tracking- oder Analysedienste festgestellt, die bereits beim initialen Seitenabruf ohne vorherige ausdrückliche Einwilligung (Opt-In) Daten erfassen oder Skripte laden.`,
      evidence: preConsentTrackers.map((t) => `${t.name} (${t.evidence})`).join(', '),
      recommendation: 'Passen Sie Ihr Consent-Management-System (CMP) so an, dass Tracking-Skripte (z. B. Google Analytics, Meta Pixel) erst nach einer aktiven, informierten Bestätigung des Nutzers geladen und ausgeführt werden.',
    });
  }

  if (!consent.cmpDetected) {
    score -= 20;
    findings.push({
      id: 'f_consent_missing',
      category: 'consent',
      severity: 'HIGH',
      title: 'Kein offensichtliches Cookie-Consent-Tool erkannt',
      description: 'Es konnte kein standardisiertes Banner oder Consent-Management-System (z. B. Usercentrics, Cookiebot, Borlabs) zur Einholung von Nutzereinwilligungen identifiziert werden.',
      evidence: 'Keine bekannten CMP-Signaturen oder Einwilligungs-Dialoge im DOM auffindbar.',
      recommendation: 'Falls nicht-technisch notwendige Cookies, Webfonts oder Tracking-Tools genutzt werden, implementieren Sie ein rechtskonformes Consent-Management-Tool mit gleichwertigen Optionen für "Alle akzeptieren" und "Ablehnen / Nur notwendige".',
    });
  } else if (!consent.hasRejectAllOrNecessary) {
    score -= 10;
    findings.push({
      id: 'f_consent_no_reject',
      category: 'consent',
      severity: 'MEDIUM',
      title: 'Ablehnen-Schaltfläche im Cookie-Banner nicht eindeutig',
      description: 'Das erkannte Cookie-Banner bietet auf der ersten Ebene möglicherweise keine gleichwertige und leicht auffindbare Option zum Ablehnen ("Nur notwendige") nicht-essenzieller Cookies (Verbot von Dark Patterns nach EuGH / DSGVO).',
      evidence: `Gefundene Schlagwörter: ${consent.bannerKeywordsFound.join(', ') || 'Nur Akzeptieren-Muster'}`,
      recommendation: 'Stellen Sie sicher, dass auf der ersten Ebene des Banners eine Schaltfläche wie "Nur essenzielle Cookies" oder "Ablehnen" optisch und funktionell gleichwertig zum "Alle akzeptieren"-Button vorhanden ist.',
    });
  }

  // 6. Third-Party Services (Google Fonts, Maps, YouTube, reCAPTCHA, etc.)
  const detectedServices = detectThirdPartyServices(allExternalUrls, html, combinedScriptsText);
  thirdPartyServices.push(...detectedServices);

  // Check specific high-impact German risks:
  const googleFontsRemote = detectedServices.find((s) => s.name === 'Google Fonts' && s.isPotentialIssue);
  if (googleFontsRemote) {
    score -= 10;
    findings.push({
      id: 'f_google_fonts_remote',
      category: 'third_party',
      severity: 'HIGH',
      title: 'Dynamisches Nachladen von Google Fonts von Google-Servern',
      description: 'Schriftarten werden direkt von US-Servern (fonts.googleapis.com / fonts.gstatic.com) geladen. Dabei wird die dynamische IP-Adresse der Website-Besucher an Google in die USA übertragen (Urteil des LG München I, Az. 3 O 17493/20).',
      evidence: googleFontsRemote.evidence,
      recommendation: 'Binden Sie die Schriftarten lokal auf Ihrem eigenen Webserver ein (Self-Hosting) oder sperren Sie die externe Verbindung vor der Einwilligung im Cookie-Banner.',
    });
  }

  const googleMapsRemote = detectedServices.find((s) => s.name === 'Google Maps' && s.isPotentialIssue);
  if (googleMapsRemote) {
    score -= 5;
    findings.push({
      id: 'f_google_maps_remote',
      category: 'third_party',
      severity: 'MEDIUM',
      title: 'Google Maps ohne 2-Klick-Lösung eingebunden',
      description: 'Google Maps wird direkt im iframe oder per Skript ohne vorgeschalteten Consent-Blocker geladen. Dies überträgt Nutzer- und Standortdaten ohne vorherige Zustimmung.',
      evidence: googleMapsRemote.evidence,
      recommendation: 'Integrieren Sie eine 2-Klick-Lösung oder koppeln Sie die Kartendarstellung an die Einwilligung im Cookie-Consent-Tool.',
    });
  }

  const youtubeEmbed = detectedServices.find((s) => s.name === 'YouTube' && s.isPotentialIssue);
  if (youtubeEmbed) {
    score -= 5;
    findings.push({
      id: 'f_youtube_remote',
      category: 'third_party',
      severity: 'MEDIUM',
      title: 'YouTube-Videos ohne erweiterten Datenschutzmodus oder Blocker',
      description: 'YouTube-Einbettungen laden externe Skripte und setzen Cookies, bevor der Nutzer das Video aktiv anklickt.',
      evidence: youtubeEmbed.evidence,
      recommendation: 'Nutzen Sie mindestens die Domain "youtube-nocookie.com" und schalten Sie einen Consent-Banner-Blocker vor die Videowiedergabe.',
    });
  }

  // 7. Impressum Detection
  const impressum = await findAndAnalyzeLegalPage($, finalUrl, /impressum|anbieterkennzeichnung|legal\s*notice|imprint/i, 'Impressum');
  if (!impressum.detected) {
    score -= 10;
    findings.push({
      id: 'f_impressum_missing',
      category: 'legal_pages',
      severity: 'HIGH',
      title: 'Kein offensichtliches Impressum erkannt',
      description: 'Auf der Startseite konnte kein direkter Link zu einer Anbieterkennzeichnung (Impressum gem. § 5 DDG) in Kopfzeile, Navigation oder Fußzeile gefunden werden.',
      evidence: 'Kein Link mit Text oder Ziel "Impressum" oder "Anbieterkennzeichnung" ermittelt.',
      recommendation: 'Fügen Sie einen jederzeit unmittelbar erreichbaren und leicht erkennbaren Link zum Impressum (vorzugsweise im Footer) ein.',
    });
  }

  // 8. Datenschutzerklärung Detection & Deep Analysis
  const datenschutz = await findAndAnalyzeLegalPage($, finalUrl, /datenschutz|datenschutzerklärung|privacy|privacy\s*policy|data\s*protection/i, 'Datenschutz');
  if (!datenschutz.detected) {
    score -= 20;
    findings.push({
      id: 'f_privacy_missing',
      category: 'legal_pages',
      severity: 'CRITICAL',
      title: 'Keine offensichtliche Datenschutzerklärung erkannt',
      description: 'Auf der Startseite konnte kein Link zu einer Datenschutzerklärung (Art. 13 DSGVO) gefunden werden. Website-Betreiber sind gesetzlich verpflichtet, über die Erhebung personenbezogener Daten zu informieren.',
      evidence: 'Kein Link mit Text oder Ziel "Datenschutz" oder "Privacy" auffindbar.',
      recommendation: 'Verlinken Sie eine vollständige, aktuelle Datenschutzerklärung von jeder Unterseite aus (mindestens im Footer).',
    });
  } else if (datenschutz.url) {
    // If detected, let's crawl the privacy policy page and analyze its sections
    try {
      const privacyFetch = await safeFetch(datenschutz.url);
      const $priv = cheerio.load(privacyFetch.bodyText);
      const privText = $priv('body').text().toLowerCase();

      datenschutz.contentSignals = {
        hasVerantwortlicher: /verantwortlicher|verantwortliche\s*stelle|name\s*und\s*anschrift/i.test(privText),
        hasContactInfo: /e-mail|email|telefon|kontakt/i.test(privText),
        hasProcessingPurposes: /zwecke?\s*der\s*verarbeitung|verarbeitungszwecke/i.test(privText),
        hasLegalBasis: /rechtsgrundlage|art\.?\s*6|berechtigtes\s*interesse|einwilligung/i.test(privText),
        hasDataRetention: /speicherdauer|löschung|aufbewahrungsfrist/i.test(privText),
        hasDataSubjectRights: /betroffenenrechte|auskunftsrecht|recht\s*auf\s*löschung|beschwerderecht|widerspruchsrecht/i.test(privText),
        hasCookiesSection: /cookies|cookie-richtlinie/i.test(privText),
        hasAnalyticsSection: /google\s*analytics|matomo|analyse-tools|tracking/i.test(privText),
        hasThirdPartySection: /drittanbieter|empfänger|weitergabe\s*an\s*dritte/i.test(privText),
        hasInternationalTransfers: /drittland|usa|data\s*privacy\s*framework|standardvertragsklauseln/i.test(privText),
        hasGoogleServicesSection: /google/i.test(privText),
        hasMetaSection: /facebook|meta|instagram/i.test(privText),
        hasHostingSection: /hosting|server-log|webhoster|provider/i.test(privText),
        hasFontsSection: /fonts|schriftarten|google\s*fonts/i.test(privText),
      };

      // Check if services detected on website are mentioned in privacy policy!
      if (googleFontsRemote && !datenschutz.contentSignals.hasFontsSection) {
        score -= 5;
        findings.push({
          id: 'f_privacy_missing_fonts',
          category: 'legal_pages',
          severity: 'MEDIUM',
          title: 'Google Fonts auf Website genutzt, aber in Datenschutzerklärung nicht eindeutig benannt',
          description: 'Auf der Website wurden Verbindungen zu Google Fonts festgestellt, in der Datenschutzerklärung fehlt jedoch ein entsprechender spezifischer Passus.',
          evidence: 'fonts.googleapis.com im Code, jedoch kein "Fonts"-Abschnitt in der Datenschutzerklärung identifiziert.',
          recommendation: 'Aktualisieren Sie die Datenschutzerklärung und ergänzen Sie einen Abschnitt über den Einsatz von Webfonts.',
        });
      }

      if (detectedTrackers.some((t) => t.name.includes('Google Analytics')) && !datenschutz.contentSignals.hasAnalyticsSection) {
        score -= 5;
        findings.push({
          id: 'f_privacy_missing_analytics',
          category: 'legal_pages',
          severity: 'MEDIUM',
          title: 'Google Analytics genutzt, aber in Datenschutzerklärung nicht klar beschrieben',
          description: 'Google Analytics wurde technisch nachgewiesen, aber ein klar erkennbarer Abschnitt zur Datenverarbeitung durch Google Analytics fehlt in der Datenschutzerklärung.',
          evidence: 'Tracking aktiv, kein Passus zu Google Analytics gefunden.',
          recommendation: 'Fügen Sie den gesetzlich vorgeschriebenen Informationsabschnitt zu Google Analytics, Auftragsverarbeitungsvertrag (AVV) und Widerrufsmöglichkeiten ein.',
        });
      }
    } catch {
      // Privacy page crawl error - keep basic info
    }
  }

  // 9. Build Comprehensive Cookie Inventory
  const allCookies: CookieItem[] = [...initialCookies];
  // Add simulated/detected client-side cookies based on active trackers
  for (const tr of trackers) {
    if (tr.detected) {
      if (tr.name === 'Google Analytics') {
        allCookies.push({
          name: '_ga',
          domain: `.${domain}`,
          path: '/',
          expiry: '2 Jahre',
          secure: true,
          httpOnly: false,
          sameSite: 'Lax',
          category: 'Statistik / Analytics',
          source: 'Google Analytics 4 (Client)',
          isPreConsent: tr.isPreConsent,
        });
        allCookies.push({
          name: '_ga_*',
          domain: `.${domain}`,
          path: '/',
          expiry: '2 Jahre',
          secure: true,
          httpOnly: false,
          sameSite: 'Lax',
          category: 'Statistik / Analytics',
          source: 'Google Analytics 4 Session Container',
          isPreConsent: tr.isPreConsent,
        });
      }
      if (tr.name === 'Meta Pixel') {
        allCookies.push({
          name: '_fbp',
          domain: `.${domain}`,
          path: '/',
          expiry: '3 Monate',
          secure: true,
          httpOnly: false,
          sameSite: 'Lax',
          category: 'Marketing / Tracking',
          source: 'Meta Pixel (Facebook)',
          isPreConsent: tr.isPreConsent,
        });
      }
      if (tr.name === 'Microsoft Clarity') {
        allCookies.push({
          name: '_clck',
          domain: `.${domain}`,
          path: '/',
          expiry: '1 Jahr',
          secure: true,
          httpOnly: false,
          sameSite: 'Lax',
          category: 'Statistik / Analytics',
          source: 'Microsoft Clarity',
          isPreConsent: tr.isPreConsent,
        });
      }
      if (tr.name === 'Hotjar') {
        allCookies.push({
          name: '_hjSessionUser_*',
          domain: `.${domain}`,
          path: '/',
          expiry: '1 Jahr',
          secure: true,
          httpOnly: false,
          sameSite: 'Lax',
          category: 'Statistik / Analytics',
          source: 'Hotjar Behavioral Analytics',
          isPreConsent: tr.isPreConsent,
        });
      }
    }
  }

  // Update consent counts
  consent.preConsentCookiesCount = allCookies.filter((c) => c.isPreConsent).length;
  consent.preConsentTrackersCount = preConsentTrackers.length;
  consent.postConsentCookiesCount = allCookies.length + 2;
  consent.postConsentTrackersCount = trackers.filter((t) => t.detected).length;
  consent.trackingBeforeConsentDetected = preConsentTrackers.length > 0;

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine Risk Level
  let riskLevel: RiskLevel = 'LOW';
  if (score < 55) riskLevel = 'HIGH';
  else if (score < 80) riskLevel = 'MEDIUM';

  // Summary counts
  const highRiskFindings = findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
  const warnings = findings.filter((f) => f.severity === 'MEDIUM' || f.severity === 'LOW').length;
  const totalIssues = findings.length;
  const passedChecks = Math.max(0, 10 - totalIssues);

  // Prioritized Recommendations
  const recommendations: ScanResult['recommendations'] = [];
  let prio = 1;

  if (findings.some((f) => f.id === 'f_https_missing')) {
    recommendations.push({
      priority: prio++,
      title: 'HTTPS-Verschlüsselung sofort aktivieren',
      description: 'Zertifikat einbinden und permanente 301-Weiterleitung von http:// auf https:// erzwingen.',
      impact: 'HOCH',
    });
  }

  if (preConsentTrackers.length > 0) {
    recommendations.push({
      priority: prio++,
      title: 'Tracking vor Nutzereinwilligung unterbinden (Opt-In statt Opt-Out)',
      description: 'Laden von Google Analytics, Meta Pixel oder Marketing-Skripten blockieren, bis der Besucher im Consent-Banner aktiv zugestimmt hat.',
      impact: 'HOCH',
    });
  }

  if (findings.some((f) => f.id === 'f_google_fonts_remote')) {
    recommendations.push({
      priority: prio++,
      title: 'Google Fonts lokal hosten (Self-Hosting)',
      description: 'Schriftarten herunterladen und lokal vom eigenen Webserver ausliefern, um US-Server-Verbindungen zu vermeiden.',
      impact: 'HOCH',
    });
  }

  if (findings.some((f) => f.id === 'f_consent_missing' || f.id === 'f_consent_no_reject')) {
    recommendations.push({
      priority: prio++,
      title: 'Rechtskonformes Cookie-Consent-Management optimieren',
      description: 'Einen transparenten Einwilligungs-Dialog mit gleichwertiger "Ablehnen"-Schaltfläche auf der ersten Ebene einbinden.',
      impact: 'MITTEL',
    });
  }

  if (findings.some((f) => f.id === 'f_impressum_missing' || f.id === 'f_privacy_missing')) {
    recommendations.push({
      priority: prio++,
      title: 'Rechtliche Pflichtseiten (Impressum & Datenschutz) vervollständigen',
      description: 'Verlinkungen von allen Unterseiten und in allen Navigationsebenen leicht auffindbar bereitstellen.',
      impact: 'HOCH',
    });
  }

  if (findings.some((f) => f.id.startsWith('f_privacy_missing_'))) {
    recommendations.push({
      priority: prio++,
      title: 'Datenschutzerklärung um tatsächlich genutzte Dienste ergänzen',
      description: 'Prüfen Sie, ob alle aktiven Drittanbieter-Tools und Cookies lückenlos in der Datenschutzerklärung aufgeführt sind.',
      impact: 'MITTEL',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 1,
      title: 'Regelmäßige technische Datenschutz-Audits beibehalten',
      description: 'Führen Sie bei neuen Plugins, Skripten oder Design-Änderungen fortlaufende Kontrollen durch.',
      impact: 'GERING',
    });
  }

  const durationMs = Date.now() - startTime;

  return {
    id: scanId,
    url: finalUrl,
    domain,
    scanDate: new Date().toISOString(),
    durationMs,
    score,
    riskLevel,
    https: {
      enabled: finalIsHttps,
      protocol: finalIsHttps ? 'TLS 1.3 / HTTPS' : 'Unverschlüsselt (HTTP)',
    },
    impressum,
    datenschutz,
    consent,
    trackers,
    thirdPartyServices,
    cookies: allCookies,
    networkRequests,
    findings,
    summary: {
      totalIssues,
      passedChecks,
      warnings,
      highRiskFindings,
    },
    recommendations,
  };
}

/**
 * Helpers
 */
function parseCookiesFromHeaders(setCookieHeader: string, domain: string, isPreConsent: boolean): CookieItem[] {
  if (!setCookieHeader) return [];
  const items: CookieItem[] = [];
  const cookieStrings = setCookieHeader.split(/,(?=\s*[^;]+=)/g);

  for (const cStr of cookieStrings) {
    const parts = cStr.split(';').map((p) => p.trim());
    if (parts.length === 0) continue;
    const [name, ...valParts] = parts[0].split('=');
    if (!name) continue;

    const cookieName = name.trim();
    const cookieDomain = parts.find((p) => p.toLowerCase().startsWith('domain='))?.split('=')[1] || domain;
    const cookiePath = parts.find((p) => p.toLowerCase().startsWith('path='))?.split('=')[1] || '/';
    const secure = parts.some((p) => p.toLowerCase() === 'secure');
    const httpOnly = parts.some((p) => p.toLowerCase() === 'httponly');
    const sameSite = parts.find((p) => p.toLowerCase().startsWith('samesite='))?.split('=')[1] || 'Lax';
    const expires = parts.find((p) => p.toLowerCase().startsWith('expires=') || p.toLowerCase().startsWith('max-age='))?.split('=')[1];

    let category: CookieItem['category'] = 'Unbekannt';
    if (cookieName.startsWith('_ga') || cookieName.startsWith('_gid') || cookieName.includes('analytics')) {
      category = 'Statistik / Analytics';
    } else if (cookieName.startsWith('_fb') || cookieName.includes('pixel') || cookieName.includes('ads')) {
      category = 'Marketing / Tracking';
    } else if (/session|csrf|token|phpsessid|jsessionid|borlabs|cookiebot|usercentrics/i.test(cookieName)) {
      category = 'Notwendig';
    }

    items.push({
      name: cookieName,
      domain: cookieDomain,
      path: cookiePath,
      expiry: expires || 'Session',
      secure,
      httpOnly,
      sameSite,
      category,
      source: 'Set-Cookie Header (HTTP)',
      isPreConsent,
    });
  }

  return items;
}

function detectConsentSystem($: cheerio.CheerioAPI, html: string, scriptsText: string, scriptSources: string[]): ConsentAnalysis {
  const allSources = scriptSources.join(' ').toLowerCase();
  const allText = $('body').text().toLowerCase();
  const fullHtml = html.toLowerCase();

  let cmpDetected = false;
  let cmpName: string | undefined;
  let cmpType: 'known_cmp' | 'custom' | 'none' = 'none';

  // Known CMPs
  if (allSources.includes('cookiebot') || fullHtml.includes('cookiebotdeclaration') || fullHtml.includes('cookiebot')) {
    cmpDetected = true;
    cmpName = 'Cookiebot';
    cmpType = 'known_cmp';
  } else if (allSources.includes('usercentrics') || fullHtml.includes('usercentrics') || fullHtml.includes('uc-banner')) {
    cmpDetected = true;
    cmpName = 'Usercentrics';
    cmpType = 'known_cmp';
  } else if (allSources.includes('cookielaw') || allSources.includes('onetrust') || fullHtml.includes('ot-sdk')) {
    cmpDetected = true;
    cmpName = 'OneTrust';
    cmpType = 'known_cmp';
  } else if (fullHtml.includes('borlabs-cookie') || fullHtml.includes('borlabscookie') || allSources.includes('borlabs')) {
    cmpDetected = true;
    cmpName = 'Borlabs Cookie (WordPress)';
    cmpType = 'known_cmp';
  } else if (fullHtml.includes('cmplz-cookiebanner') || allSources.includes('complianz')) {
    cmpDetected = true;
    cmpName = 'Complianz (WordPress)';
    cmpType = 'known_cmp';
  } else if (allSources.includes('didomi') || fullHtml.includes('didomi')) {
    cmpDetected = true;
    cmpName = 'Didomi';
    cmpType = 'known_cmp';
  } else if (allSources.includes('consentmanager') || fullHtml.includes('consentmanager')) {
    cmpDetected = true;
    cmpName = 'ConsentManager';
    cmpType = 'known_cmp';
  } else if (allSources.includes('cookieyes') || fullHtml.includes('cookieyes')) {
    cmpDetected = true;
    cmpName = 'CookieYes';
    cmpType = 'known_cmp';
  } else if (fullHtml.includes('ccm19') || allSources.includes('ccm19')) {
    cmpDetected = true;
    cmpName = 'CCM19';
    cmpType = 'known_cmp';
  } else if (fullHtml.includes('klaro') || allSources.includes('klaro')) {
    cmpDetected = true;
    cmpName = 'Klaro!';
    cmpType = 'known_cmp';
  }

  // Generic German keywords
  const bannerKeywords: string[] = [];
  const hasAcceptAll = /alle\s*akzeptieren|alle\s*annehmen|alles\s*akzeptieren|alle\s*cookies\s*akzeptieren|zustimmen/i.test(fullHtml);
  const hasRejectAllOrNecessary = /ablehnen|nur\s*notwendige|nur\s*essenzielle|nur\s*erforderliche|verweigern|ohne\s*einwilligung/i.test(fullHtml);
  const hasSettings = /einstellungen|anpassen|präferenzen|auswahl\s*speichern|cookie-einstellungen/i.test(fullHtml);

  if (hasAcceptAll) bannerKeywords.push('Alle akzeptieren');
  if (hasRejectAllOrNecessary) bannerKeywords.push('Nur notwendige / Ablehnen');
  if (hasSettings) bannerKeywords.push('Cookie-Einstellungen');

  if (!cmpDetected && (hasAcceptAll || hasSettings || /cookie-banner|cookie-notice|dsgvo-banner/i.test(fullHtml))) {
    cmpDetected = true;
    cmpName = 'Eigenes / Individuelles Cookie-Banner';
    cmpType = 'custom';
  }

  return {
    cmpDetected,
    cmpName,
    cmpType,
    bannerKeywordsFound: bannerKeywords,
    hasAcceptAll,
    hasRejectAllOrNecessary,
    hasSettings,
    preConsentCookiesCount: 0,
    preConsentTrackersCount: 0,
    postConsentCookiesCount: 0,
    postConsentTrackersCount: 0,
    trackingBeforeConsentDetected: false,
  };
}

function detectTrackers(sources: string[], scriptsText: string, html: string, cookies: CookieItem[]): TrackerItem[] {
  const allSources = sources.join(' ').toLowerCase();
  const allScripts = scriptsText.toLowerCase();
  const full = (allSources + ' ' + allScripts + ' ' + html.toLowerCase());

  const trackersList: TrackerItem[] = [];

  // Google Analytics / GA4
  const gaDetected =
    allSources.includes('google-analytics.com/analytics.js') ||
    allSources.includes('googletagmanager.com/gtag/js') ||
    allScripts.includes('gtag(\'config\', \'g-') ||
    allScripts.includes('gtag("config", "g-') ||
    cookies.some((c) => c.name === '_ga' || c.name.startsWith('_ga_'));

  trackersList.push({
    name: 'Google Analytics',
    category: 'Analytics / Statistik',
    detected: gaDetected,
    evidence: gaDetected ? 'gtag.js / GA4 ID / _ga Cookie im Quelltext nachgewiesen' : '',
    isPreConsent: gaDetected, // In static scan, presence in raw HTML indicates pre-consent firing
    notes: 'Erfordert aktive Einwilligung vor Datenerhebung gem. TDDDG / DSGVO.',
  });

  // Google Tag Manager
  const gtmDetected =
    allSources.includes('googletagmanager.com/gtm.js') ||
    allScripts.includes('gtm-') ||
    full.includes('www.googletagmanager.com/ns.html?id=');

  trackersList.push({
    name: 'Google Tag Manager',
    category: 'Tag Management',
    detected: gtmDetected,
    evidence: gtmDetected ? 'googletagmanager.com/gtm.js geladen' : '',
    isPreConsent: gtmDetected,
    notes: 'Darf nach BGH/DSGVO keine nicht-zugestimmten Tracker unkontrolliert nachladen.',
  });

  // Meta Pixel (Facebook)
  const metaDetected =
    allSources.includes('connect.facebook.net') ||
    allScripts.includes('fbq(\'init\'') ||
    allScripts.includes('fbq("init"') ||
    cookies.some((c) => c.name === '_fbp');

  trackersList.push({
    name: 'Meta Pixel',
    category: 'Marketing / Conversion',
    detected: metaDetected,
    evidence: metaDetected ? 'connect.facebook.net / fbq(\'init\') gefunden' : '',
    isPreConsent: metaDetected,
    notes: 'Übermittelt Nutzerprofile & Hashing-Parameter an Meta in die USA.',
  });

  // Google Ads / DoubleClick
  const gadsDetected =
    allSources.includes('googleadservices.com') ||
    allSources.includes('doubleclick.net') ||
    allScripts.includes('conversion.js');

  trackersList.push({
    name: 'Google Ads (Conversion & Remarketing)',
    category: 'Marketing / Advertising',
    detected: gadsDetected,
    evidence: gadsDetected ? 'googleadservices.com / DoubleClick Script erkannt' : '',
    isPreConsent: gadsDetected,
  });

  // Microsoft Clarity
  const clarityDetected =
    allSources.includes('clarity.ms') ||
    allScripts.includes('clarity("init"') ||
    allScripts.includes('clarity(\'init\'');

  trackersList.push({
    name: 'Microsoft Clarity',
    category: 'Session Recording / Heatmaps',
    detected: clarityDetected,
    evidence: clarityDetected ? 'clarity.ms/tag Script aktiv' : '',
    isPreConsent: clarityDetected,
  });

  // Hotjar
  const hotjarDetected =
    allSources.includes('static.hotjar.com') ||
    allScripts.includes('hjid') ||
    cookies.some((c) => c.name.includes('_hjSession'));

  trackersList.push({
    name: 'Hotjar',
    category: 'Session Recording / Feedback',
    detected: hotjarDetected,
    evidence: hotjarDetected ? 'static.hotjar.com nachgewiesen' : '',
    isPreConsent: hotjarDetected,
  });

  // LinkedIn Insight Tag
  const liDetected =
    allSources.includes('snap.licdn.com') ||
    allScripts.includes('_linkedin_partner_id');

  trackersList.push({
    name: 'LinkedIn Insight Tag',
    category: 'B2B Marketing / Tracking',
    detected: liDetected,
    evidence: liDetected ? 'snap.licdn.com nachgewiesen' : '',
    isPreConsent: liDetected,
  });

  // TikTok Pixel
  const ttDetected =
    allSources.includes('analytics.tiktok.com') ||
    allScripts.includes('ttq.load');

  trackersList.push({
    name: 'TikTok Pixel',
    category: 'Marketing / Advertising',
    detected: ttDetected,
    evidence: ttDetected ? 'analytics.tiktok.com nachgewiesen' : '',
    isPreConsent: ttDetected,
  });

  // Matomo
  const matomoDetected =
    allSources.includes('matomo.js') ||
    allSources.includes('piwik.js') ||
    allScripts.includes('_paq.push');

  trackersList.push({
    name: 'Matomo Analytics',
    category: 'Analytics (oft datenschutzfreundlich / Self-Hosted)',
    detected: matomoDetected,
    evidence: matomoDetected ? 'Matomo / Piwik Script gefunden' : '',
    isPreConsent: matomoDetected,
    notes: 'Bei Cookieless / Self-Hosting und deaktivierter IP-Speicherung oft ohne Consent nutzbar.',
  });

  return trackersList;
}

function detectThirdPartyServices(urls: string[], html: string, scriptsText: string): ThirdPartyService[] {
  const services: ThirdPartyService[] = [];
  const allUrlsJoined = urls.join(' ').toLowerCase();
  const lowerHtml = html.toLowerCase();

  // Google Fonts
  if (
    allUrlsJoined.includes('fonts.googleapis.com') ||
    allUrlsJoined.includes('fonts.gstatic.com') ||
    lowerHtml.includes('fonts.googleapis.com')
  ) {
    services.push({
      name: 'Google Fonts',
      category: 'fonts',
      domain: 'fonts.googleapis.com',
      evidence: 'Dynamischer Abruf von fonts.googleapis.com / fonts.gstatic.com',
      riskNote: 'Verbindung zu US-Servern bei Seitenaufruf ohne Einwilligung (LG München I, 3 O 17493/20). Empfehlung: Lokales Hosting.',
      isPotentialIssue: true,
    });
  }

  // Google Maps
  if (
    allUrlsJoined.includes('maps.googleapis.com') ||
    allUrlsJoined.includes('maps.google.com') ||
    lowerHtml.includes('maps.google.com/maps')
  ) {
    services.push({
      name: 'Google Maps',
      category: 'maps',
      domain: 'maps.googleapis.com',
      evidence: 'Google Maps API / iframe im Quelltext eingebunden',
      riskNote: 'Übermittelt IP-Adresse & ggf. Cookies an Google. Empfehlung: 2-Klick-Lösung.',
      isPotentialIssue: true,
    });
  }

  // YouTube
  if (
    allUrlsJoined.includes('youtube.com') ||
    allUrlsJoined.includes('youtube-nocookie.com') ||
    lowerHtml.includes('youtube.com/embed') ||
    lowerHtml.includes('youtube-nocookie.com/embed')
  ) {
    const isNoCookie = lowerHtml.includes('youtube-nocookie.com');
    services.push({
      name: 'YouTube',
      category: 'video',
      domain: isNoCookie ? 'youtube-nocookie.com' : 'youtube.com',
      evidence: isNoCookie ? 'YouTube (erweiterter Datenschutzmodus)' : 'Standard YouTube iframe eingebunden',
      riskNote: isNoCookie
        ? 'Erweiterter Datenschutzmodus aktiv, dennoch initialer Verbindungsaufbau zu Google-Servern.'
        : 'Direkte YouTube-Verbindung ohne 2-Klick-Lösung setzt Cookies vor Einwilligung.',
      isPotentialIssue: !isNoCookie,
    });
  }

  // Vimeo
  if (allUrlsJoined.includes('player.vimeo.com') || lowerHtml.includes('player.vimeo.com/video')) {
    services.push({
      name: 'Vimeo',
      category: 'video',
      domain: 'player.vimeo.com',
      evidence: 'Vimeo Player iframe erkannt',
      riskNote: 'Externe Medienverbindung. Sollte über Consent-Manager geschützt werden.',
      isPotentialIssue: true,
    });
  }

  // Google reCAPTCHA
  if (allUrlsJoined.includes('google.com/recaptcha') || allUrlsJoined.includes('recaptcha/api.js')) {
    services.push({
      name: 'Google reCAPTCHA',
      category: 'captcha',
      domain: 'google.com/recaptcha',
      evidence: 'reCAPTCHA v2 / v3 Script eingebunden',
      riskNote: 'Analysiert Nutzerverhalten und Hardwaremerkmale zur Bot-Abwehr. Erfordert Aufklärung & Rechtsgrundlage.',
      isPotentialIssue: true,
    });
  }

  // Cloudflare CDN
  if (allUrlsJoined.includes('cloudflare.com') || allUrlsJoined.includes('cdnjs.cloudflare.com')) {
    services.push({
      name: 'Cloudflare CDN',
      category: 'cdn',
      domain: 'cdnjs.cloudflare.com',
      evidence: 'Bibliotheken über Cloudflare CDN bezogen',
      riskNote: 'Drittanbieter-CDN zur Ladezeitoptimierung. Oft berechtigtes Interesse, erfordert Erwähnung in Datenschutzerklärung.',
      isPotentialIssue: false,
    });
  }

  // Font Awesome (remote)
  if (allUrlsJoined.includes('kit.fontawesome.com') || allUrlsJoined.includes('use.fontawesome.com')) {
    services.push({
      name: 'Font Awesome CDN',
      category: 'fonts',
      domain: 'fontawesome.com',
      evidence: 'Font Awesome Remote Kit eingebunden',
      riskNote: 'Externes Icon-Hosting. Lokales Self-Hosting wird aus Datenschutzgründen empfohlen.',
      isPotentialIssue: true,
    });
  }

  // Social Media Embeds
  if (allUrlsJoined.includes('instagram.com/embed') || lowerHtml.includes('instgrm.embed')) {
    services.push({
      name: 'Instagram Embed',
      category: 'social',
      domain: 'instagram.com',
      evidence: 'Instagram Embed Skript gefunden',
      riskNote: 'Direkte Datenübertragung an Meta. Empfehlung: 2-Klick-Lösung.',
      isPotentialIssue: true,
    });
  }

  return services;
}

async function findAndAnalyzeLegalPage(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  regex: RegExp,
  label: string
): Promise<LegalPageAnalysis> {
  let detected = false;
  let targetUrl: string | undefined;
  let linkText: string | undefined;
  let foundIn: string = 'body';

  $('a').each((_, el) => {
    if (detected) return;
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    const ariaLabel = $(el).attr('aria-label') || '';

    if ((text && regex.test(text)) || (href && regex.test(href)) || regex.test(ariaLabel)) {
      detected = true;
      linkText = text || ariaLabel || href || label;
      if (href) {
        try {
          targetUrl = new URL(href, baseUrl).toString();
        } catch {
          targetUrl = href;
        }
      }

      // Check parent container
      const parent = $(el).parents('footer, header, nav').first();
      if (parent.length > 0) {
        foundIn = parent.prop('tagName')?.toLowerCase() || 'footer';
      }
    }
  });

  return {
    detected,
    url: targetUrl,
    title: label,
    linkText,
    foundIn,
  };
}
