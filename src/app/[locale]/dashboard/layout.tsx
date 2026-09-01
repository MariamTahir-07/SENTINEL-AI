"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SentinelWordmark } from "@/components/SentinelLogo";
import {
  LayoutDashboard, MessageSquare, Link2, QrCode, Mic, Cookie,
  Clock, Shield, Settings, Menu, X, LogOut, ChevronLeft,
} from "lucide-react";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "messageAnalyzer", href: "/dashboard/analyzer", icon: MessageSquare },
  { key: "urlIntelligence", href: "/dashboard/url", icon: Link2 },
  { key: "qrGuardian", href: "/dashboard/qr", icon: QrCode },
  { key: "voiceGuard", href: "/dashboard/voice", icon: Mic },
  { key: "cookieGuardian", href: "/dashboard/privacy", icon: Cookie },
  { key: "threatHistory", href: "/dashboard/history", icon: Clock },
  { key: "trustScore", href: "/dashboard/trust-score", icon: Shield },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string) {
    if (href === `/${locale}/dashboard`) {
      return pathname === `/${locale}/dashboard`;
    }
    return pathname.startsWith(`/${locale}${href}`);
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border-subtle lg:bg-surface">
        <div className="flex h-16 items-center px-4 border-b border-border-subtle">
          <Link href={`/${locale}`}>
            <SentinelWordmark />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const href = `/${locale}${item.href}`;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-accent-blue/10 text-accent-blue"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <item.icon size={18} />
                <span>{t(item.key as keyof typeof navItems[number])}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border-subtle p-3">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={18} />
            <span>Home</span>
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-navy-950/80" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-border-subtle animate-fade-in">
            <div className="flex h-16 items-center justify-between px-4 border-b border-border-subtle">
              <SentinelWordmark />
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-text-secondary" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const href = `/${locale}${item.href}`;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.key}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-accent-blue/10 text-accent-blue"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{t(item.key as keyof typeof navItems[number])}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-border-subtle px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-text-secondary"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <SentinelWordmark />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
