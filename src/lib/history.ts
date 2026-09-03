import { createClient } from "@/lib/auth/server";
import type { ThreatAnalysisResult, PrivacyAnalysisResult, ScanType } from "@/types";

/**
 * Persist a completed scan + its analysis result to the database.
 * Called from API routes after a successful analysis.
 * Failures are silently ignored so history issues never block the user.
 */
export async function saveScanHistory(
  userId: string,
  scanType: ScanType,
  result: ThreatAnalysisResult | PrivacyAnalysisResult
): Promise<void> {
  try {
    const supabase = await createClient();

    // 1. Create scan record
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({ user_id: userId, type: scanType, status: "completed" })
      .select()
      .single();

    if (scanError || !scan) {
      console.error("[saveScanHistory] scan insert failed:", scanError?.message);
      return;
    }

    // Privacy scans don't have ThreatAnalysisResult fields
    const isPrivacy = scanType === "privacy";

    if (!isPrivacy) {
      const threat = result as ThreatAnalysisResult;

      // 2. Create threat result
      const { data: threatResult, error: threatError } = await supabase
        .from("threat_results")
        .insert({
          scan_id: scan.id,
          risk_score: threat.riskScore,
          risk_level: threat.riskLevel,
          confidence: threat.confidence ?? null,
          detected_language: threat.detectedLanguage ?? null,
          summary: threat.explanation?.[0] ?? null,
        })
        .select()
        .single();

      if (threatError || !threatResult) {
        console.error("[saveScanHistory] threat_result insert failed:", threatError?.message);
        return;
      }

      // 3. Insert signals (batch)
      if (threat.signals?.length > 0) {
        const signalRows = threat.signals.map((s) => ({
          threat_result_id: threatResult.id,
          name: s.name,
          severity: s.severity,
          explanation: s.explanation,
        }));
        const { error: sigError } = await supabase.from("threat_signals").insert(signalRows);
        if (sigError) console.error("[saveScanHistory] signals insert failed:", sigError.message);
      }

      // 4. Insert recommendations (batch)
      if (threat.recommendedActions?.length > 0) {
        const recRows = threat.recommendedActions.map((action, i) => ({
          threat_result_id: threatResult.id,
          action,
          priority: i + 1,
        }));
        const { error: recError } = await supabase.from("recommendations").insert(recRows);
        if (recError) console.error("[saveScanHistory] recommendations insert failed:", recError.message);
      }
    }
  } catch (err) {
    console.error("[saveScanHistory] unexpected error:", err);
  }
}
