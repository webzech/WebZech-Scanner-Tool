import { Download, ExternalLink, Eye, FileText, Filter, LayoutDashboard, Search, Trash2, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Lead, ScanResult } from '../types.js';

interface AdminDashboardProps {
  onSelectScan: (scan: ScanResult) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectScan }) => {
  const [activeTab, setActiveTab] = useState<'scans' | 'leads'>('scans');
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scansRes, leadsRes] = await Promise.all([
        fetch('/api/scans'),
        fetch('/api/leads'),
      ]);
      const scansData = await scansRes.json();
      const leadsData = await leadsRes.json();
      setScans(scansData);
      setLeads(leadsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const filteredScans = scans.filter((s) => {
    if (riskFilter !== 'ALL' && s.riskLevel !== riskFilter) return false;
    if (searchTerm && !s.domain.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const exportScansCsv = () => {
    const rows = [
      ['ID', 'Domain', 'Datum', 'Score', 'Risiko', 'Probleme', 'HTTPS', 'Impressum', 'Datenschutz', 'Pre-Consent-Tracking'],
      ...scans.map((s) => [
        s.id,
        s.domain,
        s.scanDate,
        s.score,
        s.riskLevel,
        s.summary.totalIssues,
        s.https.enabled ? 'Ja' : 'Nein',
        s.impressum.detected ? 'Ja' : 'Nein',
        s.datenschutz.detected ? 'Ja' : 'Nein',
        s.consent.trackingBeforeConsentDetected ? 'Ja (Kritisch)' : 'Nein',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'WebZech_DSGVO_Scans_Export.csv';
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-slate-900 text-white text-[10px] font-mono font-bold tracking-wider uppercase mb-2 border border-slate-800 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>WebZech Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Scan-Verlauf & B2B-Leads
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Zentrales Management aller durchgeführten Website-Prüfungen und Anfragen für WebZech.
          </p>
        </div>

        <button
          onClick={exportScansCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-700" />
          <span>Gesamten Verlauf als CSV exportieren</span>
        </button>
      </div>

      {/* Tabs - Geometric Balance */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('scans')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'scans'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Scan-Verlauf ({scans.length})
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'leads'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Eingehende Beratungs-Leads ({leads.length})
        </button>
      </div>

      {/* Scans Tab */}
      {activeTab === 'scans' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Domain suchen (z. B. praxis, kanzlei)..."
                className="w-full max-w-sm px-2 py-1 bg-transparent border-none text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono font-semibold text-[10px] uppercase mr-1">Risikofilter:</span>
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold transition-colors cursor-pointer border ${
                    riskFilter === r
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r === 'ALL' ? 'Alle' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Scans Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            {filteredScans.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                Keine Scans für die ausgewählten Filter gefunden.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Domain</th>
                      <th className="py-3 px-4">Datum & Uhrzeit</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Risikolevel</th>
                      <th className="py-3 px-4">Pre-Consent Tracker</th>
                      <th className="py-3 px-4 text-right">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredScans.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                          {s.domain}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {new Date(s.scanDate).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-center font-black font-mono text-sm text-slate-900">
                          {s.score}/100
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] font-extrabold border ${
                              s.riskLevel === 'HIGH'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : s.riskLevel === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {s.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {s.consent.trackingBeforeConsentDetected ? (
                            <span className="text-rose-600 font-bold text-[11px]">⚠ Ja (Opt-In fehlt)</span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px]">✓ Keine Tracker vorab</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectScan(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors cursor-pointer border border-slate-800 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>Bericht öffnen</span>
                          </button>
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

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          {leads.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Noch keine Leads eingegangen. Testen Sie das Lead-Formular am Ende des Berichts!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Kontaktperson & Firma</th>
                    <th className="py-3 px-4">Website</th>
                    <th className="py-3 px-4">E-Mail & Telefon</th>
                    <th className="py-3 px-4">Nachricht</th>
                    <th className="py-3 px-4">Eingegangen am</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{lead.contactName}</div>
                        <div className="text-[11px] text-slate-500">{lead.companyName || 'Privatperson'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{lead.domain}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{lead.email}</div>
                        <div className="text-[11px] text-slate-500">{lead.phone || 'Keine Telefonnummer'}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={lead.message}>
                        {lead.message || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(lead.createdAt).toLocaleDateString('de-DE')}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                          className="px-2 py-1 rounded-sm border border-slate-300 text-[11px] font-mono font-bold bg-white text-slate-800 focus:outline-hidden focus:border-slate-800"
                        >
                          <option value="NEU">NEU</option>
                          <option value="IN_BEARBEITUNG">IN_BEARBEITUNG</option>
                          <option value="KONTAKTIERT">KONTAKTIERT</option>
                          <option value="ABGESCHLOSSEN">ABGESCHLOSSEN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
