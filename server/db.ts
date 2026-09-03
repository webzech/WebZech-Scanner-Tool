import fs from 'fs';
import path from 'path';
import { Lead, LeadFinderResult, ScanResult } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  scans: ScanResult[];
  leads: Lead[];
  leadFinder: LeadFinderResult[];
}

// Initial realistic seed scans so reports can be viewed instantly
const SEED_SCANS: ScanResult[] = [
  {
    id: 'scan_seed_1',
    url: 'https://praxis-dr-mueller-zahnarzt.de',
    domain: 'praxis-dr-mueller-zahnarzt.de',
    scanDate: '2026-09-02T14:22:00.000Z',
    durationMs: 1420,
    score: 62,
    riskLevel: 'MEDIUM',
    https: { enabled: true, protocol: 'TLS 1.3 / HTTPS' },
    impressum: {
      detected: true,
      url: 'https://praxis-dr-mueller-zahnarzt.de/impressum',
      title: 'Impressum',
      linkText: 'Impressum & Anbieterkennzeichnung',
      foundIn: 'footer',
    },
    datenschutz: {
      detected: true,
      url: 'https://praxis-dr-mueller-zahnarzt.de/datenschutz',
      title: 'Datenschutzerklärung',
      linkText: 'Datenschutz',
      foundIn: 'footer',
      contentSignals: {
        hasVerantwortlicher: true,
        hasContactInfo: true,
        hasProcessingPurposes: true,
        hasLegalBasis: true,
        hasDataRetention: true,
        hasDataSubjectRights: true,
        hasCookiesSection: true,
        hasAnalyticsSection: false,
        hasThirdPartySection: true,
        hasInternationalTransfers: false,
        hasGoogleServicesSection: true,
        hasMetaSection: false,
        hasHostingSection: true,
        hasFontsSection: false,
      },
    },
    consent: {
      cmpDetected: true,
      cmpName: 'Eigenes Cookie-Banner',
      cmpType: 'custom',
      bannerKeywordsFound: ['Alle akzeptieren', 'Cookie-Einstellungen'],
      hasAcceptAll: true,
      hasRejectAllOrNecessary: false,
      hasSettings: true,
      preConsentCookiesCount: 1,
      preConsentTrackersCount: 1,
      postConsentCookiesCount: 3,
      postConsentTrackersCount: 2,
      trackingBeforeConsentDetected: true,
    },
    trackers: [
      {
        name: 'Google Analytics',
        category: 'Analytics / Statistik',
        detected: true,
        evidence: 'gtag.js (G-88X9Z1) im Quelltext direkt eingebunden',
        isPreConsent: true,
        notes: 'Erfordert Opt-In vor Aktivierung.',
      },
      {
        name: 'Google Tag Manager',
        category: 'Tag Management',
        detected: false,
        evidence: '',
        isPreConsent: false,
      },
    ],
    thirdPartyServices: [
      {
        name: 'Google Fonts',
        category: 'fonts',
        domain: 'fonts.googleapis.com',
        evidence: 'fonts.googleapis.com/css2?family=Roboto:wght@300;400;700',
        riskNote: 'Direkter Verbindungsaufbau zu US-Servern (LG München I, 3 O 17493/20).',
        isPotentialIssue: true,
      },
      {
        name: 'Google Maps',
        category: 'maps',
        domain: 'maps.googleapis.com',
        evidence: 'Google Maps Anfahrtskarte ohne Blocker eingebunden',
        riskNote: 'Übermittelt IP-Adressen der Patienten an Google.',
        isPotentialIssue: true,
      },
    ],
    cookies: [
      {
        name: '_ga',
        domain: '.praxis-dr-mueller-zahnarzt.de',
        path: '/',
        expiry: '2 Jahre',
        secure: true,
        httpOnly: false,
        sameSite: 'Lax',
        category: 'Statistik / Analytics',
        source: 'Google Analytics 4',
        isPreConsent: true,
      },
      {
        name: 'cookie_notice_accepted',
        domain: 'praxis-dr-mueller-zahnarzt.de',
        path: '/',
        expiry: '1 Jahr',
        secure: true,
        httpOnly: false,
        sameSite: 'Lax',
        category: 'Notwendig',
        source: 'Cookie Consent Tool',
        isPreConsent: false,
      },
    ],
    networkRequests: [
      {
        url: 'https://fonts.googleapis.com/css2?family=Roboto',
        domain: 'fonts.googleapis.com',
        resourceType: 'stylesheet',
        isThirdParty: true,
        category: 'Fonts',
      },
      {
        url: 'https://www.googletagmanager.com/gtag/js?id=G-88X9Z1',
        domain: 'googletagmanager.com',
        resourceType: 'script',
        isThirdParty: true,
        category: 'Analytics',
      },
      {
        url: 'https://maps.googleapis.com/maps/api/js',
        domain: 'maps.googleapis.com',
        resourceType: 'script',
        isThirdParty: true,
        category: 'Maps',
      },
    ],
    findings: [
      {
        id: 'f_tracking_preconsent',
        category: 'consent',
        severity: 'HIGH',
        title: 'Tracking-Aktivität vor Einwilligung erkannt (Pre-Consent)',
        description: 'Google Analytics 4 sendet bereits beim ersten Aufruf der Startseite Daten an Google, bevor der Patient im Cookie-Banner zugestimmt hat.',
        evidence: 'gtag.js / G-88X9Z1 direkt im <head> geladen.',
        recommendation: 'Blockieren Sie das Laden des Analyse-Skripts, bis der Nutzer im Cookie-Banner aktiv "Zustimmen" geklickt hat.',
      },
      {
        id: 'f_google_fonts_remote',
        category: 'third_party',
        severity: 'HIGH',
        title: 'Dynamisches Nachladen von Google Fonts von US-Servern',
        description: 'Schriftarten werden direkt von fonts.googleapis.com bezogen. Dabei wird die dynamische IP-Adresse der Website-Besucher unverschlüsselt übertragen.',
        evidence: 'fonts.googleapis.com/css2 im Header eingebunden.',
        recommendation: 'Hosten Sie die Webfonts lokal auf Ihrem Server (Self-Hosting). WebZech kann dies für Sie automatisiert umstellen.',
      },
      {
        id: 'f_consent_no_reject',
        category: 'consent',
        severity: 'MEDIUM',
        title: 'Ablehnen-Schaltfläche im Cookie-Banner nicht gleichwertig',
        description: 'Im Cookie-Banner fehlt eine prominente "Nur notwendige"-Schaltfläche auf der ersten Ebene.',
        evidence: 'Gefundene Schaltflächen: "Alle akzeptieren", "Einstellungen".',
        recommendation: 'Bieten Sie einen gleichwertigen Button "Nur essenzielle Cookies" an, um Bußgeldrisiken zu minimieren.',
      },
      {
        id: 'f_google_maps_remote',
        category: 'third_party',
        severity: 'MEDIUM',
        title: 'Google Maps ohne vorgeschaltete 2-Klick-Lösung',
        description: 'Die Anfahrtskarte wird sofort geladen, ohne dass der Besucher vorher eine Vorschalt-Schaltfläche betätigt.',
        evidence: 'maps.googleapis.com iframe im Kontaktbereich.',
        recommendation: 'Integrieren Sie eine 2-Klick-Lösung für die Anfahrtskarte.',
      },
    ],
    summary: {
      totalIssues: 4,
      passedChecks: 6,
      warnings: 2,
      highRiskFindings: 2,
    },
    recommendations: [
      {
        priority: 1,
        title: 'Tracking vor Nutzereinwilligung unterbinden (Opt-In)',
        description: 'Google Analytics erst nach Bestätigung laden.',
        impact: 'HOCH',
      },
      {
        priority: 2,
        title: 'Google Fonts lokal hosten (Self-Hosting)',
        description: 'Schriftarten auf den eigenen Webserver verschieben.',
        impact: 'HOCH',
      },
      {
        priority: 3,
        title: 'Ablehnen-Schaltfläche im Banner ergänzen',
        description: 'Transparente Auswahlmöglichkeit für Patienten schaffen.',
        impact: 'MITTEL',
      },
    ],
  },
  {
    id: 'scan_seed_2',
    url: 'https://kanzlei-dr-schmidt.de',
    domain: 'kanzlei-dr-schmidt.de',
    scanDate: '2026-09-02T10:15:00.000Z',
    durationMs: 980,
    score: 95,
    riskLevel: 'LOW',
    https: { enabled: true, protocol: 'TLS 1.3 / HTTPS' },
    impressum: {
      detected: true,
      url: 'https://kanzlei-dr-schmidt.de/impressum',
      title: 'Impressum',
      linkText: 'Impressum',
      foundIn: 'footer',
    },
    datenschutz: {
      detected: true,
      url: 'https://kanzlei-dr-schmidt.de/datenschutz',
      title: 'Datenschutzerklärung',
      linkText: 'Datenschutz',
      foundIn: 'footer',
      contentSignals: {
        hasVerantwortlicher: true,
        hasContactInfo: true,
        hasProcessingPurposes: true,
        hasLegalBasis: true,
        hasDataRetention: true,
        hasDataSubjectRights: true,
        hasCookiesSection: true,
        hasAnalyticsSection: true,
        hasThirdPartySection: true,
        hasInternationalTransfers: true,
        hasGoogleServicesSection: false,
        hasMetaSection: false,
        hasHostingSection: true,
        hasFontsSection: true,
      },
    },
    consent: {
      cmpDetected: true,
      cmpName: 'Usercentrics Consent Management',
      cmpType: 'known_cmp',
      bannerKeywordsFound: ['Alle akzeptieren', 'Nur notwendige', 'Cookie-Einstellungen'],
      hasAcceptAll: true,
      hasRejectAllOrNecessary: true,
      hasSettings: true,
      preConsentCookiesCount: 1,
      preConsentTrackersCount: 0,
      postConsentCookiesCount: 1,
      postConsentTrackersCount: 0,
      trackingBeforeConsentDetected: false,
    },
    trackers: [
      {
        name: 'Matomo Analytics',
        category: 'Analytics (Self-Hosted)',
        detected: true,
        evidence: 'matomo.kanzlei-dr-schmidt.de (cookieless, IP-anonymisiert)',
        isPreConsent: false,
        notes: 'Datenschutzfreundlich konfiguriert.',
      },
    ],
    thirdPartyServices: [],
    cookies: [
      {
        name: 'uc_consent',
        domain: 'kanzlei-dr-schmidt.de',
        path: '/',
        expiry: '180 Tage',
        secure: true,
        httpOnly: false,
        sameSite: 'Lax',
        category: 'Notwendig',
        source: 'Usercentrics CMP',
        isPreConsent: true,
      },
    ],
    networkRequests: [],
    findings: [
      {
        id: 'f_info_clean',
        category: 'security',
        severity: 'INFO',
        title: 'Vorbildliche technische Datenschutz-Konfiguration',
        description: 'Keine Drittanbieter-Schriftarten oder ungesicherte Tracker im Quelltext festgestellt. Webfonts werden lokal gehostet.',
        evidence: 'Keine Verbindungen zu US-CDNs oder Werbenetzwerken ermittelt.',
        recommendation: 'Behalten Sie diese Konfiguration bei regelmäßigen System-Updates bei.',
      },
    ],
    summary: {
      totalIssues: 0,
      passedChecks: 10,
      warnings: 0,
      highRiskFindings: 0,
    },
    recommendations: [
      {
        priority: 1,
        title: 'Regelmäßige technische Audits fortführen',
        description: 'Kontrollieren Sie quartalsweise, ob neue Plugins unerwünschte Skripte einbinden.',
        impact: 'GERING',
      },
    ],
  },
];

