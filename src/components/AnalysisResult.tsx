import type { ThreatAnalysisResult } from "@/types";
import { getRiskBadgeClasses, getRiskLabel } from "@/lib/risk";
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle, Info, ArrowRight } from "lucide-react";

interface AnalysisResultProps {
  result: ThreatAnalysisResult;
  labels?: {
    threatTypes?: string;
    signals?: string;
    whyFlagged?: string;
    recommended?: string;
    language?: string;
    confidence?: string;
    aiAssessment?: string;
  };
}

export function AnalysisResult({ result, labels }: AnalysisResultProps) {
  const l = {
    threatTypes: labels?.threatTypes ?? "Threat Types",
    signals: labels?.signals ?? "Detected Signals",
    whyFlagged: labels?.whyFlagged ?? "Why Sentinel Flagged This",
    recommended: labels?.recommended ?? "Recommended Actions",
    language: labels?.language ?? "Detected Language",
    confidence: labels?.confidence ?? "Confidence",
    aiAssessment: labels?.aiAssessment ?? "AI-assisted risk assessment",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Risk Score Header */}
      <div className={`sentinel-card border ${getRiskBadgeClasses(result.riskLevel)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {result.riskLevel === "safe" ? (
              <ShieldCheck className="text-risk-safe" size={28} />
            ) : result.riskLevel === "suspicious" ? (
              <AlertTriangle className="text-risk-suspicious" size={28} />
            ) : (
              <ShieldAlert className="text-risk-high" size={28} />
            )}
            <div>
              <p className="text-xl font-semibold">{getRiskLabel(result.riskLevel)}</p>
              <p className="text-sm text-text-secondary">{l.aiAssessment}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{result.riskScore}</p>
            <p className="text-xs text-text-muted">/ 100</p>
          </div>
        </div>
      </div>

      {/* Threat Types */}
      {result.threatTypes.length > 0 && (
        <div className="sentinel-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <AlertTriangle size={14} />
            {l.threatTypes}
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.threatTypes.map((type) => (
              <span key={type} className={`sentinel-badge ${getRiskBadgeClasses(result.riskLevel)}`}>
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detected Signals */}
      {result.signals.length > 0 && (
        <div className="sentinel-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Info size={14} />
            {l.signals}
          </h3>
          <div className="space-y-3">
            {result.signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-navy-900 p-3">
                <span
                  className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                    signal.severity === "high"
                      ? "bg-risk-high"
                      : signal.severity === "medium"
                      ? "bg-risk-suspicious"
                      : "bg-risk-safe"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">{signal.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{signal.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {result.explanation.length > 0 && (
        <div className="sentinel-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Info size={14} />
            {l.whyFlagged}
          </h3>
          <ul className="space-y-2">
            {result.explanation.map((exp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <ArrowRight size={14} className="mt-0.5 flex-shrink-0 text-accent-cyan" />
                {exp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {result.recommendedActions.length > 0 && (
        <div className="sentinel-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <CheckCircle size={14} />
            {l.recommended}
          </h3>
          <ul className="space-y-2">
            {result.recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-blue/20 text-xs text-accent-blue">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span>{l.confidence}: {result.confidence}%</span>
        <span>{l.language}: {result.detectedLanguage}</span>
      </div>
    </div>
  );
}
