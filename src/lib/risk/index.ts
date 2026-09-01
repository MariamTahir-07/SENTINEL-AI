import type { RiskLevel, ThreatAnalysisResult } from "@/types";

const SAFE_MAX = 29;
const SUSPICIOUS_MAX = 69;

export function classifyRisk(score: number): RiskLevel {
  if (score <= SAFE_MAX) return "safe";
  if (score <= SUSPICIOUS_MAX) return "suspicious";
  return "high-risk";
}

export function computeRiskScore(result: Pick<ThreatAnalysisResult, "signals">): number {
  let score = 0;
  for (const signal of result.signals) {
    switch (signal.severity) {
      case "high":
        score += 25;
        break;
      case "medium":
        score += 15;
        break;
      case "low":
        score += 5;
        break;
    }
  }
  return Math.min(score, 100);
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "safe":
      return "text-emerald-400";
    case "suspicious":
      return "text-amber-400";
    case "high-risk":
      return "text-red-400";
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case "safe":
      return "bg-emerald-500/10 border-emerald-500/20";
    case "suspicious":
      return "bg-amber-500/10 border-amber-500/20";
    case "high-risk":
      return "bg-red-500/10 border-red-500/20";
  }
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case "safe":
      return "Safe";
    case "suspicious":
      return "Suspicious";
    case "high-risk":
      return "High Risk";
  }
}

export function getRiskBadgeClasses(level: RiskLevel): string {
  switch (level) {
    case "safe":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    case "suspicious":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "high-risk":
      return "bg-red-500/15 text-red-400 border border-red-500/30";
  }
}
