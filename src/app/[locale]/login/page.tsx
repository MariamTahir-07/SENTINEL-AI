"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SentinelWordmark } from "@/components/SentinelLogo";
import { ErrorState } from "@/components/States";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useParams().locale as string;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Login failed.");

      window.location.href = `/${locale}/dashboard`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <SentinelWordmark />
          </div>
          <h1 className="text-xl font-bold">{t("loginTitle")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("loginSubtitle")}</p>
        </div>

        {error && <ErrorState message={error} />}

        <form onSubmit={handleSubmit} className="sentinel-card space-y-4">
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
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="sentinel-btn-primary w-full">
            {loading ? "Signing in..." : tc("signIn")}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          {t("noAccount")}{" "}
          <Link href={`/${locale}/signup`} className="text-accent-blue hover:underline">
            {t("signupTitle")}
          </Link>
        </p>
      </div>
    </div>
  );
}
