export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Finding {
  id: string;
  category: 'ssl' | 'legal_pages' | 'consent' | 'tracking' | 'third_party' | 'cookies' | 'security';
  severity: Severity;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
}

export interface CookieItem {
  name: string;
  domain: string;
  path: string;
  expiry?: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  category: 'Notwendig' | 'Statistik / Analytics' | 'Marketing / Tracking' | 'Funktional' | 'Unbekannt';
  source: string;
  isPreConsent: boolean;
}

export interface TrackerItem {
  name: string;
  category: string;
  detected: boolean;
  evidence: string;
  isPreConsent: boolean;
  notes?: string;
}

export interface ThirdPartyService {
  name: string;
  category: 'fonts' | 'maps' | 'video' | 'captcha' | 'cdn' | 'social' | 'api' | 'payment' | 'other';
  domain: string;
  evidence: string;
  riskNote: string;
  isPotentialIssue: boolean;
}

export interface NetworkRequestItem {
  url: string;
  domain: string;
  resourceType: string;
  isThirdParty: boolean;
  category: 'Analytics' | 'Marketing' | 'Fonts' | 'Maps' | 'Video' | 'Social' | 'CDN' | 'API' | 'Internal' | 'Unknown';
  timestamp?: number;
}

export interface LegalPageAnalysis {
  detected: boolean;
  url?: string;
  title?: string;
  linkText?: string;
  foundIn?: string; // header, footer, nav, body
  contentSignals?: {
    hasVerantwortlicher?: boolean;
    hasContactInfo?: boolean;
    hasProcessingPurposes?: boolean;
    hasLegalBasis?: boolean;
    hasDataRetention?: boolean;
    hasDataSubjectRights?: boolean;
    hasCookiesSection?: boolean;
    hasAnalyticsSection?: boolean;
    hasThirdPartySection?: boolean;
    hasInternationalTransfers?: boolean;
    hasGoogleServicesSection?: boolean;
    hasMetaSection?: boolean;
    hasHostingSection?: boolean;
    hasFontsSection?: boolean;
  };
}

export interface ConsentAnalysis {
  cmpDetected: boolean;
  cmpName?: string;
  cmpType?: 'known_cmp' | 'custom' | 'none';
  bannerKeywordsFound: string[];
  hasAcceptAll: boolean;
  hasRejectAllOrNecessary: boolean;
  hasSettings: boolean;
  preConsentCookiesCount: number;
  preConsentTrackersCount: number;
  postConsentCookiesCount: number;
  postConsentTrackersCount: number;
  trackingBeforeConsentDetected: boolean;
}

export interface ScanResult {
  id: string;
  url: string;
  domain: string;
  scanDate: string;
  durationMs: number;
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  https: {
    enabled: boolean;
    issuer?: string;
    protocol?: string;
  };
  impressum: LegalPageAnalysis;
  datenschutz: LegalPageAnalysis;
  consent: ConsentAnalysis;
  trackers: TrackerItem[];
  thirdPartyServices: ThirdPartyService[];
  cookies: CookieItem[];
  networkRequests: NetworkRequestItem[];
  findings: Finding[];
  summary: {
    totalIssues: number;
    passedChecks: number;
    warnings: number;
    highRiskFindings: number;
  };
  recommendations: {
    priority: number;
    title: string;
    description: string;
    impact: 'HOCH' | 'MITTEL' | 'GERING';
  }[];
}

export interface Lead {
  id: string;
  scanId?: string;
  domain: string;
  contactName: string;
  email: string;
  phone?: string;
  companyName?: string;
  message?: string;
  status: 'NEU' | 'IN_BEARBEITUNG' | 'KONTAKTIERT' | 'ABGESCHLOSSEN';
  createdAt: string;
}

export interface LeadFinderResult {
  businessName: string;
  category: string;
  city: string;
  domain: string;
  url: string;
  phone?: string;
  score?: number;
  riskLevel?: RiskLevel;
  lastScanned?: string;
  status: 'PENDING' | 'SCANNED';
}
