import { NextRequest, NextResponse } from "next/server";
import { textAnalysisSchema } from "@/lib/validation";
import { analyzeTextThreat, isAIConfigured } from "@/lib/ai/provider";
import { createApiErrorResponse, Errors } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = textAnalysisSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      const msg = issues.length > 0 ? String(issues[0].message) : "Invalid input.";
      throw Errors.validation(msg);
    }

    if (!isAIConfigured()) {
      throw Errors.aiProvider();
    }

    const result = await analyzeTextThreat(validation.data.text, validation.data.context);

    return NextResponse.json({ result });
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
