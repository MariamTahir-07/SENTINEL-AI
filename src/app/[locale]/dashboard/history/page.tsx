import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Clock, Scan, Shield, AlertTriangle, ShieldAlert, ShieldCheck, QrCode, Mic, MessageSquare, Link2, Cookie } from "lucide-react";
import { getUser } from "@/lib/auth/utils";
import { createClient } from "@/lib/auth/server";
import { getRiskBadgeClasses, getRiskLabel } from "@/lib/risk";
import type { ScanType, RiskLevel } from "@/types";

async function getScans(userId: string) {
  const supabase = await createClient();

  const { data: scans, error } = await supabase
    .from("scans")
    .select(`
      id,
      type,
      status,
      created_at,
      threat_results (
        risk_score,
        risk_level,
        confidence,
        summary
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[history] Failed to fetch scans:", error.message);
    return [];
  }

  return scans ?? [];
}

const SCAN_ICONS: Record<ScanType, typeof MessageSquare> = {
  message: MessageSquare,
  url: Link2,
  qr: QrCode,
  voice: Mic,
  privacy: Cookie,
};

const SCAN_LABELS: Record<ScanType, string> = {
  message: "Message",
  url: "URL",
  qr: "QR Code",
  voice: "Voice",
  privacy: "Privacy",
};

export default async function HistoryPage() {
  const t = useTranslations("history");
  const locale = useLocale();
  const user = await getUser();

  const filters = [
    t("filterAll"), t("filterSafe"), t("filterSuspicious"), t("filterHighRisk"),
    t("filterMessage"), t("filterUrl"), t("filterQr"), t("filterVoice"),
  ];

  let scans: Awaited<ReturnType<typeof getScans>> = [];
  if (user) {
    scans = await getScans(user.id);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Clock size={24} className="text-accent-blue" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{t("description")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f, i) => (
          <button
            key={i}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              i === 0
                ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30"
                : "bg-navy-900 text-text-secondary border border-border-subtle hover:border-border-default"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Scan History */}
      {scans.length > 0 ? (
        <div className="space-y-3">
          {scans.map((scan) => {
            const Icon = SCAN_ICONS[scan.type as ScanType] ?? Scan;
            const threat = Array.isArray(scan.threat_results)
              ? scan.threat_results[0]
              : scan.threat_results;
            const riskLevel = (threat?.risk_level ?? "safe") as RiskLevel;
            const riskScore = threat?.risk_score ?? 0;
            const summary = threat?.summary ?? "";
            const date = new Date(scan.created_at).toLocaleString();

            return (
              <div
                key={scan.id}
                className={`sentinel-card flex items-start gap-4 border-l-4 ${
                  riskLevel === "high-risk"
                    ? "border-l-red-500"
                    : riskLevel === "suspicious"
                    ? "border-l-amber-500"
                    : "border-l-emerald-500"
                }`}
              >
                <div className={`flex-shrink-0 rounded-lg p-2.5 ${
                  riskLevel === "high-risk"
                    ? "bg-red-500/10"
                    : riskLevel === "suspicious"
                    ? "bg-amber-500/10"
                    : "bg-emerald-500/10"
                }`}>
                  {riskLevel === "high-risk" ? (
                    <ShieldAlert size={20} className="text-red-400" />
                  ) : riskLevel === "suspicious" ? (
                    <AlertTriangle size={20} className="text-amber-400" />
                  ) : (
                    <ShieldCheck size={20} className="text-emerald-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                      <Icon size={14} className="text-text-muted" />
                      {SCAN_LABELS[scan.type as ScanType] ?? scan.type}
                    </span>
                    <span className={`sentinel-badge text-xs ${getRiskBadgeClasses(riskLevel)}`}>
                      {getRiskLabel(riskLevel)} — {riskScore}/100
                    </span>
                  </div>
                  {summary && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{summary}</p>
                  )}
                  <p className="text-xs text-text-muted mt-1.5">{date}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="sentinel-card">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield size={32} className="text-text-muted mb-3" />
            <p className="text-sm font-medium">{t("noHistory")}</p>
            <p className="text-xs text-text-muted mt-1">{t("noHistoryDesc")}</p>
            <Link
              href={`/${locale}/dashboard/analyzer`}
              className="sentinel-btn-primary mt-4 text-sm"
            >
              {t("runScan")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
