import { CheckCircle2, Send, ShieldCheck, X } from 'lucide-react';
import React, { useState } from 'react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDomain?: string;
  scanId?: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  defaultDomain = '',
  scanId,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState(defaultDomain);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Update domain if defaultDomain changes
  React.useEffect(() => {
    if (defaultDomain) setDomain(defaultDomain);
  }, [defaultDomain]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Bitte geben Sie Ihren Namen und Ihre E-Mail-Adresse an.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          domain: domain || defaultDomain,
          contactName: name,
          email,
          phone,
          companyName: company,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error('Fehler beim Absenden der Anfrage.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Die Anfrage konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-sm bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Anfrage erfolgreich übermittelt!</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto mb-6">
              Vielen Dank für Ihr Vertrauen. Ein WebZech-Experte wird die technischen Befunde für <strong className="font-mono text-slate-900">{domain}</strong> sichten und sich innerhalb von 24 Stunden bei Ihnen melden.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-md bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800 shadow-xs"
            >
              Schließen
            </button>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-sm bg-slate-900 text-white text-[10px] font-mono font-bold tracking-wider uppercase mb-2 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>WebZech Digitalagentur</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1.5">
              Kostenlose Erstberatung anfordern
            </h3>
            <p className="text-xs text-slate-600 mb-5 font-normal">
              Wir analysieren die Risiken Ihrer Website und zeigen Ihnen, wie WebZech Google Fonts lokal hostet, CMPs rechtssicher einrichtet und Tracking sauber absichert.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-800 text-xs rounded-md border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ihr Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Max Mustermann"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-900 focus:outline-hidden focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-Mail-Adresse *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kontakt@unternehmen.de"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-900 focus:outline-hidden focus:border-slate-800 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefonnummer (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 89 1234567"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-900 focus:outline-hidden focus:border-slate-800 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unternehmen / Praxis</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Muster GmbH"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-900 focus:outline-hidden focus:border-slate-800 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Website-Domain</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="muster-website.de"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-900 focus:outline-hidden focus:border-slate-800 font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ihre Nachricht / Anliegen</label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="z. B. Wir möchten Google Fonts lokal einbinden und unser Cookie-Banner überprüfen..."
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-900 focus:outline-hidden focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-amber-400"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>{submitting ? 'Wird gesendet...' : 'Kostenlose Beratung anfordern'}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-normal">
                Ihre Daten werden vertraulich gem. unserer Datenschutzerklärung verarbeitet und nicht weitergegeben.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
