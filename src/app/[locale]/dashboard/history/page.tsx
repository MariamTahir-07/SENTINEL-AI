import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Clock, Scan, Shield } from "lucide-react";

export default function HistoryPage() {
  const t = useTranslations("history");
  const locale = useLocale();

  const filters = [
    t("filterAll"), t("filterSafe"), t("filterSuspicious"), t("filterHighRisk"),
    t("filterMessage"), t("filterUrl"), t("filterQr"), t("filterVoice"),
  ];

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

      {/* Empty State */}
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
    </div>
  );
}
