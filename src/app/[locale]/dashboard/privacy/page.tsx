"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LoadingState, ErrorState } from "@/components/States";
import { Cookie, Shield, AlertTriangle } from "lucide-react";
import { getRiskBadgeClasses, getRiskLabel } from "@/lib/risk";
import type { PrivacyAnalysisResult } from "@/types";

export default function PrivacyPage() {
  const t = useTranslations("cookieGuardian");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrivacyAnalysisResult | null>(null);

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/privacy/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Privacy analysis failed.");
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
          <Cookie size={24} className="text-accent-blue" />
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
          {loading ? t("analyzingPrivacy") : t("analyzeBtn")}
        </button>
      </div>

      {loading && <LoadingState message={t("analyzingPrivacy")} />}
      {error && <ErrorState message={error} onRetry={handleAnalyze} />}

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Privacy Risk */}
          <div className={`sentinel-card border ${getRiskBadgeClasses(result.privacyRisk)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.privacyRisk === "safe" ? (
                  <Shield size={28} className="text-risk-safe" />
                ) : (
                  <AlertTriangle size={28} className={result.privacyRisk === "suspicious" ? "text-risk-suspicious" : "text-risk-high"} />
                )}
                <div>
                  <p className="text-xl font-semibold">{t("privacyRisk")}: {getRiskLabel(result.privacyRisk)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("totalCookies"), value: result.totalCookies },
              { label: t("thirdParty"), value: result.thirdPartyCookies },
              { label: t("trackers"), value: result.trackers },
              { label: t("advertisingTrackers"), value: result.advertisingTrackers },
            ].map((stat) => (
              <div key={stat.label} className="sentinel-card text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Categories */}
          {result.categories.length > 0 && (
            <div className="sentinel-card">
              <h3 className="text-sm font-medium text-text-secondary mb-3">{t("categories")}</h3>
              <div className="space-y-2">
                {result.categories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between rounded-lg bg-navy-900 px-3 py-2">
                    <span className="text-sm">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="sentinel-badge sentinel-badge-neutral text-xs">{cat.type}</span>
                      <span className="text-sm font-medium">{cat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="sentinel-card">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="text-accent-cyan mt-0.5">&#8226;</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
