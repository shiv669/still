import type { FreshnessState, PostMetadata } from "../foru-ms/types"
import { FRESHNESS_WINDOWS } from "./types"

export function calculateFreshnessState(metadata: PostMetadata, currentTime: Date = new Date()): FreshnessState {
  const { freshness } = metadata
  const lastVerified = new Date(freshness.last_verified_at)
  const daysSinceVerification = Math.floor((currentTime.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24))

  // If community reported it outdated
  if (freshness.outdated_reports > 2) {
    return "OUTDATED"
  }

  // If verification score is too low
  if (freshness.verification_score < 0.3) {
    return "OUTDATED"
  }

  if (freshness.verification_count === 0 && freshness.outdated_reports === 0) {
    return "POSSIBLY_OUTDATED"
  }

  // Time-based state transitions
  if (daysSinceVerification > freshness.freshness_window_days * 1.5) {
    return "OUTDATED"
  }

  if (daysSinceVerification > freshness.freshness_window_days) {
    return "POSSIBLY_OUTDATED"
  }

  return "VERIFIED"
}

export function getDefaultFreshnessMetadata(
  questionType: keyof typeof FRESHNESS_WINDOWS = "stable-concept",
): PostMetadata {
  const now = new Date().toISOString()
  return {
    freshness: {
      created_at: now,
      last_verified_at: now,
      freshness_window_days: FRESHNESS_WINDOWS[questionType],
      state: "POSSIBLY_OUTDATED",
      verification_score: 0.5,
      verification_count: 0,
      outdated_reports: 0,
    },
  }
}
