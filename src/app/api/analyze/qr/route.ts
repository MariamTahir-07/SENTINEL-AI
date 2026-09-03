import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import jsQR from "jsqr";
import { validateUrl, analyzeUrlPatterns } from "@/lib/security";
import { analyzeTextThreat, isAIConfigured } from "@/lib/ai/provider";
import { classifyRisk, computeRiskScore } from "@/lib/risk";
import { createApiErrorResponse, Errors } from "@/lib/errors";
import type { QRAnalysisResult, URLAnalysisResult, RiskLevel } from "@/types";

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
      // URL is invalid but we still report it
    }

    let urlAnalysis: URLAnalysisResult | null = null;
    if (parsedUrl) {
      const { suspiciousPatterns, signals } = analyzeUrlPatterns(parsedUrl);

      let aiAnalysis = null;
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
    }

    const result: QRAnalysisResult = {
      decodedUrl,
      urlAnalysis,
      riskScore: urlAnalysis?.riskScore ?? 50,
      riskLevel: urlAnalysis?.riskLevel ?? "suspicious",
      threatTypes: urlAnalysis?.threatTypes ?? ["QR Code"],
      signals: urlAnalysis?.signals ?? [],
      explanation: urlAnalysis?.explanation ?? ["QR code decoded. Verify the destination URL before visiting."],
      recommendedActions: ["Do not visit the URL without verifying it.", "Check if you trust the source of the QR code."],
      confidence: urlAnalysis?.confidence ?? 50,
      detectedLanguage: "en",
    };

    return NextResponse.json({ result });
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
