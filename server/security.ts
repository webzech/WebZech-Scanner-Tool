import dns from 'dns/promises';
import { URL } from 'url';

// Private IPv4 ranges and cloud metadata subnets to block (SSRF protection)
const BLOCKED_IP_PATTERNS = [
  /^127\./,                         // Loopback
  /^0\./,                           // Zero address
  /^10\./,                          // RFC 1918 Private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC 1918 Private
  /^192\.168\./,                    // RFC 1918 Private
  /^169\.254\./,                    // Link-local / AWS / GCP / Azure metadata
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT
  /^192\.0\.0\./,                   // IETF Protocol Assignments
  /^192\.0\.2\./,                   // TEST-NET-1
  /^198\.51\.100\./,                // TEST-NET-2
  /^203\.0\.113\./,                 // TEST-NET-3
  /^224\./,                         // Multicast
  /^240\./,                         // Reserved
  /^255\.255\.255\.255$/,           // Broadcast
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.internal',
  '169.254.169.254',
  'instance-data',
  'local',
  'internal',
];

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const ALLOWED_PORTS = ['', '80', '443', '8080', '8443'];

export interface SecurityValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  domain?: string;
  error?: string;
  resolvedIp?: string;
}

/**
 * Validates and normalizes target URL against SSRF attacks.
 */
export async function validateAndNormalizeUrl(rawInput: string): Promise<SecurityValidationResult> {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'Keine URL angegeben.' };
  }

  let cleaned = rawInput.trim();
  // If user entered just "example.de" or "www.example.de", prepend "https://"
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    return { isValid: false, error: 'Ungültiges URL-Format.' };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { isValid: false, error: `Nur HTTP und HTTPS werden unterstützt (angegeben: ${parsed.protocol}).` };
  }

  // Port check
  if (!ALLOWED_PORTS.includes(parsed.port)) {
    return { isValid: false, error: `Port ${parsed.port} ist aus Sicherheitsgründen gesperrt. Nur Standard-Webports sind zulässig.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  if (
    BLOCKED_HOSTNAMES.includes(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.corp')
  ) {
    return { isValid: false, error: 'Anfragen an interne Hostnamen oder Netzwerke sind streng blockiert.' };
  }

  // Resolve DNS to verify IP is not in any private/reserved subnet
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return { isValid: false, error: `Host "${hostname}" konnte nicht aufgelöst werden (DNS-Fehler).` };
    }

    for (const record of lookup) {
      const ip = record.address;
      // Check IPv6 loopback / local
      if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
        return { isValid: false, error: 'Anfragen an IPv6-Loopback oder lokale Netzwerke sind blockiert.' };
      }

      // Check IPv4 patterns
      for (const pattern of BLOCKED_IP_PATTERNS) {
        if (pattern.test(ip)) {
          return { isValid: false, error: `Sicherheitswarnung: Die Ziel-IP (${ip}) liegt in einem privaten oder reservierten Netzwerkbereich.` };
        }
      }
    }

    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      domain: hostname,
      resolvedIp: lookup[0]?.address,
    };
  } catch (err: any) {
    // If DNS resolution fails
    return {
      isValid: false,
      error: `Die Domain "${hostname}" ist nicht erreichbar oder existiert nicht (${err.message || 'DNS Lookup fehlgeschlagen'}).`,
    };
  }
}
