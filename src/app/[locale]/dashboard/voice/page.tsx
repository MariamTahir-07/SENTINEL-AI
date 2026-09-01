"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { AnalysisResult } from "@/components/AnalysisResult";
import { LoadingState, ErrorState } from "@/components/States";
import { Mic, Upload, FileAudio } from "lucide-react";
import type { VoiceAnalysisResult } from "@/types";

export default function VoicePage() {
  const t = useTranslations("voiceGuard");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
      return;
    }

    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a"];
    if (!validTypes.includes(f.type)) {
      setError("Supported audio formats: MP3, WAV, OGG, WebM, M4A.");
      return;
    }

    setFile(f);
    setError(null);
    setResult(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const res = await fetch("/api/analyze/voice", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Voice analysis failed.");
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Mic size={24} className="text-accent-blue" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{t("description")}</p>
      </div>

      <div className="sentinel-card space-y-4">
        <div
          className="border-2 border-dashed border-border-subtle rounded-lg p-8 text-center cursor-pointer hover:border-border-default transition-colors"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          aria-label={t("uploadLabel")}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileAudio size={24} className="text-accent-blue" />
              <div className="text-left">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto text-text-muted mb-3" />
              <p className="text-sm font-medium">{t("uploadLabel")}</p>
              <p className="text-xs text-text-muted mt-1">{t("uploadHint")}</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          className="sentinel-btn-primary w-full sm:w-auto"
        >
          {loading ? t("analyzingVoice") : t("analyzeBtn")}
        </button>
      </div>

      {loading && <LoadingState message={t("analyzingVoice")} />}
      {error && <ErrorState message={error} onRetry={handleAnalyze} />}

      {result && (
        <div className="space-y-6 animate-fade-in">
          {result.transcript && (
            <div className="sentinel-card">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t("transcript")}</h3>
              <p className="text-sm leading-relaxed">{result.transcript}</p>
              {result.duration && (
                <p className="text-xs text-text-muted mt-2">{t("duration")}: {result.duration}s</p>
              )}
            </div>
          )}
          <AnalysisResult result={result} />
        </div>
      )}
    </div>
  );
}
