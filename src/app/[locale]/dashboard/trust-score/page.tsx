import { useTranslations } from "next-intl";
import { Shield, MessageSquare, Link2, Mic, Cookie, Info } from "lucide-react";

export default function TrustScorePage() {
  const t = useTranslations("trustScore");

  const dimensions = [
    { key: "overall", label: t("overall"), icon: Shield, value: 0 },
    { key: "communication", label: t("communication"), icon: MessageSquare, value: 0 },
    { key: "webUrls", label: t("webUrls"), icon: Link2, value: 0 },
    { key: "voice", label: t("voice"), icon: Mic, value: 0 },
    { key: "privacy", label: t("privacy"), icon: Cookie, value: 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield size={24} className="text-accent-blue" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
      </div>

      {/* Overall Score */}
      <div className="sentinel-card text-center py-10">
        <div className="relative mx-auto h-32 w-32">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-border-subtle" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-accent-blue" strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">--</span>
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold">{t("overall")}</p>
      </div>

      {/* Dimension Scores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dimensions.slice(1).map((dim) => (
          <div key={dim.key} className="sentinel-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10">
                <dim.icon size={16} className="text-accent-blue" />
              </div>
              <span className="text-sm font-medium">{dim.label}</span>
            </div>
            <div className="h-2 rounded-full bg-border-subtle">
              <div className="h-2 rounded-full bg-accent-blue" style={{ width: `${dim.value}%` }} />
            </div>
            <p className="mt-2 text-xs text-text-muted">{dim.value}%</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="sentinel-card-elevated flex items-start gap-3">
        <Info size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-muted">{t("disclaimer")}</p>
      </div>
    </div>
  );
}
