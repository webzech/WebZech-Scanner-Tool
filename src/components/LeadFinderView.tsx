import { ArrowRight, Building2, Filter, MapPin, Play, RefreshCw, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';
import { LeadFinderResult } from '../types.js';

interface LeadFinderViewProps {
  onScanDomain: (domain: string) => void;
  onViewReport: (scanId: string) => void;
}

export const LeadFinderView: React.FC<LeadFinderViewProps> = ({ onScanDomain, onViewReport }) => {
  const [category, setCategory] = useState('Zahnarzt');
  const [city, setCity] = useState('München');
  const [items, setItems] = useState<LeadFinderResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/lead-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, city }),
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Lead finder error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  React.useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-slate-900 text-white text-[10px] font-mono font-bold tracking-wider uppercase mb-2 border border-slate-800 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>WebZech Agency Tool — B2B Lead Finder</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Website Discovery & DSGVO Lead Finder
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-normal">
          Entdecken Sie öffentliche Unternehmens-Websites in deutschen Städten, prüfen Sie deren technischen Datenschutz-Risikostatus und identifizieren Sie qualifizierte Optimierungs-Leads für WebZech.
        </p>
      </div>

      {/* Search Filters Card - Geometric Balance */}
      <form onSubmit={handleSearch} className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-700 mb-1">Branche / Kategorie</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="z. B. Zahnarzt, Restaurant, Anwalt..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-hidden focus:border-slate-800"
              />
            </div>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-700 mb-1">Standort / Stadt</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="z. B. München, Berlin, Hamburg..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-hidden focus:border-slate-800"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-800 shadow-xs"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Search className="w-4 h-4 text-amber-400" />}
              <span>Suchen</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-mono font-semibold text-[10px] uppercase tracking-wider">Beliebte Branchen:</span>
          {['Zahnarzt', 'Steuerberater', 'Hotel', 'Rechtsanwalt', 'Restaurant', 'Hautarzt'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
              }}
              className={`px-2.5 py-1 rounded-sm border text-[11px] font-medium transition-colors cursor-pointer ${
                category === cat ? 'bg-slate-900 text-white border-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </form>

      {/* Results Table - Geometric Balance */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs sm:text-sm font-bold text-slate-900">
            Gefundene Unternehmens-Websites ({items.length})
          </div>
          <span className="text-xs font-mono text-slate-500">Standort: {city || 'Deutschland'}</span>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Keine Unternehmen für diese Suchkriterien gefunden. Bitte passen Sie Branche oder Stadt an.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Unternehmen / Praxis</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4 text-center">Risikoscore</th>
                  <th className="py-3 px-4 text-center">Risikostufe</th>
                  <th className="py-3 px-4 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const hasScore = typeof item.score === 'number';
                  const isHigh = item.riskLevel === 'HIGH';
                  const isMed = item.riskLevel === 'MEDIUM';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{item.businessName}</div>
                        <div className="text-[11px] text-slate-500">{item.category} • {item.city}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{item.domain}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.phone || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        {hasScore ? (
                          <span className="font-bold font-mono text-sm text-slate-900">{item.score}/100</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Noch nicht gescannt</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasScore ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] font-extrabold border ${
                              isHigh
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : isMed
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {item.riskLevel} RISK
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onScanDomain(item.url || item.domain)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors cursor-pointer border border-slate-800 shadow-xs"
                        >
                          <Play className="w-3 h-3 text-amber-400" />
                          <span>Prüfen</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
