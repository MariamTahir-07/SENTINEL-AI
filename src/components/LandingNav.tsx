"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { SentinelWordmark } from "./SentinelLogo";
import { Menu, X } from "lucide-react";

const navItems = [
  { key: "platform", href: "#platform" },
  { key: "protection", href: "#protection" },
  { key: "intelligence", href: "#intelligence" },
  { key: "security", href: "#security" },
  { key: "about", href: "#about" },
];

export function LandingNav() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-navy-950/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8" aria-label="Main navigation">
        <Link href={`/${locale}`} className="flex-shrink-0">
          <SentinelWordmark />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {t(item.key as "platform" | "protection" | "intelligence" | "security" | "about")}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href={`/${locale}/login`} className="sentinel-btn-secondary text-sm">
            {tc("signIn")}
          </Link>
          <Link href={`/${locale}/signup`} className="sentinel-btn-primary text-sm">
            {tc("getStarted")}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-text-secondary"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border-subtle bg-navy-950 px-4 py-4 md:hidden animate-fade-in">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary py-2"
                onClick={() => setOpen(false)}
              >
                {t(item.key as "platform" | "protection" | "intelligence" | "security" | "about")}
              </a>
            ))}
            <hr className="border-border-subtle" />
            <Link href={`/${locale}/login`} className="sentinel-btn-secondary text-sm w-full" onClick={() => setOpen(false)}>
              {tc("signIn")}
            </Link>
            <Link href={`/${locale}/signup`} className="sentinel-btn-primary text-sm w-full" onClick={() => setOpen(false)}>
              {tc("getStarted")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
