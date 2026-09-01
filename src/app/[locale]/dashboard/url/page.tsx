"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnalysisResult } from "@/components/AnalysisResult";
import { LoadingState, ErrorState } from "@/components/States";
import { Link2, ExternalLink } from "lucide-react";
import type { URLAnalysisResult } from "@/types";

export default function URLPage() {
  const t = useTranslations("urlIntel");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<URLAnalysisResult | null>(null);

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Analysis failed.");
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
          <Link2 size={24} className="text-accent-blue" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{t("description")}</p>
      </div>

      <div className="sentinel-card space-y-4">
        <input
          type="url"
          className="sentinel-input"
          placeholder={t("placeholder")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !url.trim()}
          className="sentinel-btn-primary w-full sm:w-auto"
        >
          {loading ? t("analyzingUrl") : t("analyzeBtn")}
        </button>
      </div>

      {loading && <LoadingState message={t("analyzingUrl")} />}
      {error && <ErrorState message={error} onRetry={handleAnalyze} />}

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* URL Info */}
          <div className="sentinel-card">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink size={14} className="text-text-muted" />
              <span className="text-xs text-text-muted">{t("hostname")}</span>
            </div>
            <p className="text-sm font-mono break-all">{result.url}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
              <span>{t("protocol")}: {result.protocol}</span>
              <span>{t("hostname")}: {result.hostname}</span>
            </div>
          </div>

          {/* Suspicious Patterns */}
          {result.suspiciousPatterns.length > 0 && (
            <div className="sentinel-card">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t("suspiciousPatterns")}</h3>
              <div className="flex flex-wrap gap-2">
                {result.suspiciousPatterns.map((p) => (
                  <span key={p} className="sentinel-badge sentinel-badge-suspicious">{p}</span>
                ))}
              </div>
            </div>
          )}

          <AnalysisResult result={result} />
        </div>
      )}
    </div>
  );
}
