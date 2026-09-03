import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import jsQR from "jsqr";
import { validateUrl, analyzeUrlPatterns } from "@/lib/security";
import { analyzeTextThreat, isAIConfigured } from "@/lib/ai/provider";
import { classifyRisk, computeRiskScore } from "@/lib/risk";
import { createApiErrorResponse, Errors } from "@/lib/errors";
import { createClient } from "@/lib/auth/server";
import { saveScanHistory } from "@/lib/history";
import type { QRAnalysisResult, URLAnalysisResult, ThreatAnalysisResult, RiskLevel } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      throw Errors.file("No image provided.");
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      throw Errors.file("File size must be under 10MB.");
    }

    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(imageFile.type)) {
      throw Errors.file("Only PNG, JPEG, WebP, and GIF images are supported.");
    }

    // Step 1: Decode image to raw RGBA pixel data using sharp
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const { data: pixels, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Step 2: Decode QR code from RGBA pixel data
    const uint8Clamped = new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.byteLength);
    const qrResult = jsQR(uint8Clamped, info.width, info.height);

    if (!qrResult?.data) {
      throw Errors.qrDecode("Could not decode QR code from the provided image. Ensure the image contains a clear QR code.");
    }

    const decodedUrl = qrResult.data;

    // Step 3: Validate and analyze the decoded URL
    let parsedUrl: URL | null = null;
    try {
      parsedUrl = validateUrl(decodedUrl);
    } catch {
      // URL is invalid — we'll still run AI analysis on the raw content
    }

    let urlAnalysis: URLAnalysisResult | null = null;
    let baseAnalysis: ThreatAnalysisResult;

    if (parsedUrl) {
      // Valid HTTP/HTTPS URL — pattern-based + AI analysis
      const { suspiciousPatterns, signals } = analyzeUrlPatterns(parsedUrl);

      let aiAnalysis: ThreatAnalysisResult | null = null;
      if (isAIConfigured()) {
        try {
          aiAnalysis = await analyzeTextThreat(
            `Analyze this QR code destination URL: ${parsedUrl.href}. Patterns: ${suspiciousPatterns.join(", ") || "none"}.`,
            "general"
          );
        } catch {
          // Continue with pattern-based analysis only
        }
      }

      const allSignals = aiAnalysis ? [...signals, ...aiAnalysis.signals] : signals;
      const riskScore = computeRiskScore({ signals: allSignals });
      const riskLevel: RiskLevel = classifyRisk(riskScore);

      urlAnalysis = {
        url: parsedUrl.href,
        hostname: parsedUrl.hostname,
        protocol: parsedUrl.protocol,
        suspiciousPatterns,
        domainAge: null,
        reputation: null,
        riskScore,
        riskLevel,
        threatTypes: aiAnalysis?.threatTypes ?? (signals.length > 0 ? ["Suspicious URL"] : []),
        signals: allSignals,
        explanation: aiAnalysis?.explanation ?? (signals.length > 0 ? ["Suspicious patterns detected in the QR destination URL."] : ["No suspicious patterns detected."]),
        recommendedActions: aiAnalysis?.recommendedActions ?? ["Verify the destination before visiting."],
        confidence: aiAnalysis?.confidence ?? 60,
        detectedLanguage: "en",
      };

      baseAnalysis = urlAnalysis;
    } else {
      // Not a valid URL (plain text, tel:, mailto:, etc.) — AI-analyze the raw content
      if (isAIConfigured()) {
        try {
          baseAnalysis = await analyzeTextThreat(
            `Analyze this QR code content for safety threats. It is NOT a valid HTTP/HTTPS URL. Raw content: "${decodedUrl}"`,
            "general"
          );
        } catch {
          baseAnalysis = {
            riskScore: 50, riskLevel: "suspicious", threatTypes: ["QR Code"],
            signals: [{ name: "Non-URL Content", severity: "medium", explanation: "The QR code contains content that is not a standard web URL. Exercise caution." }],
            explanation: ["QR code decoded but the content is not a standard web URL. Verify the source before trusting this content."],
            recommendedActions: ["Do not act on this content without verifying the source.", "If this QR code was unexpected, do not follow its instructions."],
            confidence: 50, detectedLanguage: "en",
          };
        }
      } else {
        baseAnalysis = {
          riskScore: 50, riskLevel: "suspicious", threatTypes: ["QR Code"],
          signals: [{ name: "Non-URL Content", severity: "medium", explanation: "The QR code contains content that is not a standard web URL. Exercise caution." }],
          explanation: ["QR code decoded but the content is not a standard web URL. Verify the source before trusting this content."],
          recommendedActions: ["Do not act on this content without verifying the source.", "If this QR code was unexpected, do not follow its instructions."],
          confidence: 50, detectedLanguage: "en",
        };
      }
    }

    const result: QRAnalysisResult = {
      ...baseAnalysis,
      decodedUrl,
      urlAnalysis,
    };

    // Save to history (fire-and-forget — never blocks the response)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveScanHistory(user.id, "qr", result);
      }
    } catch {
      // History save failure is non-fatal
    }

    return NextResponse.json({ result });
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
