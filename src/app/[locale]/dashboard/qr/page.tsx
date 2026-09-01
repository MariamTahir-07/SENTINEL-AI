"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { AnalysisResult } from "@/components/AnalysisResult";
import { LoadingState, ErrorState } from "@/components/States";
import { QrCode, Upload, ExternalLink, AlertTriangle } from "lucide-react";
import type { QRAnalysisResult } from "@/types";

export default function QRPage() {
  const t = useTranslations("qrGuardian");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QRAnalysisResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(f.type)) {
      setError("Only PNG, JPEG, WebP, and GIF images are supported.");
      return;
    }

    setFile(f);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/analyze/qr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "QR analysis failed.");
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
          <QrCode size={24} className="text-accent-blue" />
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
          {preview ? (
            <img src={preview} alt="QR code preview" className="mx-auto max-h-48 rounded-lg" />
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
            accept="image/png,image/jpeg,image/webp,image/gif"
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
          {loading ? t("analyzingQr") : t("analyzeBtn")}
        </button>
      </div>

      {loading && <LoadingState message={t("analyzingQr")} />}
      {error && <ErrorState message={error} onRetry={handleAnalyze} />}

      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="sentinel-card border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-risk-suspicious mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t("decodedUrl")}</p>
                <p className="text-sm font-mono text-accent-cyan mt-1 break-all">{result.decodedUrl}</p>
                <p className="text-xs text-text-muted mt-2">{t("qrDecodedNote")}</p>
              </div>
            </div>
          </div>

          {result.urlAnalysis && (
            <AnalysisResult result={result.urlAnalysis} />
          )}
        </div>
      )}
    </div>
  );
}
