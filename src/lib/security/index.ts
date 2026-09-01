import { Errors } from "@/lib/errors";

const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "169.254.169.254", // AWS metadata
  "metadata.google.internal",
  "metadata.azure.internal",
  "100.100.100.200", // Alibaba metadata
];

const BLOCKED_PROTOCOLS = ["file:", "ftp:", "gopher:", "data:", "blob:"];
const ALLOWED_PROTOCOLS = ["http:", "https:"];

const PRIVATE_RANGES = [
  { start: "10.0.0.0", end: "10.255.255.255" },
  { start: "172.16.0.0", end: "172.31.255.255" },
  { start: "192.168.0.0", end: "192.168.255.255" },
  { start: "127.0.0.0", end: "127.255.255.255" },
  { start: "169.254.0.0", end: "169.254.255.255" },
];

function ipToNum(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIP(ip: string): boolean {
  const num = ipToNum(ip);
  return PRIVATE_RANGES.some(
    (r) => num >= ipToNum(r.start) && num <= ipToNum(r.end)
  );
}

export function validateUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw Errors.validation("Invalid URL format.");
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    if (BLOCKED_PROTOCOLS.includes(url.protocol)) {
      throw Errors.urlSecurity("This protocol is not allowed for security analysis.");
    }
    throw Errors.urlSecurity("Only HTTP and HTTPS URLs can be analyzed.");
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTS.includes(hostname)) {
    throw Errors.urlSecurity("Analysis of internal addresses is not permitted.");
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) && isPrivateIP(hostname)) {
    throw Errors.urlSecurity("Analysis of private IP addresses is not permitted.");
  }

  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw Errors.urlSecurity("Analysis of internal hostnames is not permitted.");
  }

  return url;
}

export function analyzeUrlPatterns(url: URL): {
  suspiciousPatterns: string[];
  signals: { name: string; severity: "low" | "medium" | "high"; explanation: string }[];
} {
  const patterns: string[] = [];
  const signals: { name: string; severity: "low" | "medium" | "high"; explanation: string }[] = [];
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  // Typosquatting detection (common brands)
  const brands = [
    "google", "facebook", "amazon", "apple", "microsoft",
    "netflix", "paypal", "instagram", "twitter", "linkedin",
    "whatsapp", "telegram", "bank", "chase", "wellsfargo",
  ];
  for (const brand of brands) {
    if (hostname.includes(brand) && !hostname.endsWith(`${brand}.com`) && !hostname.endsWith(`${brand}.net`) && !hostname.endsWith(`${brand}.org`)) {
      const editDistance = levenshtein(hostname.replace(/\.(com|net|org|io|co).*$/, ""), brand);
      if (editDistance > 0 && editDistance <= 3) {
        patterns.push("typosquatting");
        signals.push({
          name: "Possible Brand Impersonation",
          severity: "high",
          explanation: `The domain "${hostname}" resembles "${brand}" but is not the official domain.`,
        });
        break;
      }
    }
  }

  // Suspicious subdomains
  const subdomainParts = hostname.split(".");
  if (subdomainParts.length > 3) {
    patterns.push("excessive-subdomains");
    signals.push({
      name: "Excessive Subdomains",
      severity: "medium",
      explanation: "The URL uses an unusually high number of subdomains, which can indicate phishing.",
    });
  }

  // Punycode/homograph
  if (hostname.includes("xn--")) {
    patterns.push("punycode");
    signals.push({
      name: "Internationalized Domain Name",
      severity: "high",
      explanation: "This domain uses Punycode encoding, which can be used to create look-alike domains.",
    });
  }

  // Suspicious path patterns
  const suspiciousPaths = [
    "login", "signin", "verify", "account", "secure", "update",
    "confirm", "banking", "password", "credential", "wallet",
  ];
  const matchedPaths = suspiciousPaths.filter((p) => pathname.includes(p));
  if (matchedPaths.length >= 2) {
    patterns.push("suspicious-path");
    signals.push({
      name: "Suspicious URL Path",
      severity: "medium",
      explanation: `The URL path contains multiple sensitive keywords (${matchedPaths.join(", ")}), which is common in phishing pages.`,
    });
  }

  // IP-based URL
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    patterns.push("ip-address");
    signals.push({
      name: "IP Address URL",
      severity: "medium",
      explanation: "The URL uses a raw IP address instead of a domain name.",
    });
  }

  // Long URL
  if (url.href.length > 200) {
    patterns.push("long-url");
    signals.push({
      name: "Unusually Long URL",
      severity: "low",
      explanation: "The URL is unusually long, which can be used to hide malicious destinations.",
    });
  }

  // Excessive query params
  if (url.searchParams.size > 10) {
    patterns.push("excessive-params");
    signals.push({
      name: "Excessive Parameters",
      severity: "low",
      explanation: "The URL contains an unusually high number of query parameters.",
    });
  }

  // HTTPS check
  if (url.protocol === "http:") {
    patterns.push("no-https");
    signals.push({
      name: "No HTTPS",
      severity: "medium",
      explanation: "The URL does not use HTTPS. Data sent to this site is not encrypted.",
    });
  }

  return { suspiciousPatterns: patterns, signals };
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
