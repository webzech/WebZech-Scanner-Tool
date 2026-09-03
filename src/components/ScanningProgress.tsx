import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ScanningProgressProps {
  targetUrl: string;
}

const STAGES = [
  { title: 'DNS & SSRF-Sicherheitsüberprüfung', desc: 'IP-Bereiche, Portbeschränkungen und DNS-Validierung' },
  { title: 'Website & SSL/TLS-Verschlüsselung laden', desc: 'HTTPS-Zertifikat und Antwortzeit analysieren' },
  { title: 'Rechtliche Pflichtseiten lokalisieren', desc: 'Impressum (§ 5 DDG) & Datenschutzerklärung (Art. 13 DSGVO)' },
  { title: 'Consent-Management & Cookie-Banner prüfen', desc: 'CMP-Signaturen, Ablehnen-Button und Banner-Kategorien' },
  { title: 'Tracking & Pre-Consent Datenfluss prüfen', desc: 'Test A-E: Werden Tracker oder Cookies vor Einwilligung aktiv?' },
  { title: 'Technischen Risikobericht erstellen', desc: 'Deductions berechnen und Empfehlungen priorisieren' },
];

export const ScanningProgress: React.FC<ScanningProgressProps> = ({ targetUrl }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-xl mx-auto my-12 px-4">
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
          <div className="w-9 h-9 rounded-sm bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 border border-slate-800 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="overflow-hidden">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Laufende Analyse</div>
            <div className="text-sm sm:text-base font-mono font-bold text-slate-900 truncate">
              {targetUrl}
            </div>
          </div>
        </div>

        {/* Progress Stages */}
        <div className="mt-6 space-y-4">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div key={idx} className="flex items-start gap-3.5 transition-opacity duration-300">
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-sm border border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs sm:text-sm font-bold ${
                      isCompleted ? 'text-slate-800' : isCurrent ? 'text-slate-900 font-extrabold' : 'text-slate-400'
                    }`}
                  >
                    {stage.title}
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal truncate">{stage.desc}</div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-amber-50 text-amber-900 border border-amber-300/80 animate-pulse">
                    Prüfe...
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 font-mono">
          Die Prüfung dauert ca. 2 bis 8 Sekunden. Bitte das Fenster geöffnet lassen.
        </div>
      </div>
    </div>
  );
};
