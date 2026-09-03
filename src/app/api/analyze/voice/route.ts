import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, analyzeVoiceThreat, isAIConfigured } from "@/lib/ai/provider";
import { createApiErrorResponse, Errors } from "@/lib/errors";
import { createClient } from "@/lib/auth/server";
import { saveScanHistory } from "@/lib/history";
import type { VoiceAnalysisResult } from "@/types";

export async function POST(request: NextRequest) {
  try {
    if (!isAIConfigured()) {
      throw Errors.aiProvider();
    }

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

    // Step 1: Transcribe audio via Groq Whisper
    const { transcript, duration } = await transcribeAudio(audioFile);

    if (!transcript || transcript.trim().length === 0) {
      throw Errors.transcription("Could not transcribe audio. The recording may be silent or too short.");
    }

    // Step 2: Analyze the transcript for threats
    const analysis = await analyzeVoiceThreat(transcript);

    const result: VoiceAnalysisResult = {
      ...analysis,
      transcript,
      duration,
    };

    // Save to history (fire-and-forget)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await saveScanHistory(user.id, "voice", result);
    } catch { /* non-fatal */ }

    return NextResponse.json({ result });
  } catch (error) {
    const response = createApiErrorResponse(error);
    const status = error instanceof Error && "statusCode" in error ? (error as { statusCode: number }).statusCode : 500;
    return NextResponse.json(response, { status });
  }
}
