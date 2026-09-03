import jsPDF from 'jspdf';
import { ScanResult } from '../types.js';

export function generatePdfReport(scan: ScanResult) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DSGVO SCAN — TECHNISCHER COMPLIANCE-BERICHT', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Erstellt durch WebZech Digitalagentur | www.webzech.de', 14, 18);

  y = 34;

  // Website & Meta Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Geprüfte Website: ${scan.domain}`, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const formattedDate = new Date(scan.scanDate).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Prüfzeitpunkt: ${formattedDate} Uhr | Scandauer: ${(scan.durationMs / 1000).toFixed(1)}s`, 18, y + 16);
  doc.text(`Vollständige URL: ${scan.url}`, 18, y + 23);

  // Score Badge
  const scoreX = pageWidth - 45;
  let scoreColor: [number, number, number] = [34, 197, 94]; // Green
  let riskText = 'GERINGES RISIKO';
  if (scan.score < 55) {
    scoreColor = [239, 68, 68]; // Red
    riskText = 'HOHES RISIKO';
  } else if (scan.score < 80) {
    scoreColor = [245, 158, 11]; // Amber
    riskText = 'MITTLERES RISIKO';
  }

  doc.setFillColor(...scoreColor);
  doc.roundedRect(scoreX - 10, y + 4, 35, 22, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`${scan.score}/100`, scoreX - 6, y + 13);
  doc.setFontSize(6.5);
  doc.text(riskText, scoreX - 8, y + 20);

  y += 38;

  // Summary Metrics
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, pageWidth - 28, 14, 1, 1, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Identifizierte Risiken: ${scan.summary.totalIssues}`, 18, y + 9);
  doc.text(`Erfolgreiche Prüfungen: ${scan.summary.passedChecks}`, 65, y + 9);
  doc.text(`Warnungen: ${scan.summary.warnings}`, 120, y + 9);
  doc.text(`Hohe Priorität: ${scan.summary.highRiskFindings}`, 158, y + 9);

  y += 22;

  // Core Checks Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Kernprüfungen im Überblick', 14, y);
  y += 6;

  const checks = [
    { label: 'HTTPS-Verschlüsselung', val: scan.https.enabled ? 'Aktiv (TLS)' : 'Nicht aktiv (HTTP)', ok: scan.https.enabled },
    { label: 'Impressum (§ 5 DDG)', val: scan.impressum.detected ? 'Erkannt' : 'Kein offensichtliches Impressum', ok: scan.impressum.detected },
    { label: 'Datenschutzerklärung (Art. 13 DSGVO)', val: scan.datenschutz.detected ? 'Erkannt' : 'Nicht offensichtlich erkannt', ok: scan.datenschutz.detected },
    { label: 'Consent Management (Cookie-Banner)', val: scan.consent.cmpDetected ? `${scan.consent.cmpName || 'Erkannt'}` : 'Nicht erkannt', ok: scan.consent.cmpDetected },
    { label: 'Pre-Consent Tracking (vor Zustimmung)', val: scan.consent.trackingBeforeConsentDetected ? 'Tracker vor Consent aktiv' : 'Keine Pre-Consent Tracker', ok: !scan.consent.trackingBeforeConsentDetected },
  ];

  doc.setFontSize(8.5);
  for (const c of checks) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`•  ${c.label}:`, 18, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.ok ? 22 : 185, c.ok ? 101 : 28, c.ok ? 52 : 28);
    doc.text(c.val, 95, y);
    y += 5.5;
  }

  y += 4;

  // Detailed Findings Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Technische Feststellungen & Handlungsbedarf', 14, y);
  y += 6;

  if (scan.findings.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(34, 197, 94);
    doc.text('Keine gravierenden technischen Auffälligkeiten festgestellt.', 18, y);
    y += 8;
  } else {
    for (const finding of scan.findings) {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      // Finding box
      const isHigh = finding.severity === 'CRITICAL' || finding.severity === 'HIGH';
      doc.setFillColor(isHigh ? 254 : 248, isHigh ? 242 : 250, isHigh ? 242 : 252);
      doc.setDrawColor(isHigh ? 254 : 226, isHigh ? 202 : 232, isHigh ? 202 : 240);
      doc.roundedRect(14, y, pageWidth - 28, 22, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isHigh ? 185 : 180, isHigh ? 28 : 83, isHigh ? 28 : 9);
      doc.text(`[${finding.severity}]  ${finding.title}`, 18, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const descLines = doc.splitTextToSize(finding.description, pageWidth - 36);
      doc.text(descLines.slice(0, 2), 18, y + 10);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Empfehlung:', 18, y + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const recLines = doc.splitTextToSize(finding.recommendation, pageWidth - 58);
      doc.text(recLines[0] || '', 38, y + 18);

      y += 26;
    }
  }

  // Recommendations summary
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Priorisierte Empfehlungen der WebZech Digitalagentur', 14, y);
  y += 6;

  for (const rec of scan.recommendations.slice(0, 4)) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Prio ${rec.priority}: ${rec.title} [Dringlichkeit: ${rec.impact}]`, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const lines = doc.splitTextToSize(rec.description, pageWidth - 36);
    doc.text(lines[0] || '', 18, y + 4.5);
    y += 9.5;
  }

  // Footer & Disclaimer at bottom
  const footerY = 275;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const disclaimerText =
    'Hinweis: Dieser automatisierte Bericht dient ausschließlich der technischen Risikoanalyse öffentlich abrufbarer Signale. ' +
    'Er stellt weder eine Rechtsberatung, noch eine verbindliche DSGVO-Zertifizierung dar. ' +
    'WebZech Digitalagentur | Kontakt für technische Umsetzung: info@webzech.de';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - 28);
  doc.text(disclaimerLines, 14, footerY);

  doc.save(`DSGVO_Scan_Bericht_${scan.domain}_WebZech.pdf`);
}
