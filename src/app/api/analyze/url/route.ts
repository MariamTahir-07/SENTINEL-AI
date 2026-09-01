import { NextRequest, NextResponse } from "next/server";
import { urlAnalysisSchema } from "@/lib/validation";
import { validateUrl, analyzeUrlPatterns } from "@/lib/security";
import { analyzeTextThreat, isAIConfigured } from "@/lib/ai/provider";
import { classifyRisk, computeRiskScore } from "@/lib/risk";
import { createApiErrorResponse, Errors } from "@/lib/errors";
import type { URLAnalysisResult, RiskLevel } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = urlAnalysisSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      const msg = issues.length > 0 ? String(issues[0].message) : "Invalid input.";
      throw Errors.validation(msg);
    }

    const url = validateUrl(validation.data.url);
    const { suspiciousPatterns, signals } = analyzeUrlPatterns(url);

    let aiAnalysis = null;
    if (isAIConfigured()) {
      try {
        aiAnalysis = await analyzeTextThreat(
          `Analyze this URL for potential threats: ${url.href}. Patterns: ${suspiciousPatterns.join(", ") || "none"}.`,
          "general"
        );
      } catch {
        // Continue with pattern-based analysis only
      }
    }

    const allSignals = aiAnalysis ? [...signals, ...aiAnalysis.signals] : signals;
    const riskScore = computeRiskScore({ signals: allSignals });
    const riskLevel: RiskLevel = classifyRisk(riskScore);

    const result: URLAnalysisResult = {
      url: url.href,
      hostname: url.hostname,
      protocol: url.protocol,
      suspiciousPatterns,
      domainAge: null,
      reputation: null,
      riskScore,
      riskLevel,
      threatTypes: aiAnalysis?.threatTypes ?? (signals.length > 0 ? ["Suspicious URL Pattern"] : []),
      signals: allSignals,
      explanation: aiAnalysis?.explanation ?? (
        signals.length > 0
          ? ["Suspicious patterns were detected in this URL based on structural analysis."]
          : ["No suspicious patterns were detected in this URL."]
      ),
      recommendedActions: aiAnalysis?.recommendedActions ?? (
        riskLevel === "safe"
          ? ["This URL appears safe, but always exercise caution."]
          : ["Do not click this link.", "Verify the destination through a trusted source."]
      ),
      confidence: aiAnalysis?.confidence ?? (signals.length > 0 ? 70 : 50),
      detectedLanguage: "en",
    };

    return NextResponse.json({ result });
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