const SEED_LEAD_FINDER: LeadFinderResult[] = [
  {
    businessName: 'Zahnarztpraxis Dr. med. dent. Florian Weber',
    category: 'Zahnarzt',
    city: 'München',
    domain: 'zahnarzt-weber-muenchen.de',
    url: 'https://zahnarzt-weber-muenchen.de',
    phone: '+49 89 2145890',
    score: 48,
    riskLevel: 'HIGH',
    lastScanned: '2026-09-02T16:10:00.000Z',
    status: 'SCANNED',
  },
  {
    businessName: 'Steuerberaterkanzlei Klinger & Partner',
    category: 'Steuerberater',
    city: 'München',
    domain: 'klinger-steuerberatung.de',
    url: 'https://klinger-steuerberatung.de',
    phone: '+49 89 5422001',
    score: 58,
    riskLevel: 'MEDIUM',
    lastScanned: '2026-09-02T17:30:00.000Z',
    status: 'SCANNED',
  },
  {
    businessName: 'Boutique Hotel Maximilian',
    category: 'Hotel',
    city: 'München',
    domain: 'hotel-maximilian-muenchen.de',
    url: 'https://hotel-maximilian-muenchen.de',
    phone: '+49 89 9876543',
    score: 41,
    riskLevel: 'HIGH',
    lastScanned: '2026-09-01T11:00:00.000Z',
    status: 'SCANNED',
  },
  {
    businessName: 'Rechtsanwälte Dr. Bauer & Kollegen',
    category: 'Rechtsanwalt',
    city: 'Berlin',
    domain: 'kanzlei-bauer-berlin.de',
    url: 'https://kanzlei-bauer-berlin.de',
    phone: '+49 30 8877665',
    score: 74,
    riskLevel: 'MEDIUM',
    lastScanned: '2026-09-02T19:00:00.000Z',
    status: 'SCANNED',
  },
  {
    businessName: 'Dermatologie am Kurfürstendamm',
    category: 'Hautarzt',
    city: 'Berlin',
    domain: 'hautarzt-kudamm.de',
    url: 'https://hautarzt-kudamm.de',
    phone: '+49 30 3344556',
    score: 89,
    riskLevel: 'LOW',
    lastScanned: '2026-09-02T18:00:00.000Z',
    status: 'SCANNED',
  },
  {
    businessName: 'Gourmet Restaurant Hafenblick',
    category: 'Restaurant',
    city: 'Hamburg',
    domain: 'restaurant-hafenblick-hh.de',
    url: 'https://restaurant-hafenblick-hh.de',
    phone: '+49 40 1234567',
    score: 52,
    riskLevel: 'HIGH',
    lastScanned: '2026-09-02T14:40:00.000Z',
    status: 'SCANNED',
  },
];

