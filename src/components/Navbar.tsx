import { Building2, FileCheck2, LayoutDashboard, Search, ShieldCheck } from 'lucide-react';
import React from 'react';

interface NavbarProps {
  currentTab: 'scanner' | 'lead-finder' | 'dashboard' | 'methodology';
  onSelectTab: (tab: 'scanner' | 'lead-finder' | 'dashboard' | 'methodology') => void;
  onOpenConsultation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenConsultation }) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with Geometric Balance theme */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('scanner')}>
          <div className="w-8 h-8 rounded-sm bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight">DSGVO Scan</span>
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-900 border border-amber-300/70">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Digitalagentur WebZech</p>
          </div>
        </div>

        {/* Navigation items with structured geometry */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            id="nav-scanner-btn"
            onClick={() => onSelectTab('scanner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'scanner'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-700" />
            Website Scanner
          </button>

          <button
            id="nav-leadfinder-btn"
            onClick={() => onSelectTab('lead-finder')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'lead-finder'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-700" />
            Lead Finder (Branchen)
          </button>

          <button
            id="nav-dashboard-btn"
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-slate-700" />
            Verlauf & Leads
          </button>

          <button
            id="nav-methodology-btn"
            onClick={() => onSelectTab('methodology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'methodology'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-slate-700" />
            Prüfkriterien
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            id="nav-agency-contact-btn"
            onClick={onOpenConsultation}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs border border-slate-800 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Kostenlose Erstberatung</span>
          </button>
        </div>
      </div>
    </header>
  );
};
