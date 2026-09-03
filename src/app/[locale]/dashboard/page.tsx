import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Shield, Scan, AlertTriangle, ShieldAlert, ShieldCheck, TrendingUp,
  MessageSquare, Link2, QrCode, Mic, Clock, ArrowRight, Cookie,
} from "lucide-react";
import { getUser } from "@/lib/auth/utils";
import { createClient } from "@/lib/auth/server";
import { getRiskBadgeClasses, getRiskLabel } from "@/lib/risk";
import type { RiskLevel } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalScans: number;
  threatsDetected: number;
  highRisk: number;
  scansToday: number;
}

interface RecentScan {
  id: string;
  type: string;
  created_at: string;
  risk_score: number;
  risk_level: string;
  summary: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const SCAN_ICONS: Record<string, typeof MessageSquare> = {
  message: MessageSquare,
  url: Link2,
  qr: QrCode,
  voice: Mic,
  privacy: Cookie,
};

const SCAN_LABELS: Record<string, string> = {
  message: "Message",
  url: "URL",
  qr: "QR Code",
  voice: "Voice",
  privacy: "Privacy",
};

function startOfToday(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

// ── Data fetching ────────────────────────────────────────────────────────────
async function fetchDashboardData(userId: string): Promise<{
  stats: DashboardStats;
  recentThreats: RecentScan[];
}> {
  const empty = {
    stats: { totalScans: 0, threatsDetected: 0, highRisk: 0, scansToday: 0 },
    recentThreats: [] as RecentScan[],
  };

  try {
    const supabase = await createClient();
    const todayISO = startOfToday();

    // Single query: get all completed scans with their threat results
    const { data: scans, error } = await supabase
      .from("scans")
      .select(`
        id,
        type,
        created_at,
        threat_results (
          risk_score,
          risk_level,
          summary
        )
      `)
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[dashboard] Supabase query error:", error.message);
      return empty;
    }

    if (!scans || scans.length === 0) {
      return empty;
    }

    let totalScans = 0;
    let threatsDetected = 0;
    let highRisk = 0;
    let scansToday = 0;
    const recentThreats: RecentScan[] = [];

    for (const scan of scans) {
      totalScans++;

      // Check if scan is from today
      if (scan.created_at >= todayISO) {
        scansToday++;
      }

      // Extract threat result (Supabase returns joined relations as arrays)
      const threatArr = Array.isArray(scan.threat_results)
        ? scan.threat_results
        : scan.threat_results
        ? [scan.threat_results]
        : [];
      const threat = threatArr[0] as
        | { risk_score: number; risk_level: string; summary: string | null }
        | undefined;

      if (threat) {
        const level = threat.risk_level as RiskLevel;

        // A threat is detected when risk is suspicious or high-risk
        if (level === "suspicious" || level === "high-risk") {
          threatsDetected++;
        }

        if (level === "high-risk") {
          highRisk++;
        }

        // Collect recent threats (up to 5 with actual threats)
        if (
          (level === "suspicious" || level === "high-risk") &&
          recentThreats.length < 5
        ) {
          recentThreats.push({
            id: scan.id,
            type: scan.type,
            created_at: scan.created_at,
            risk_score: threat.risk_score,
            risk_level: threat.risk_level,
            summary: threat.summary,
          });
        }
      }
    }

    return {
      stats: { totalScans, threatsDetected, highRisk, scansToday },
      recentThreats,
    };
  } catch (err) {
    console.error("[dashboard] Unexpected error:", err);
    return empty;
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const user = await getUser();

  const { stats, recentThreats } = user
    ? await fetchDashboardData(user.id)
    : { stats: { totalScans: 0, threatsDetected: 0, highRisk: 0, scansToday: 0 }, recentThreats: [] };

  const statCards = [
    { label: t("totalScans"), value: stats.totalScans, icon: Scan },
    { label: t("threatsDetected"), value: stats.threatsDetected, icon: AlertTriangle },
    { label: t("highRiskDetections"), value: stats.highRisk, icon: ShieldAlert },
    { label: t("scansToday"), value: stats.scansToday, icon: TrendingUp },
  ];

  const quickActions = [
    { label: tc("detect"), desc: "Message", icon: MessageSquare, href: `/${locale}/dashboard/analyzer` },
    { label: "URL", desc: "Intelligence", icon: Link2, href: `/${locale}/dashboard/url` },
    { label: "QR", desc: "Guardian", icon: QrCode, href: `/${locale}/dashboard/qr` },
    { label: "Voice", desc: "Guard", icon: Mic, href: `/${locale}/dashboard/voice` },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t("welcomeBack")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="sentinel-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10">
                <stat.icon size={18} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Scan Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("quickScan")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="sentinel-card group hover:border-border-default transition-all hover:bg-surface-hover"
            >
              <action.icon size={24} className="text-accent-blue mb-3" />
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-text-muted">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Threats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("recentThreats")}</h2>
          {recentThreats.length > 0 && (
            <Link
              href={`/${locale}/dashboard/history`}
              className="text-xs text-accent-blue hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {recentThreats.length > 0 ? (
          <div className="space-y-3">
            {recentThreats.map((scan) => {
              const Icon = SCAN_ICONS[scan.type] ?? Scan;
              const riskLevel = (scan.risk_level ?? "safe") as RiskLevel;

              let dateStr = "";
              try {
                dateStr = new Date(scan.created_at).toLocaleString();
              } catch {
                dateStr = scan.created_at;
              }

              return (
                <div
                  key={scan.id}
                  className={`sentinel-card flex items-start gap-4 border-l-4 ${
                    riskLevel === "high-risk"
                      ? "border-l-red-500"
                      : "border-l-amber-500"
                  }`}
                >
                  <div className={`flex-shrink-0 rounded-lg p-2.5 ${
                    riskLevel === "high-risk"
                      ? "bg-red-500/10"
                      : "bg-amber-500/10"
                  }`}>
                    {riskLevel === "high-risk" ? (
                      <ShieldAlert size={18} className="text-red-400" />
                    ) : (
                      <AlertTriangle size={18} className="text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                        <Icon size={14} className="text-text-muted" />
                        {SCAN_LABELS[scan.type] ?? scan.type}
                      </span>
                      <span className={`sentinel-badge text-xs ${getRiskBadgeClasses(riskLevel)}`}>
                        {getRiskLabel(riskLevel)} &mdash; {scan.risk_score}/100
                      </span>
                    </div>
                    {scan.summary && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{scan.summary}</p>
                    )}
                    <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                      <Clock size={10} />
                      {dateStr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="sentinel-card">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield size={32} className="text-text-muted mb-3" />
              <p className="text-sm font-medium">{t("noScansYet")}</p>
              <p className="text-xs text-text-muted mt-1">{t("firstScanDesc")}</p>
              <Link
                href={`/${locale}/dashboard/analyzer`}
                className="sentinel-btn-primary mt-4 text-sm"
              >
                {t("runFirstScan")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
