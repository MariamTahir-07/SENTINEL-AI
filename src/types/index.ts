// Core types for Sentinel AI

export type RiskLevel = "safe" | "suspicious" | "high-risk";
export type SignalSeverity = "low" | "medium" | "high";
export type ScanType = "message" | "url" | "qr" | "voice" | "privacy";
export type ScanStatus = "pending" | "processing" | "completed" | "failed";

export interface ThreatSignal {
  name: string;
  severity: SignalSeverity;
  explanation: string;
}

export interface ThreatAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  threatTypes: string[];
  signals: ThreatSignal[];
  explanation: string[];
  recommendedActions: string[];
  confidence: number;
  detectedLanguage: string;
}

export interface URLAnalysisResult extends ThreatAnalysisResult {
  url: string;
  hostname: string;
  protocol: string;
  suspiciousPatterns: string[];
  domainAge: string | null;
  reputation: string | null;
}

export interface QRAnalysisResult extends ThreatAnalysisResult {
  decodedUrl: string;
  urlAnalysis: URLAnalysisResult | null;
}

export interface VoiceAnalysisResult extends ThreatAnalysisResult {
  transcript: string;
  duration: number | null;
}

export interface PrivacyAnalysisResult {
  totalCookies: number;
  thirdPartyCookies: number;
  trackers: number;
  advertisingTrackers: number;
  privacyRisk: RiskLevel;
  categories: CookieCategory[];
  recommendations: string[];
}

export interface CookieCategory {
  name: string;
  type: "essential" | "analytics" | "advertising" | "tracking" | "third-party" | "unknown";
  count: number;
}

export interface ScanRecord {
  id: string;
  userId: string;
  type: ScanType;
  status: ScanStatus;
  createdAt: string;
  result: ThreatAnalysisResult | null;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  uiLanguage: string;
  analysisLanguage: string;
}

export interface TrustScore {
  overall: number;
  communication: number;
  webUrls: number;
  voice: number;
  privacy: number;
}

export interface DemoExample {
  id: string;
  label: string;
  description: string;
  content: string;
  type: ScanType;
}
