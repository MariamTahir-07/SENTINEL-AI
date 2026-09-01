import { describe, it, expect } from "vitest";
import { classifyRisk, computeRiskScore, getRiskLabel, getRiskBadgeClasses } from "@/lib/risk";
import { validateUrl, analyzeUrlPatterns } from "@/lib/security";
import { Errors, handleError } from "@/lib/errors";

describe("Risk Engine", () => {
  it("classifies safe scores correctly", () => {
    expect(classifyRisk(0)).toBe("safe");
    expect(classifyRisk(15)).toBe("safe");
    expect(classifyRisk(29)).toBe("safe");
  });

  it("classifies suspicious scores correctly", () => {
    expect(classifyRisk(30)).toBe("suspicious");
    expect(classifyRisk(50)).toBe("suspicious");
    expect(classifyRisk(69)).toBe("suspicious");
  });

  it("classifies high-risk scores correctly", () => {
    expect(classifyRisk(70)).toBe("high-risk");
    expect(classifyRisk(85)).toBe("high-risk");
    expect(classifyRisk(100)).toBe("high-risk");
  });

  it("computes risk score from signals", () => {
    const score = computeRiskScore({
      signals: [
        { name: "A", severity: "high", explanation: "" },
        { name: "B", severity: "medium", explanation: "" },
        { name: "C", severity: "low", explanation: "" },
      ],
    });
    expect(score).toBe(45); // 25 + 15 + 5
  });

  it("caps risk score at 100", () => {
    const signals = Array.from({ length: 10 }, () => ({
      name: "X",
      severity: "high" as const,
      explanation: "",
    }));
    expect(computeRiskScore({ signals })).toBe(100);
  });

  it("returns correct risk labels", () => {
    expect(getRiskLabel("safe")).toBe("Safe");
    expect(getRiskLabel("suspicious")).toBe("Suspicious");
    expect(getRiskLabel("high-risk")).toBe("High Risk");
  });

  it("returns non-empty badge classes", () => {
    expect(getRiskBadgeClasses("safe")).toBeTruthy();
    expect(getRiskBadgeClasses("suspicious")).toBeTruthy();
    expect(getRiskBadgeClasses("high-risk")).toBeTruthy();
  });
});

describe("URL Security", () => {
  it("validates legitimate URLs", () => {
    const url = validateUrl("https://www.google.com");
    expect(url.hostname).toBe("www.google.com");
  });

  it("rejects localhost", () => {
    expect(() => validateUrl("http://localhost")).toThrow();
  });

  it("rejects private IPs", () => {
    expect(() => validateUrl("http://192.168.1.1")).toThrow();
    expect(() => validateUrl("http://10.0.0.1")).toThrow();
  });

  it("rejects metadata endpoints", () => {
    expect(() => validateUrl("http://169.254.169.254/latest/meta-data")).toThrow();
  });

  it("rejects non-HTTP protocols", () => {
    expect(() => validateUrl("file:///etc/passwd")).toThrow();
    expect(() => validateUrl("ftp://example.com")).toThrow();
  });

  it("detects suspicious URL patterns", () => {
    const url = new URL("http://192.168.1.100/login/verify/account");
    // This would throw on validateUrl due to private IP, so test analyzeUrlPatterns directly
    const url2 = new URL("https://paypa1-secure.com/login/verify");
    const { signals } = analyzeUrlPatterns(url2);
    expect(signals.length).toBeGreaterThan(0);
  });

  it("detects punycode domains", () => {
    const url = new URL("https://xn--googl-5wa.com");
    const { signals } = analyzeUrlPatterns(url);
    expect(signals.some((s) => s.name.includes("Internationalized"))).toBe(true);
  });

  it("detects no-https", () => {
    const url = new URL("http://example.com");
    const { signals } = analyzeUrlPatterns(url);
    expect(signals.some((s) => s.name.includes("No HTTPS"))).toBe(true);
  });
});

describe("Error System", () => {
  it("creates validation errors", () => {
    const err = Errors.validation("Bad input");
    expect(err.category).toBe("VALIDATION_ERROR");
    expect(err.statusCode).toBe(400);
  });

  it("creates AI provider errors", () => {
    const err = Errors.aiProvider();
    expect(err.category).toBe("AI_PROVIDER_ERROR");
    expect(err.statusCode).toBe(503);
  });

  it("handles unknown errors gracefully", () => {
    const result = handleError("random string");
    expect(result.category).toBe("UNKNOWN_ERROR");
  });

  it("preserves SentinelError in handleError", () => {
    const err = Errors.auth("Test");
    const result = handleError(err);
    expect(result.category).toBe("AUTH_ERROR");
    expect(result.message).toBe("Test");
  });
});
