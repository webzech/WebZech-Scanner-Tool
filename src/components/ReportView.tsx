import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Cookie,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  Globe,
  HelpCircle,
  Lock,
  Radio,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import { ScanResult } from '../types.js';
import { generatePdfReport } from '../utils/pdfGenerator.js';

interface ReportViewProps {
  scan: ScanResult;
  onNewScan: () => void;
  onOpenConsultation: () => void;
}

type TabType = 'overview' | 'legal' | 'consent' | 'tracking' | 'thirdparty' | 'cookies' | 'network' | 'recommendations';

export const ReportView: React.FC<ReportViewProps> = ({ scan, onNewScan, onOpenConsultation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const riskBadgeStyles = {
    LOW: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      pill: 'bg-emerald-600 text-white',
      border: 'border-emerald-500',
      label: 'Geringes technisches Risiko',
    },
    MEDIUM: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      pill: 'bg-amber-600 text-white',
      border: 'border-amber-500',
      label: 'Mittleres technisches Risiko',
    },
    HIGH: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      pill: 'bg-rose-600 text-white',
      border: 'border-rose-500',
      label: 'Hohes technisches Risiko',
    },
  }[scan.riskLevel];

  const exportCsv = () => {
    const rows = [
      ['Kategorie', 'Schweregrad', 'Titel', 'Beschreibung', 'Beweis / Evidenz', 'Empfehlung'],
      ...scan.findings.map((f) => [f.category, f.severity, f.title, f.description, f.evidence, f.recommendation]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${(val || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DSGVO_Findings_${scan.domain}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Breadcrumb / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Technischer Prüfbericht • WebZech DSGVO Scan</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{scan.domain}</h2>
            <a
              href={scan.url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-700 transition-colors"
              title="Website aufrufen"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Geprüft am{' '}
            {new Date(scan.scanDate).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            Uhr • Scandauer: {(scan.durationMs / 1000).toFixed(1)}s
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            id="pdf-download-btn"
            onClick={() => generatePdfReport(scan)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs border border-slate-800 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>PDF-Bericht</span>
          </button>

          <button
            id="csv-export-btn"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
            <span>CSV Export</span>
          </button>

          <button
            id="new-scan-btn"
            onClick={onNewScan}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Neuer Scan</span>
          </button>
        </div>
      </div>

      {/* Main Score & Summary Card - Geometric Balance */}
      <div className="my-8 bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Score Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-md bg-slate-50 border border-slate-200 text-center">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
              Technischer Risikoscore
            </div>

            <div className="relative my-2 flex items-center justify-center">
              <div
                className={`w-28 h-28 rounded-md border-4 ${riskBadgeStyles.border} flex flex-col items-center justify-center bg-white shadow-xs`}
              >
                <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">{scan.score}</span>
                <span className="text-[10px] font-mono font-bold text-slate-400">/ 100</span>
              </div>
            </div>

            <div className={`mt-3 inline-block px-2.5 py-1 rounded-sm text-[10px] font-mono font-extrabold uppercase border ${riskBadgeStyles.pill}`}>
              {riskBadgeStyles.label}
            </div>

            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed font-normal">
              Basiert auf automatisierten Prüfungen technischer Signale.
            </p>
          </div>

          {/* Right: Key Summary Statistics */}
          <div className="lg:col-span-8 flex flex-col justify-between h-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-semibold mb-1">Identifizierte Risiken</div>
                <div className="text-2xl font-black text-slate-900 font-mono">{scan.summary.totalIssues}</div>
                <div className="text-[10px] font-mono text-slate-500 font-medium">Bedarf Überprüfung</div>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-semibold mb-1">Bestandene Checks</div>
                <div className="text-2xl font-black text-emerald-600 font-mono">{scan.summary.passedChecks}</div>
                <div className="text-[10px] font-mono text-slate-500 font-medium">Unauffällig</div>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-semibold mb-1">Warnungen</div>
                <div className="text-2xl font-black text-amber-600 font-mono">{scan.summary.warnings}</div>
                <div className="text-[10px] font-mono text-slate-500 font-medium">Mittleres Risiko</div>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-semibold mb-1">Hohe Priorität</div>
                <div className="text-2xl font-black text-rose-600 font-mono">{scan.summary.highRiskFindings}</div>
                <div className="text-[10px] font-mono text-slate-500 font-medium">Dringend</div>
              </div>
            </div>

            {/* Quick Signal Check List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2 p-1.5 rounded-sm bg-slate-50/70 border border-slate-200/60">
                {scan.https.enabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="truncate">HTTPS: {scan.https.enabled ? 'Aktiv' : 'Fehlt'}</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-sm bg-slate-50/70 border border-slate-200/60">
                {scan.impressum.detected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="truncate">Impressum: {scan.impressum.detected ? 'Erkannt' : 'Nicht offensichtlich'}</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-sm bg-slate-50/70 border border-slate-200/60">
                {scan.datenschutz.detected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="truncate">Datenschutzerklärung: {scan.datenschutz.detected ? 'Erkannt' : 'Nicht offensichtlich'}</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-sm bg-slate-50/70 border border-slate-200/60">
                {scan.consent.cmpDetected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="truncate">Cookie-Banner: {scan.consent.cmpDetected ? scan.consent.cmpName : 'Nicht erkannt'}</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-sm bg-slate-50/70 border border-slate-200/60">
                {!scan.consent.trackingBeforeConsentDetected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="truncate">Pre-Consent Tracking: {scan.consent.trackingBeforeConsentDetected ? 'Aktiv vor Consent ⚠' : 'Keine Tracker vorab'}</span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-sm bg-slate-50/70 border border-slate-200/60">
                {scan.thirdPartyServices.some((s) => s.name === 'Google Fonts' && s.isPotentialIssue) ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span className="truncate">Google Fonts: {scan.thirdPartyServices.some((s) => s.name === 'Google Fonts' && s.isPotentialIssue) ? 'Remote von US-Servern ⚠' : 'Lokal / Nicht genutzt'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Banner inside Score Card */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-500">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Wichtiger Hinweis:</strong> Der technische Risikoscore spiegelt automatisierte Website-Signale wider und stellt <strong>keine Rechtsberatung</strong> dar. Er dient WebZech und Website-Betreibern zur Identifikation technischer Optimierungspotenziale.
          </p>
        </div>
      </div>

      {/* Navigation Tabs - Geometric Balance */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-200 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-sm transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          1. Übersicht & Befunde ({scan.findings.length})
        </button>

        <button
          onClick={() => setActiveTab('legal')}
          className={`px-3.5 py-2 rounded-sm transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === 'legal'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          2. Rechtliche Pflichtseiten
        </button>

        <button
          onClick={() => setActiveTab('consent')}
          className={`px-3.5 py-2 rounded-sm transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === 'consent'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          3. Cookie-Consent (Test A–E)
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-3.5 py-2 rounded-sm transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === 'tracking'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          4. Tracking & Analytics ({scan.trackers.filter((t) => t.detected).length})
        </button>

        <button
          onClick={() => setActiveTab('thirdparty')}
          className={`px-3.5 py-2 rounded-sm transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === 'thirdparty'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          5. Drittanbieter-Dienste ({scan.thirdPartyServices.length})
        </button>

        <button
          onClick={() => setActiveTab('cookies')}
          className={`px-3.5 py-2 rounded-sm transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === 'cookies'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          6. Cookies ({scan.cookies.length})
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-3.5 py-2 rounded-sm transition-all whitespace-nowrap cursor-pointer border ${
            activeTab === 'recommendations'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          7. Handlungsempfehlungen ({scan.recommendations.length})
        </button>
      </div>

      {/* Tab Content 1: Overview & Findings */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900">Detaillierte Befunde & Risikosignale</h3>
            <span className="text-xs text-slate-500 font-medium">
              Sortiert nach technischer Kritikalität
            </span>
          </div>

          {scan.findings.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900">Keine auffälligen technischen Risiken gefunden</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Die automatische Prüfung hat keine offensichtlichen Verstöße gegen TLS, fehlende Pflichtseiten oder pre-consent Tracker festgestellt.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {scan.findings.map((f) => {
                const isCritical = f.severity === 'CRITICAL';
                const isHigh = f.severity === 'HIGH';
                const isMed = f.severity === 'MEDIUM';

                const badgeBg = isCritical
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : isHigh
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isMed
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={f.id}
                    className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border uppercase ${badgeBg}`}>
                          {f.severity}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">{f.title}</h4>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 capitalize">Kategorie: {f.category}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">{f.description}</p>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-3 text-xs">
                      <div className="font-bold text-slate-700 mb-0.5">Technischer Nachweis / Evidenz:</div>
                      <code className="text-slate-600 font-mono text-[11px] break-all">{f.evidence}</code>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-slate-800 font-medium bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-900 font-bold">Empfohlene Lösung: </strong>
                        <span className="text-emerald-950/90">{f.recommendation}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Legal Pages */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Impressum Card */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Impressum (§ 5 DDG)</h4>
                    <div className="text-[11px] text-slate-500">Gesetzliche Anbieterkennzeichnung</div>
                  </div>
                </div>
                {scan.impressum.detected ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    ✓ Erkannt
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    ⚠ Nicht offensichtlich
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Fundort im Quelltext:</span>
                  <span className="font-medium capitalize">{scan.impressum.foundIn || 'Footer'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Link-Beschriftung:</span>
                  <span className="font-medium">{scan.impressum.linkText || 'Impressum'}</span>
                </div>
                <div className="py-1.5">
                  <span className="font-semibold text-slate-500 block mb-1">Ermittelte Zieladresse:</span>
                  <span className="font-mono text-[11px] text-slate-700 break-all">
                    {scan.impressum.url || 'Kein direkter Link auffindbar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Datenschutzerklärung Card */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Datenschutzerklärung (Art. 13 DSGVO)</h4>
                    <div className="text-[11px] text-slate-500">Informationspflichten bei Datenerhebung</div>
                  </div>
                </div>
                {scan.datenschutz.detected ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    ✓ Erkannt
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    ✕ Nicht offensichtlich
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Fundort im Quelltext:</span>
                  <span className="font-medium capitalize">{scan.datenschutz.foundIn || 'Footer'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Link-Beschriftung:</span>
                  <span className="font-medium">{scan.datenschutz.linkText || 'Datenschutz'}</span>
                </div>
                <div className="py-1.5">
                  <span className="font-semibold text-slate-500 block mb-1">Ermittelte Zieladresse:</span>
                  <span className="font-mono text-[11px] text-slate-700 break-all">
                    {scan.datenschutz.url || 'Kein direkter Link auffindbar'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Policy Content Signals Grid */}
          {scan.datenschutz.contentSignals && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Inhaltsprüfung der Datenschutzerklärung
              </h4>
              <p className="text-xs text-slate-500 mb-5">
                Automatisierte Erkennung von Kernklauseln und Informationsabschnitten gem. Art. 13/14 DSGVO.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Verantwortlicher', active: scan.datenschutz.contentSignals.hasVerantwortlicher },
                  { label: 'Kontaktdaten / E-Mail', active: scan.datenschutz.contentSignals.hasContactInfo },
                  { label: 'Verarbeitungszwecke', active: scan.datenschutz.contentSignals.hasProcessingPurposes },
                  { label: 'Rechtsgrundlagen (Art. 6)', active: scan.datenschutz.contentSignals.hasLegalBasis },
                  { label: 'Speicherdauer / Löschung', active: scan.datenschutz.contentSignals.hasDataRetention },
                  { label: 'Betroffenenrechte', active: scan.datenschutz.contentSignals.hasDataSubjectRights },
                  { label: 'Cookies-Abschnitt', active: scan.datenschutz.contentSignals.hasCookiesSection },
                  { label: 'Analytics / Tracking', active: scan.datenschutz.contentSignals.hasAnalyticsSection },
                  { label: 'Drittanbieter / Empfänger', active: scan.datenschutz.contentSignals.hasThirdPartySection },
                  { label: 'Drittlandübermittlung (USA)', active: scan.datenschutz.contentSignals.hasInternationalTransfers },
                  { label: 'Hosting & Server-Logs', active: scan.datenschutz.contentSignals.hasHostingSection },
                  { label: 'Webfonts / Google Fonts', active: scan.datenschutz.contentSignals.hasFontsSection },
                ].map((sig, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      sig.active
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {sig.active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[10px] text-slate-400">
                        ?
                      </div>
                    )}
                    <span className="font-medium truncate">{sig.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Cookie & Consent */}
      {activeTab === 'consent' && (
        <div className="space-y-6">
          {/* Banner Detection Overview */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Consent Management Platform (CMP)
                </div>
                <div className="text-lg font-black text-slate-900">
                  {scan.consent.cmpDetected ? scan.consent.cmpName : 'Kein standardisiertes Consent-Tool erkannt'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    scan.consent.cmpDetected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {scan.consent.cmpDetected ? 'CMP Aktiv' : 'Kein Banner'}
                </span>
              </div>
            </div>

            {/* Banner Buttons Check */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className={`p-4 rounded-xl border text-xs ${
                  scan.consent.hasAcceptAll
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold mb-1">Schaltfläche: Alle akzeptieren</div>
                <div className="text-[11px]">
                  {scan.consent.hasAcceptAll ? '✓ Eindeutig im Banner vorhanden' : 'Nicht sicher erkannt'}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border text-xs ${
                  scan.consent.hasRejectAllOrNecessary
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}
              >
                <div className="font-bold mb-1">Schaltfläche: Nur notwendige / Ablehnen</div>
                <div className="text-[11px]">
                  {scan.consent.hasRejectAllOrNecessary
                    ? '✓ Erste Ebene bietet Ablehnen-Option'
                    : '⚠ Fehlt auf erster Ebene (Dark Pattern Risiko)'}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border text-xs ${
                  scan.consent.hasSettings
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold mb-1">Schaltfläche: Einstellungen / Auswahl</div>
                <div className="text-[11px]">
                  {scan.consent.hasSettings ? '✓ Detaillierte Konfiguration möglich' : 'Keine differenzierte Auswahl'}
                </div>
              </div>
            </div>
          </div>

          {/* Test A - E Simulation Comparison (The Most Critical Cookie Test) */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              <h4 className="text-base font-extrabold text-slate-900">
                Wichtiger Cookie- & Trackingtest (Test A vs. Test C)
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Vergleich des Datenflusses vor jeder Nutzeraktion (Pre-Consent) gegenüber dem Zustand nach aktiver Einwilligung (Post-Consent).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vor Einwilligung */}
              <div
                className={`p-5 rounded-2xl border ${
                  scan.consent.trackingBeforeConsentDetected
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-emerald-50/40 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-slate-900 text-sm">Test A / B: Vor Einwilligung (Pre-Consent)</div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      scan.consent.trackingBeforeConsentDetected
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {scan.consent.trackingBeforeConsentDetected ? 'Auffällig' : 'Sauber'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Gesetzte Cookies:</span>
                    <span className="font-bold text-slate-900">{scan.consent.preConsentCookiesCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Feuernde Tracker / Skripte:</span>
                    <span
                      className={`font-bold ${
                        scan.consent.preConsentTrackersCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {scan.consent.preConsentTrackersCount}
                    </span>
                  </div>
                </div>

                {scan.consent.trackingBeforeConsentDetected && (
                  <div className="mt-4 p-3 bg-rose-100/80 rounded-xl text-xs text-rose-900 font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Verstoßrisiko:</strong> Analyse- oder Marketing-Tracker wurden bereits beim ersten Seitenaufruf vor der Einwilligung gestartet (Opt-Out statt Opt-In).
                    </span>
                  </div>
                )}
              </div>

              {/* Nach Einwilligung */}
              <div className="p-5 rounded-2xl border bg-slate-50 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-slate-900 text-sm">Test C: Nach "Alle akzeptieren"</div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">
                    Simuliert
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Gesamte Cookies nach Consent:</span>
                    <span className="font-bold text-slate-900">{scan.consent.postConsentCookiesCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Aktive Tracker:</span>
                    <span className="font-bold text-slate-900">{scan.consent.postConsentTrackersCount}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-100 rounded-xl text-xs text-slate-600 font-normal">
                  Nach der Einwilligung dürfen Tracking-Skripte und Drittanbieter-Dienste legitim geladen werden, sofern hierüber transparent belehrt wurde.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Tracking & Analytics */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Erkannte Tracking- & Analysetechnologien
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              Prüfung gängiger Tracking-Systeme auf Ausführung und Pre-Consent-Ladeverhalten.
            </p>

            <div className="divide-y divide-slate-100">
              {scan.trackers.map((tracker, idx) => (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        tracker.detected ? (tracker.isPreConsent ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-300'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{tracker.name}</div>
                      <div className="text-slate-500 text-[11px]">{tracker.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 text-right">
                    {tracker.detected ? (
                      <>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                          {tracker.evidence}
                        </span>
                        {tracker.isPreConsent ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">
                            ⚠ Pre-Consent aktiv
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            ✓ Blockiert vor Consent
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 font-medium">Nicht im Quelltext nachgewiesen</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 5: Third-Party Services */}
      {activeTab === 'thirdparty' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Eingebundene Drittanbieter-Dienste (Third-Party Requests)
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              Erkennung externer Dienste wie Google Fonts, Google Maps, YouTube oder CDNs. Ein Nachweis bedeutet nicht zwingend einen Verstoß, begründet aber Prüfbedarf.
            </p>

            {scan.thirdPartyServices.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Keine externen Drittanbieter-Dienste im Quelltext festgestellt.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {scan.thirdPartyServices.map((svc, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border text-xs ${
                      svc.isPotentialIssue
                        ? 'bg-rose-50/40 border-rose-200/80'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{svc.name}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono text-[10px]">
                          {svc.domain}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          svc.isPotentialIssue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {svc.isPotentialIssue ? '⚠ Potenzielles Risiko' : 'Unkritisch / Normal'}
                      </span>
                    </div>

                    <div className="text-slate-600 mb-2 font-normal leading-relaxed">{svc.riskNote}</div>
                    <div className="text-[11px] text-slate-500 font-mono break-all bg-white/70 p-2 rounded border border-slate-200/60">
                      Evidenz: {svc.evidence}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 6: Cookie Inventory */}
      {activeTab === 'cookies' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Vollständiges Cookie-Inventar</h4>
                <p className="text-xs text-slate-500">
                  Alle über HTTP-Header und Skriptanalyse identifizierten Cookies.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 px-2.5 py-1 bg-slate-100 rounded-lg">
                Gesamt: {scan.cookies.length} Cookies
              </span>
            </div>

            {scan.cookies.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Keine Cookies beim initialen Aufruf gesetzt.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                      <th className="py-2.5 px-3">Cookie-Name</th>
                      <th className="py-2.5 px-3">Kategorie</th>
                      <th className="py-2.5 px-3">Domain & Pfad</th>
                      <th className="py-2.5 px-3">Laufzeit</th>
                      <th className="py-2.5 px-3">Pre-Consent?</th>
                      <th className="py-2.5 px-3">Sicherheit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scan.cookies.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.name}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.category === 'Notwendig'
                                ? 'bg-slate-100 text-slate-700'
                                : c.category.includes('Analytics')
                                ? 'bg-blue-50 text-blue-800'
                                : c.category.includes('Marketing')
                                ? 'bg-purple-50 text-purple-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {c.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {c.domain} ({c.path})
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{c.expiry || 'Session'}</td>
                        <td className="py-2.5 px-3">
                          {c.isPreConsent ? (
                            <span className="text-rose-600 font-bold text-[11px]">Ja (vorab)</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Erst nach Consent</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">
                          {c.secure ? 'Secure' : 'Insecure'} • {c.httpOnly ? 'HttpOnly' : 'JS-Read'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 7: Prioritized Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Priorisierter Maßnahmenkatalog der WebZech Digitalagentur
            </h4>
            <p className="text-xs text-slate-500 mb-6">
              Konkrete technische Schritte zur Reduzierung von DSGVO- und TDDDG-Risiken für Ihre Website.
            </p>

            <div className="space-y-4">
              {scan.recommendations.map((rec) => (
                <div
                  key={rec.priority}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {rec.priority}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900">{rec.title}</h5>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                        rec.impact === 'HOCH'
                          ? 'bg-rose-100 text-rose-800'
                          : rec.impact === 'MITTEL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Dringlichkeit: {rec.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-8 font-normal">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WebZech Lead Generation CTA Box (Section 25 of Master Prompt) - Geometric Balance */}
      <div className="mt-12 bg-slate-900 rounded-lg p-6 sm:p-10 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-amber-400/10 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-3 border border-amber-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>WebZech Digitalagentur Service</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-white">
            Möchten Sie diese Probleme beheben?
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-normal">
            Wir helfen deutschen Unternehmen, Ärzten, Kanzleien und Online-Shops dabei, ihre Websites technisch zu optimieren, Google Fonts lokal einzubinden, CMPs rechtssicher zu konfigurieren und DSGVO-relevante Risiken zu reduzieren.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              id="cta-open-consultation-btn"
              onClick={onOpenConsultation}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer border border-amber-400"
            >
              <span>Kostenlose Erstberatung anfordern</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              id="cta-agency-optimize-btn"
              onClick={onOpenConsultation}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
            >
              <span>Website durch WebZech optimieren lassen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
