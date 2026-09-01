"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SentinelWordmark } from "@/components/SentinelLogo";
import { ErrorState } from "@/components/States";
import { localeNames } from "@/i18n/routing";

export default function SignupPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useParams().locale as string;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(locale);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, preferredLanguage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Signup failed.");

      window.location.href = `/${locale}/dashboard`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  const languages = Object.entries(localeNames);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <SentinelWordmark />
          </div>
          <h1 className="text-xl font-bold">{t("signupTitle")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("signupSubtitle")}</p>
        </div>

        {error && <ErrorState message={error} />}

        <form onSubmit={handleSubmit} className="sentinel-card space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">{t("fullName")}</label>
            <input
              type="text"
              className="sentinel-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">{t("email")}</label>
            <input
              type="email"
              className="sentinel-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">{t("password")}</label>
            <input
              type="password"
              className="sentinel-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">{t("confirmPassword")}</label>
            <input
              type="password"
              className="sentinel-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">{t("preferredLanguage")}</label>
            <select
              className="sentinel-input"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
            >
              {languages.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="sentinel-btn-primary w-full">
            {loading ? "Creating account..." : t("signupTitle")}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          {t("hasAccount")}{" "}
          <Link href={`/${locale}/login`} className="text-accent-blue hover:underline">
            {tc("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
