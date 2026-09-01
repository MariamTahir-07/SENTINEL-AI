import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse, Errors } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      throw Errors.file("No audio file provided.");
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      throw Errors.file("File size must be under 10MB.");
    }

    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a"];
    if (!validTypes.includes(audioFile.type)) {
      throw Errors.file("Supported audio formats: MP3, WAV, OGG, WebM, M4A.");
    }

    // Transcription requires an external provider that is not configured
    throw Errors.transcription(
      "Transcription service is unavailable. A transcription provider must be configured to analyze voice recordings."
    );
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
