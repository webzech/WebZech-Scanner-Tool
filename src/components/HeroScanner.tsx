import { AlertCircle, ArrowRight, CheckCircle, Globe, Shield, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

interface HeroScannerProps {
  onStartScan: (url: string) => void;
  isScanning: boolean;
  onSelectSample: (scanId: string) => void;
}

export const HeroScanner: React.FC<HeroScannerProps> = ({ onStartScan, isScanning, onSelectSample }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setErrorMsg('Bitte geben Sie eine Domain oder URL ein (z. B. example.de).');
      return;
    }
    setErrorMsg('');
    onStartScan(inputUrl.trim());
  };

  return (
    <div className="relative pt-12 pb-16 md:pt-16 md:pb-20 border-b border-slate-200 bg-slate-50/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* WebZech Agency Tag with Geometric Balance styling */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-slate-900 text-white text-[11px] font-mono font-bold tracking-wide uppercase mb-6 shadow-xs border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>WebZech Agency Tool — DSGVO Website Risk Scanner</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight mb-4">
          Prüfen Sie Ihre Website auf <span className="underline decoration-amber-400 decoration-4 underline-offset-4">DSGVO-relevante Risiken</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Automatisierter technischer Website-Check für deutsche Unternehmen.
          Erkennt unzulässiges Tracking vor Einwilligung, dynamische Google Fonts, Cookie-Banner-Defizite und fehlende Pflichtangaben.
        </p>

        {/* URL Form - Geometric Balance precision */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2 p-1.5 bg-white rounded-lg shadow-sm border border-slate-300 focus-within:border-slate-800 transition-all">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3.5 text-slate-400">
                <Globe className="w-5 h-5" />
              </div>
              <input
                id="target-url-input"
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="https://ihre-website.de oder domain.de"
                disabled={isScanning}
                className="w-full pl-11 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent rounded-md focus:outline-hidden"
              />
            </div>
            <button
              id="start-scan-submit-btn"
              type="submit"
              disabled={isScanning}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-sm sm:text-base transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer border border-slate-800"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Prüfung läuft...</span>
                </>
              ) : (
                <>
                  <span>Website kostenlos prüfen</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 text-xs text-rose-600 font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        {/* Feature Badges - Geometric grid tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600 font-medium mb-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white border border-slate-200 shadow-xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Keine Registrierung erforderlich
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white border border-slate-200 shadow-xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Pre-Consent Tracking Check
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white border border-slate-200 shadow-xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Google Fonts & CMP-Analyse
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white border border-slate-200 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-slate-800" />
            SSRF-geprüfte Sicherheitsengine
          </span>
        </div>

        {/* Instant Demo Samples */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 max-w-2xl mx-auto text-left shadow-xs">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
            <span>Oder Sofort-Beispielberichte ansehen:</span>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-900 border border-amber-300/80 px-1.5 py-0.5 rounded-sm">
              1-Klick Demo
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              id="demo-sample-1-btn"
              onClick={() => onSelectSample('scan_seed_1')}
              className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-md border border-slate-200 text-left transition-all flex items-center justify-between group cursor-pointer hover:border-slate-300"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                  Praxis Dr. Müller (Zahnarzt)
                </div>
                <div className="text-[11px] font-mono text-amber-700 font-bold mt-0.5">
                  Score: 62/100 • Typische Risiken
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              id="demo-sample-2-btn"
              onClick={() => onSelectSample('scan_seed_2')}
              className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-md border border-slate-200 text-left transition-all flex items-center justify-between group cursor-pointer hover:border-slate-300"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                  Kanzlei Dr. Schmidt (Anwalt)
                </div>
                <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">
                  Score: 95/100 • Vorbildlich
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="mt-8 p-3.5 bg-amber-50/60 border border-amber-200 rounded-md text-left max-w-2xl mx-auto flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-950/90 leading-relaxed font-normal">
            <strong className="font-bold text-amber-950">Rechtlicher Hinweis:</strong> Der DSGVO Scan führt eine rein automatisierte technische Prüfung öffentlich zugänglicher Website-Signale durch. Die Ergebnisse stellen <strong>keine Rechtsberatung</strong>, keine verbindliche DSGVO-Bewertung und keine rechtliche Zertifizierung dar.
          </p>
        </div>
      </div>
    </div>
  );
};
