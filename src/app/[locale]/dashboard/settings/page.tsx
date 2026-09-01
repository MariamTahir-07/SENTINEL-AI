"use client";

import { useTranslations } from "next-intl";
import { Settings, User, Globe, Shield, Lock } from "lucide-react";
import { localeNames } from "@/i18n/routing";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  const languages = Object.entries(localeNames);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Settings size={24} className="text-accent-blue" />
          {t("title")}
        </h1>
      </div>

      {/* Profile */}
      <section className="sentinel-card space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <User size={18} className="text-accent-blue" />
          <h2 className="font-semibold">{t("profile")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Full Name</label>
            <input className="sentinel-input" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Email</label>
            <input className="sentinel-input" type="email" placeholder="your@email.com" disabled />
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="sentinel-card space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Globe size={18} className="text-accent-blue" />
          <h2 className="font-semibold">{t("language")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">{t("uiLanguage")}</label>
            <select className="sentinel-input">
              {languages.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">{t("analysisLanguage")}</label>
            <select className="sentinel-input">
              <option value="auto">{t("autoDetect")}</option>
              {languages.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="sentinel-card space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Lock size={18} className="text-accent-blue" />
          <h2 className="font-semibold">{t("security")}</h2>
        </div>
        <button className="sentinel-btn-secondary text-sm">{t("changePassword")}</button>
      </section>

      {/* Privacy */}
      <section className="sentinel-card space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={18} className="text-accent-blue" />
          <h2 className="font-semibold">{t("privacy")}</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Sentinel AI follows data minimization principles. Only scan results and preferences are stored.
        </p>
        <button className="sentinel-btn-secondary text-sm text-risk-high border-risk-high/30 hover:bg-risk-high/10">
          {t("deleteAccount")}
        </button>
      </section>

      <button className="sentinel-btn-primary">
        {tc("save")}
      </button>
    </div>
  );
}
