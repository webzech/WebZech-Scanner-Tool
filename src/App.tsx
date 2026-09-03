import { AlertCircle, ArrowUpRight, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard.js';
import { ConsultationModal } from './components/ConsultationModal.js';
import { HeroScanner } from './components/HeroScanner.js';
import { LeadFinderView } from './components/LeadFinderView.js';
import { MethodologyView } from './components/MethodologyView.js';
import { Navbar } from './components/Navbar.js';
import { ReportView } from './components/ReportView.js';
import { ScanningProgress } from './components/ScanningProgress.js';
import { ScanResult } from './types.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'scanner' | 'lead-finder' | 'dashboard' | 'methodology'>('scanner');
  const [activeScan, setActiveScan] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTargetUrl, setScanTargetUrl] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);

  // Consultation Modal
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [consultationDomain, setConsultationDomain] = useState('');

  const handleStartScan = async (url: string) => {
    setIsScanning(true);
    setScanTargetUrl(url);
    setScanError(null);
    setCurrentTab('scanner');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler bei der Website-Analyse.');
      }

      setActiveScan(data);
    } catch (err: any) {
      console.error('Scan failed:', err);
      setScanError(err.message || 'Die Website konnte nicht erfolgreich geprüft werden. Bitte kontrollieren Sie die Domain.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectSample = async (scanId: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await fetch(`/api/scan/${scanId}`);
      if (!res.ok) throw new Error('Beispielbericht konnte nicht geladen werden.');
      const data = await res.json();
      setActiveScan(data);
      setCurrentTab('scanner');
    } catch (err: any) {
      setScanError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const openConsultation = (domain?: string) => {
    setConsultationDomain(domain || activeScan?.domain || '');
    setIsConsultationOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-100 selection:text-slate-900">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setScanError(null);
        }}
        onOpenConsultation={() => openConsultation()}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* TAB: SCANNER */}
        {currentTab === 'scanner' && (
          <div>
            {!activeScan && !isScanning && (
              <HeroScanner
                onStartScan={handleStartScan}
                isScanning={isScanning}
                onSelectSample={handleSelectSample}
              />
            )}

            {/* Error Message */}
            {scanError && (
              <div className="max-w-xl mx-auto my-6 px-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-3 text-xs sm:text-sm text-rose-900 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block mb-0.5">Analyse fehlgeschlagen</strong>
                    <span>{scanError}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Progress indicator during active scan */}
            {isScanning && <ScanningProgress targetUrl={scanTargetUrl} />}

            {/* Report view once scan is complete */}
            {activeScan && !isScanning && (
              <ReportView
                scan={activeScan}
                onNewScan={() => {
                  setActiveScan(null);
                  setScanError(null);
                }}
                onOpenConsultation={() => openConsultation(activeScan.domain)}
              />
            )}
          </div>
        )}

        {/* TAB: LEAD FINDER */}
        {currentTab === 'lead-finder' && (
          <LeadFinderView
            onScanDomain={(domain) => handleStartScan(domain)}
            onViewReport={(scanId) => handleSelectSample(scanId)}
          />
        )}

        {/* TAB: ADMIN & VERLAUF DASHBOARD */}
        {currentTab === 'dashboard' && (
          <AdminDashboard
            onSelectScan={(scan) => {
              setActiveScan(scan);
              setCurrentTab('scanner');
            }}
          />
        )}

        {/* TAB: PRÜFKRITERIEN / METHODOLOGY */}
        {currentTab === 'methodology' && <MethodologyView />}
      </main>

      {/* Footer - Geometric Balance */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-xs bg-slate-900 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-black text-slate-900 tracking-tight">DSGVO Scan</span>
            <span className="text-slate-400 font-mono text-[11px]">— Ein Service der Digitalagentur WebZech</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-medium">
            <button
              onClick={() => setCurrentTab('methodology')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Prüfkriterien
            </button>
            <button
              onClick={() => openConsultation()}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Kontakt & Beratung
            </button>
            <span className="text-slate-400 font-mono">Automatisierter technischer Check</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center sm:text-left">
          Hinweis: Dieser automatisierte Scanner dient ausschließlich der technischen Risikoanalyse öffentlich zugänglicher Signale und stellt keine Rechtsberatung oder Zertifizierung dar.
        </div>
      </footer>

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        defaultDomain={consultationDomain}
        scanId={activeScan?.id}
      />
    </div>
  );
}
