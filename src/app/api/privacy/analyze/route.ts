import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse, Errors } from "@/lib/errors";
import { validateUrl } from "@/lib/security";
import type { PrivacyAnalysisResult, CookieCategory, RiskLevel } from "@/types";

// Known tracker/advertising cookie domain patterns
const TRACKER_PATTERNS = [
  "doubleclick", "googlesyndication", "googleadservices", "google-analytics",
  "facebook", "fb_", "_fb", "meta",
  "amazon-adsystem", "assoc-amazon",
  "adnxs", "adsrvr", "bidswitch", "casalemedia", "contextweb",
  "criteo", "demdex", "dotomi", "doubleverify", "eyeview",
  "indexexchange", "mediamath", "moatads", "openx", "pubmatic",
  "rubiconproject", "sharethrough", "sitemaji", "smartadserver",
  "taboola", "teads", "tribalfusion", "yieldmo",
];

const ANALYTICS_PATTERNS = [
  "analytics", "_ga", "_gid", "_gat", "AMP_TOKEN",
  "hotjar", "mixpanel", "segment", "amplitude", "heap",
  "optimizely", "crazyegg", "fullstory", "mouseflow", "luckyorange",
  "matomo", "piwik",
];

const ESSENTIAL_PATTERNS = [
  "session", "csrf", "xsrf", "_token", "auth",
  "PHPSESSID", "JSESSIONID", "ASP.NET_SessionId",
  "__next", "next_", "_next",
];

function categorizeCookie(name: string, domain: string): CookieCategory["type"] {
  const lowerName = name.toLowerCase();
  const lowerDomain = domain.toLowerCase();

  // Check essential first
  if (ESSENTIAL_PATTERNS.some((p) => lowerName.includes(p.toLowerCase()))) {
    return "essential";
  }

  // Check advertising/tracking
  if (TRACKER_PATTERNS.some((p) => lowerName.includes(p) || lowerDomain.includes(p))) {
    return "advertising";
  }

  // Check analytics
  if (ANALYTICS_PATTERNS.some((p) => lowerName.includes(p.toLowerCase()))) {
    return "analytics";
  }

  // Third-party (domain doesn't match the main site)
  return "unknown";
}

function determinePrivacyRisk(
  totalCookies: number,
  thirdParty: number,
  trackers: number,
  advertising: number
): RiskLevel {
  if (advertising >= 5 || trackers >= 8 || thirdParty >= 10) {
    return "high-risk";
  }
  if (advertising >= 2 || trackers >= 3 || thirdParty >= 5) {
    return "suspicious";
  }
  return "safe";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url || typeof body.url !== "string") {
      throw Errors.validation("A URL is required for privacy analysis.");
    }

    const parsedUrl = validateUrl(body.url);
    const targetDomain = parsedUrl.hostname;

    // Fetch the page and capture Set-Cookie headers
    let cookies: { name: string; value: string; domain: string; path: string; secure: boolean; httpOnly: boolean; sameSite?: string; maxAge?: number }[] = [];

    try {
      const response = await fetch(parsedUrl.href, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15_000),
      });

      const setCookieHeaders = response.headers.getSetCookie?.() ?? [];

      for (const raw of setCookieHeaders) {
        const parts = raw.split(";").map((s) => s.trim());
        const [nameValue, ...attrs] = parts;
        const eqIdx = nameValue.indexOf("=");
        if (eqIdx < 0) continue;

        const name = nameValue.slice(0, eqIdx).trim();
        const value = nameValue.slice(eqIdx + 1).trim();

        let domain = targetDomain;
        let path = "/";
        let secure = false;
        let httpOnly = false;
        let sameSite: string | undefined;
        let maxAge: number | undefined;

        for (const attr of attrs) {
          const [attrName, attrValue] = attr.split("=").map((s) => s.trim());
          const lowerAttr = attrName.toLowerCase();
          if (lowerAttr === "domain" && attrValue) {
            domain = attrValue.replace(/^\./, "").toLowerCase();
          } else if (lowerAttr === "path" && attrValue) {
            path = attrValue;
          } else if (lowerAttr === "secure") {
            secure = true;
          } else if (lowerAttr === "httponly") {
            httpOnly = true;
          } else if (lowerAttr === "samesite" && attrValue) {
            sameSite = attrValue;
          } else if (lowerAttr === "max-age" && attrValue) {
            maxAge = parseInt(attrValue, 10);
          }
        }

        cookies.push({ name, value, domain, path, secure, httpOnly, sameSite, maxAge });
      }
    } catch (fetchError) {
      console.error("[privacy/analyze] Failed to fetch URL:", fetchError);
      throw Errors.network(`Could not reach ${targetDomain}. The site may be unavailable or blocking automated requests.`);
    }

    // Categorize cookies
    const thirdPartyCookies = cookies.filter(
      (c) => !targetDomain.includes(c.domain) && !c.domain.includes(targetDomain)
    );

    const categorized = cookies.map((c) => ({
      ...c,
      category: categorizeCookie(c.name, c.domain),
    }));

    const essentialCount = categorized.filter((c) => c.category === "essential").length;
    const analyticsCount = categorized.filter((c) => c.category === "analytics").length;
    const advertisingCount = categorized.filter((c) => c.category === "advertising").length;
    const trackingCount = advertisingCount; // advertising cookies are trackers

    const categories: CookieCategory[] = [
      { name: "Essential", type: "essential", count: essentialCount },
      { name: "Analytics", type: "analytics", count: analyticsCount },
      { name: "Advertising", type: "advertising", count: advertisingCount },
      { name: "Tracking", type: "tracking", count: trackingCount },
    ];

    const privacyRisk = determinePrivacyRisk(
      cookies.length,
      thirdPartyCookies.length,
      trackingCount,
      advertisingCount
    );

    const recommendations: string[] = [];
    if (advertisingCount > 0) {
      recommendations.push(`Found ${advertisingCount} advertising cookie(s). Consider using an ad blocker or privacy-focused browser.`);
    }
    if (thirdPartyCookies.length > 0) {
      recommendations.push(`${thirdPartyCookies.length} third-party cookie(s) detected. These may be used for cross-site tracking.`);
    }
    if (cookies.some((c) => !c.secure)) {
      recommendations.push("Some cookies are set without the Secure flag, meaning they can be transmitted over unencrypted connections.");
    }
    if (cookies.some((c) => !c.httpOnly)) {
      recommendations.push("Some cookies lack the HttpOnly flag, making them accessible to client-side scripts (potential XSS risk).");
    }
    if (recommendations.length === 0) {
      recommendations.push("No significant privacy concerns detected in the cookies from this site.");
    }
    recommendations.push("Review the website's privacy policy for full cookie disclosure.");

    const result: PrivacyAnalysisResult = {
      totalCookies: cookies.length,
      thirdPartyCookies: thirdPartyCookies.length,
      trackers: trackingCount,
      advertisingTrackers: advertisingCount,
      privacyRisk,
      categories,
      recommendations,
    };

    return NextResponse.json({ result });
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
