import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { LandingNav } from "@/components/LandingNav";
import { SentinelLogo } from "@/components/SentinelLogo";
import {
  MessageSquare, Link2, QrCode, Mic, Cookie, Shield, Scan,
  ArrowRight, ChevronRight, Brain, Eye, Lock, Zap, Globe,
  Search, FileWarning, PhoneCall,
} from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const locale = useLocale();

  return (
    <div className="min-h-screen">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-blue/5 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-xs text-text-secondary">
              <Shield size={12} className="text-accent-cyan" />
              AI-Powered Digital Trust Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={`/${locale}/signup`} className="sentinel-btn-primary px-6 py-3 text-base">
                {t("analyzeThreat")}
                <ArrowRight size={16} />
              </Link>
              <Link href="#platform" className="sentinel-btn-secondary px-6 py-3 text-base">
                {t("exploreProtection")}
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="sentinel-card-elevated relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="sentinel-badge sentinel-badge-neutral text-xs">{tc("demoData")}</span>
              </div>
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-risk-high/15">
                    <Shield size={20} className="text-risk-high" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-risk-high">High Risk — 87/100</p>
                    <p className="text-xs text-text-muted">Phishing detected in message</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-navy-900 p-3">
                    <p className="text-xs text-text-muted">Signals</p>
                    <p className="text-lg font-semibold">4</p>
                  </div>
                  <div className="rounded-lg bg-navy-900 p-3">
                    <p className="text-xs text-text-muted">Threats</p>
                    <p className="text-lg font-semibold text-risk-high">3</p>
                  </div>
                  <div className="rounded-lg bg-navy-900 p-3">
                    <p className="text-xs text-text-muted">Confidence</p>
                    <p className="text-lg font-semibold">92%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {["Urgency manipulation", "Brand impersonation", "Suspicious link"].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <ChevronRight size={12} className="text-accent-cyan" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Threat Channels */}
      <section id="platform" className="py-20 border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("threatChannels")}</h2>
            <p className="mt-3 text-text-secondary max-w-2xl mx-auto">{t("threatChannelsDesc")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MessageSquare, label: "Message Analyzer", desc: "SMS, WhatsApp, Email" },
              { icon: Link2, label: "URL Intelligence", desc: "Links & domains" },
              { icon: QrCode, label: "QR Guardian", desc: "QR code destinations" },
              { icon: Mic, label: "Voice Guard", desc: "Call recordings" },
            ].map((item) => (
              <div key={item.label} className="sentinel-card group hover:border-border-default transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 mb-3">
                  <item.icon size={20} className="text-accent-blue" />
                </div>
                <h3 className="font-medium text-sm">{item.label}</h3>
                <p className="text-xs text-text-muted mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explainable AI */}
      <section className="py-20 border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">{t("explainableAI")}</h2>
              <p className="mt-4 text-text-secondary leading-relaxed">{t("explainableAIDesc")}</p>
              <div className="mt-6 space-y-3">
                {["What was detected", "Why it matters", "What you should do"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-cyan/15 text-xs font-semibold text-accent-cyan">
                      {i + 1}
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="sentinel-card-elevated">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-accent-cyan" />
                <span className="text-xs font-medium text-text-secondary">EXPLAINABLE AI</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-navy-900 p-3">
                  <p className="text-xs text-text-muted mb-1">Detection</p>
                  <p className="text-sm">Urgency manipulation detected — message creates false time pressure</p>
                </div>
                <div className="rounded-lg bg-navy-900 p-3">
                  <p className="text-xs text-text-muted mb-1">Reasoning</p>
                  <p className="text-sm">Legitimate organizations rarely demand immediate action through unsolicited messages</p>
                </div>
                <div className="rounded-lg bg-navy-900 p-3">
                  <p className="text-xs text-text-muted mb-1">Recommendation</p>
                  <p className="text-sm">Contact the organization directly through their official channel to verify</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protection Features */}
      <section id="protection" className="py-20 border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageSquare, title: t("messageProtection"), desc: t("messageProtectionDesc") },
              { icon: Link2, title: tn("urlIntelligence"), desc: t("urlIntelligenceDesc") },
              { icon: QrCode, title: tn("qrGuardian"), desc: t("qrGuardianDesc") },
              { icon: Mic, title: tn("voiceGuard"), desc: t("voiceGuardDesc") },
              { icon: Cookie, title: tn("cookieGuardian"), desc: t("cookieGuardianDesc") },
              { icon: FileWarning, title: "Deepfake Detection", desc: "Detect AI-generated voices and deepfake content. Coming soon." },
            ].map((feature) => (
              <div key={feature.title} className="sentinel-card group hover:border-border-default transition-colors relative">
                {feature.title === "Deepfake Detection" && (
                  <span className="sentinel-badge sentinel-badge-neutral absolute top-4 right-4 text-xs">{tc("comingSoon")}</span>
                )}
                <feature.icon size={24} className="text-accent-blue mb-4" />
                <h3 className="font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="intelligence" className="py-20 border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("howItWorks")}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: t("step1Title"), desc: t("step1Desc"), icon: Search },
              { step: "02", title: t("step2Title"), desc: t("step2Desc"), icon: Eye },
              { step: "03", title: t("step3Title"), desc: t("step3Desc"), icon: Lock },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10">
                  <item.icon size={24} className="text-accent-blue" />
                </div>
                <p className="text-xs font-semibold text-accent-cyan mb-2">{item.step}</p>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Philosophy */}
      <section id="security" className="py-20 border-t border-border-subtle">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
          <Shield size={32} className="mx-auto text-accent-cyan mb-4" />
          <h2 className="text-3xl font-bold">{t("securityPhilosophy")}</h2>
          <p className="mt-4 text-text-secondary leading-relaxed">{t("securityPhilosophyDesc")}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Zap, label: "Fast Analysis", desc: "Results in seconds" },
              { icon: Globe, label: "Multilingual", desc: "17 languages" },
              { icon: Lock, label: "Privacy First", desc: "Minimal data retention" },
            ].map((item) => (
              <div key={item.label} className="sentinel-card">
                <item.icon size={20} className="text-accent-blue mb-2" />
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-text-muted mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Roadmap */}
      <section id="about" className="py-20 border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("futureRoadmap")}</h2>
          </div>
          <div className="mx-auto max-w-lg sentinel-card relative">
            <span className="sentinel-badge sentinel-badge-neutral absolute top-4 right-4">{tc("comingSoon")}</span>
            <PhoneCall size={24} className="text-accent-blue mb-4" />
            <h3 className="font-semibold">{t("deepVoice")}</h3>
            <p className="mt-2 text-sm text-text-secondary">{t("deepVoiceDesc")}</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-border-subtle">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">{t("finalCTA")}</h2>
          <p className="mt-3 text-text-secondary">{t("finalCTADesc")}</p>
          <Link href={`/${locale}/signup`} className="sentinel-btn-primary mt-6 px-8 py-3 text-base inline-flex">
            {tc("getStarted")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <SentinelLogo size={24} />
              <span className="text-sm text-text-muted">Sentinel AI</span>
            </div>
            <p className="text-xs text-text-muted">
              AI-assisted analysis. Not a guarantee of security. Always exercise personal judgment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
