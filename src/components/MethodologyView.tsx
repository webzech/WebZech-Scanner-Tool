import { AlertCircle, CheckCircle2, FileCheck2, Lock, Radio, Scale, Shield, Sparkles } from 'lucide-react';
import React from 'react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-slate-900 text-white text-[10px] font-mono font-bold tracking-wider uppercase mb-2 border border-slate-800 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>Prüfkriterien & Methodik</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          So funktioniert der DSGVO Scan von WebZech
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto font-normal">
          Transparente Erläuterung unseres automatisierten Prüfverfahrens, der Punkteabzüge und der technischen Kriterien.
        </p>
      </div>

      {/* Prominent Legal Disclaimer Callout */}
      <div className="mb-10 p-5 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-3.5 text-xs text-amber-900 leading-relaxed shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-sm block mb-1">Rechtliche Klarstellung & Haftungsausschluss:</strong>
          Die Anwendung „DSGVO Scan“ führt eine <strong>rein automatisierte technische Prüfung</strong> öffentlich abrufbarer Quelltexte und Netzwerksignale durch. Die Ergebnisse stellen <strong>keine Rechtsberatung</strong>, keine verbindliche DSGVO-Bewertung und keine rechtliche Zertifizierung dar. Eine fundierte rechtliche Bewertung erfordert immer die Prüfung durch einen Rechtsanwalt oder qualifizierten Datenschutzbeauftragten.
        </div>
      </div>

      {/* 5 Check Areas */}
      <div className="space-y-4">
        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-sm bg-slate-900 text-amber-400 flex items-center justify-center font-mono font-bold text-xs border border-slate-800">
              01
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">HTTPS & Transportverschlüsselung (Art. 32 DSGVO)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Geprüft wird, ob die Website per TLS/SSL verschlüsselt ist und ob unverschlüsselte HTTP-Anfragen serverseitig permanent (301) auf HTTPS weitergeleitet werden. 
            <span className="block mt-1 font-mono font-semibold text-rose-700">Punkteabzug bei Fehlen: -25 Punkte.</span>
          </p>
        </div>

        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-sm bg-slate-900 text-amber-400 flex items-center justify-center font-mono font-bold text-xs border border-slate-800">
              02
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">Rechtliche Pflichtseiten: Impressum (§ 5 DDG) & Datenschutzerklärung (Art. 13 DSGVO)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Prüfung auf auffindbare, leicht erkennbare Links in Header, Footer und Navigation. Die ermittelte Datenschutzerklärung wird zudem auf Kernklauseln (Verantwortlicher, Rechtsgrundlagen, Speicherdauer, Betroffenenrechte, Hosting) gescannt.
            <span className="block mt-1 font-mono font-semibold text-rose-700">Punkteabzug: Fehlen Impressum (-10 Punkte), Fehlen Datenschutzerklärung (-20 Punkte).</span>
          </p>
        </div>

        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-sm bg-slate-900 text-amber-400 flex items-center justify-center font-mono font-bold text-xs border border-slate-800">
              03
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">Pre-Consent Tracking & Cookie-Consent (Test A bis E)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Der wichtigste technische Test: Werden Cookies oder Tracking-Skripte (z. B. Google Analytics 4, Meta Pixel) bereits beim ersten Seitenaufruf <em>vor</em> einer ausdrücklichen Einwilligung des Besuchers gestartet? Außerdem wird das Banner auf eine gleichwertige „Ablehnen / Nur notwendige“-Schaltfläche geprüft.
            <span className="block mt-1 font-mono font-semibold text-rose-700">Punkteabzug: Pre-Consent Tracking (-25 Punkte), Fehlen Consent-Tool (-20 Punkte), Fehlender Ablehnen-Button (-10 Punkte).</span>
          </p>
        </div>

        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-sm bg-slate-900 text-amber-400 flex items-center justify-center font-mono font-bold text-xs border border-slate-800">
              04
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">Drittanbieter-Verbindungen & Google Fonts (LG München I)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Prüfung auf das dynamische Nachladen von Schriftarten (fonts.googleapis.com), Google Maps oder YouTube-Videos. Nach dem Urteil des LG München I (Az. 3 O 17493/20) stellt die ungesicherte dynamische Übertragung der IP-Adresse an US-Server ohne Einwilligung ein Abmahnrisiko dar.
            <span className="block mt-1 font-mono font-semibold text-amber-800">Punkteabzug: Dynamische Google Fonts (-10 Punkte), Externe Medien (-5 Punkte).</span>
          </p>
        </div>

        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-sm bg-slate-900 text-amber-400 flex items-center justify-center font-mono font-bold text-xs border border-slate-800">
              05
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">SSRF-Sicherheit & Crawler-Architektur</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-10">
            Die Scan-Engine nutzt strenge Sicherheitsvorkehrungen gegen Server-Side Request Forgery (SSRF): Private IP-Bereiche, lokale Hostnamen und Cloud-Metadaten-Endpunkte sind strikt blockiert. Weiterleitungen werden auf maximal 5 begrenzt und die Antwortgröße auf 5 MB limitiert.
          </p>
        </div>
      </div>
    </div>
  );
};