const SEED_LEADS: Lead[] = [
  {
    id: 'lead_1',
    scanId: 'scan_seed_1',
    domain: 'praxis-dr-mueller-zahnarzt.de',
    contactName: 'Dr. Florian Müller',
    email: 'praxis@dr-mueller-zahnarzt.de',
    phone: '+49 89 7788990',
    companyName: 'Zahnarztpraxis Dr. Müller',
    message: 'Wir haben eine Abmahnung wegen Google Fonts erhalten und möchten unsere Website schnellstmöglich durch WebZech bereinigen lassen.',
    status: 'NEU',
    createdAt: '2026-09-02T14:35:00.000Z',
  },
];

class Database {
  private data: DatabaseSchema = {
    scans: [...SEED_SCANS],
    leads: [...SEED_LEADS],
    leadFinder: [...SEED_LEAD_FINDER],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.scans && Array.isArray(parsed.scans)) {
          this.data.scans = parsed.scans;
        }
        if (parsed.leads && Array.isArray(parsed.leads)) {
          this.data.leads = parsed.leads;
        }
        if (parsed.leadFinder && Array.isArray(parsed.leadFinder)) {
          this.data.leadFinder = parsed.leadFinder;
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // Scans
  public getScans(): ScanResult[] {
    return this.data.scans.sort((a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime());
  }

  public getScanById(id: string): ScanResult | undefined {
    return this.data.scans.find((s) => s.id === id);
  }

  public saveScan(scan: ScanResult): ScanResult {
    // replace if exists or prepend
    const existingIndex = this.data.scans.findIndex((s) => s.id === scan.id || s.domain === scan.domain);
    if (existingIndex >= 0) {
      this.data.scans[existingIndex] = scan;
    } else {
      this.data.scans.unshift(scan);
    }
    this.save();
    return scan;
  }

  // Leads
  public getLeads(): Lead[] {
    return this.data.leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'status'>): Lead {
    const newLead: Lead = {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      status: 'NEU',
    };
    this.data.leads.unshift(newLead);
    this.save();
    return newLead;
  }

  public updateLeadStatus(id: string, status: Lead['status']): Lead | undefined {
    const lead = this.data.leads.find((l) => l.id === id);
    if (lead) {
      lead.status = status;
      this.save();
    }
    return lead;
  }

  // Lead Finder
  public getLeadFinderItems(category?: string, city?: string): LeadFinderResult[] {
    return this.data.leadFinder.filter((item) => {
      if (category && !item.category.toLowerCase().includes(category.toLowerCase())) return false;
      if (city && !item.city.toLowerCase().includes(city.toLowerCase())) return false;
      return true;
    });
  }

  public addOrUpdateLeadFinderItem(item: LeadFinderResult) {
    const index = this.data.leadFinder.findIndex((i) => i.domain === item.domain);
    if (index >= 0) {
      this.data.leadFinder[index] = item;
    } else {
      this.data.leadFinder.push(item);
    }
    this.save();
  }
}

export const db = new Database();
