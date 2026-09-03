import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { performDsgvoScan } from './server/scanner.js';
import { validateAndNormalizeUrl } from './server/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'DSGVO Scan', agency: 'WebZech' });
  });

  // Start new scan
  app.post('/api/scan', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Bitte geben Sie eine gültige Website-URL an.' });
    }

    // SSRF early check
    const sec = await validateAndNormalizeUrl(url);
    if (!sec.isValid || !sec.normalizedUrl) {
      return res.status(400).json({ error: sec.error || 'Ungültige oder gesperrte Ziel-URL.' });
    }

    try {
      const scanResult = await performDsgvoScan(sec.normalizedUrl);
      db.saveScan(scanResult);

      // If domain in lead finder, update it
      db.addOrUpdateLeadFinderItem({
        businessName: scanResult.domain,
        category: 'Website',
        city: 'Deutschland',
        domain: scanResult.domain,
        url: scanResult.url,
        score: scanResult.score,
        riskLevel: scanResult.riskLevel,
        lastScanned: scanResult.scanDate,
        status: 'SCANNED',
      });

      return res.json(scanResult);
    } catch (err: any) {
      console.error('Scan error:', err);
      return res.status(500).json({
        error: err.message || 'Die Website konnte nicht erfolgreich analysiert werden. Bitte prüfen Sie die Erreichbarkeit der Domain.',
      });
    }
  });

  // Get scan by ID
  app.get('/api/scan/:id', (req, res) => {
    const scan = db.getScanById(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan-Bericht nicht gefunden.' });
    }
    return res.json(scan);
  });

  // Get all scans
  app.get('/api/scans', (req, res) => {
    const { risk, limit } = req.query;
    let scans = db.getScans();
    if (risk && typeof risk === 'string') {
      scans = scans.filter((s) => s.riskLevel.toLowerCase() === risk.toLowerCase());
    }
    if (limit && !isNaN(Number(limit))) {
      scans = scans.slice(0, Number(limit));
    }
    return res.json(scans);
  });

  // Lead Generation: Submit consultation request for WebZech
  app.post('/api/leads', (req, res) => {
    const { scanId, domain, contactName, email, phone, companyName, message } = req.body;
    if (!email || !contactName) {
      return res.status(400).json({ error: 'Name und E-Mail-Adresse sind Pflichtfelder.' });
    }

    const lead = db.addLead({
      scanId,
      domain: domain || 'Keine Angabe',
      contactName,
      email,
      phone,
      companyName,
      message,
    });

    return res.status(201).json({ success: true, lead });
  });

  // Get leads (admin dashboard)
  app.get('/api/leads', (req, res) => {
    const leads = db.getLeads();
    return res.json(leads);
  });

  // Update lead status
  app.patch('/api/leads/:id', (req, res) => {
    const { status } = req.body;
    const updated = db.updateLeadStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Lead nicht gefunden.' });
    }
    return res.json(updated);
  });

  // Lead Finder: search local businesses
  app.post('/api/lead-finder', (req, res) => {
    const { category, city } = req.body;
    const items = db.getLeadFinderItems(category, city);
    return res.json(items);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DSGVO Scan Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
