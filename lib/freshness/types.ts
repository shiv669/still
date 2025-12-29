export interface FreshnessConfig {
  question_type: "fast-changing-tech" | "stable-concept" | "opinion" | "policy"
  window_days: number
}

export const FRESHNESS_WINDOWS: Record<FreshnessConfig["question_type"], number> = {
  "fast-changing-tech": 90, // 3 months
  "stable-concept": 365, // 1 year
  opinion: 180, // 6 months
  policy: 180, // 6 months
}

export interface VerificationEvent {
  user_id: string
  timestamp: string
  action: "verify" | "report_outdated"
  confidence?: number
}
