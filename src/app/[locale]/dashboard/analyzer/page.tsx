"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnalysisResult } from "@/components/AnalysisResult";
import { LoadingState, ErrorState } from "@/components/States";
import { MessageSquare } from "lucide-react";
import type { ThreatAnalysisResult } from "@/types";

export default function AnalyzerPage() {
  const t = useTranslations("analyzer");
  const [text, setText] = useState("");
  const [context, setContext] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ThreatAnalysisResult | null>(null);

  async function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), context }),
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

  const contexts = [
    { value: "general", label: t("contextGeneral") },
    { value: "sms", label: t("contextSms") },
    { value: "whatsapp", label: t("contextWhatsapp") },
    { value: "email", label: t("contextEmail") },
    { value: "social", label: t("contextSocial") },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <MessageSquare size={24} className="text-accent-blue" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{t("description")}</p>
      </div>

      <div className="sentinel-card space-y-4">
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-text-secondary mb-2">
            {t("context")}
          </label>
          <div className="flex flex-wrap gap-2">
            {contexts.map((c) => (
              <button
                key={c.value}
                onClick={() => setContext(c.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  context === c.value
                    ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30"
                    : "bg-navy-900 text-text-secondary border border-border-subtle hover:border-border-default"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea
            id="message-text"
            className="sentinel-textarea"
            placeholder={t("placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            maxLength={10000}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-text-muted text-right">
            {text.length} / 10,000
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          className="sentinel-btn-primary w-full sm:w-auto"
        >
          {loading ? t("analyzingMsg") : t("analyzeBtn")}
        </button>
      </div>

      {loading && <LoadingState message={t("analyzingMsg")} />}
      {error && <ErrorState message={error} onRetry={handleAnalyze} />}
      {result && (
        <AnalysisResult
          result={result}
          labels={{
            threatTypes: t("threatTypes"),
            signals: t("detectedSignals"),
            whyFlagged: t("whyFlagged"),
            recommended: t("recommendedActions"),
            language: t("detectedLanguage"),
            aiAssessment: t("aiAssessment"),
          }}
        />
      )}
    </div>
  );
}
