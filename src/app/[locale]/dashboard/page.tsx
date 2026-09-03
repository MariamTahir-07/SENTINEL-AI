import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Shield, Scan, AlertTriangle, ShieldAlert, TrendingUp,
  MessageSquare, Link2, QrCode, Mic,
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();

  const stats = [
    { label: t("totalScans"), value: "0", icon: Scan },
    { label: t("threatsDetected"), value: "0", icon: AlertTriangle },
    { label: t("highRiskDetections"), value: "0", icon: ShieldAlert },
    { label: t("scansToday"), value: "0", icon: TrendingUp },
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
        {stats.map((stat) => (
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
        <h2 className="text-lg font-semibold mb-4">{t("recentThreats")}</h2>
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
      </div>
    </div>
  );
}
