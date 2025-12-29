import type { PostMetadata } from "../foru-ms/types"
import type { ForumsPost } from "../foru-ms/client"
import { calculateFreshnessState } from "./state-machine"
import { forumsClient } from "../foru-ms/client"

export interface VerificationAction {
  type: "verify" | "report_outdated"
  userId: string
  timestamp: Date
  confidence?: number
  llmAssessment?: {
    confidence_delta: number
    reasoning: string
  }
}

export class FreshnessEngine {
  /**
   * Process a verification action on a post
   * Returns updated metadata
   */
  static async processVerification(post: ForumsPost, action: VerificationAction): Promise<PostMetadata> {
    const currentMetadata = post.extendedData || this.createDefaultMetadata()
    const freshness = currentMetadata.freshness || this.createDefaultMetadata().freshness

    const updatedFreshness = { ...freshness }

    if (action.type === "verify") {
      updatedFreshness.last_verified_at = action.timestamp.toISOString()
      updatedFreshness.verification_count = (freshness.verification_count || 0) + 1

      let boost = 0.1 * (1 / Math.sqrt((freshness.verification_count || 0) + 1))

      if (action.llmAssessment) {
        boost *= 1 + action.llmAssessment.confidence_delta * 0.5
      }

      updatedFreshness.verification_score = Math.min(1.0, (freshness.verification_score || 1.0) + boost)
      updatedFreshness.outdated_reports = Math.max(0, (freshness.outdated_reports || 0) - 1)
    } else if (action.type === "report_outdated") {
      updatedFreshness.outdated_reports = (freshness.outdated_reports || 0) + 1

      let penalty = 0.15

      if (action.llmAssessment && action.llmAssessment.confidence_delta < 0) {
        penalty *= 1 + Math.abs(action.llmAssessment.confidence_delta) * 0.5
      }

      updatedFreshness.verification_score = Math.max(0, (freshness.verification_score || 1.0) - penalty)
    }

    const updatedMetadata: PostMetadata = {
      freshness: updatedFreshness,
    }
    updatedMetadata.freshness.state = calculateFreshnessState(updatedMetadata)

    return updatedMetadata
  }

  /**
   * Batch recalculate freshness states for all posts in a thread
   */
  static async recalculateThreadFreshness(threadId: string): Promise<void> {
    try {
      const postsData = await forumsClient.threads.getPosts(threadId, {})
      const posts = postsData.posts || []

      const updates = posts
        .filter((post) => post.extendedData?.freshness)
        .map(async (post) => {
          const metadata = post.extendedData!
          const currentState = metadata.freshness.state
          const newState = calculateFreshnessState(metadata)

          if (currentState !== newState) {
            const updatedMetadata = {
              ...metadata,
              freshness: {
                ...metadata.freshness,
                state: newState,
              },
            }

            await forumsClient.posts.update(post.id, {
              extendedData: updatedMetadata,
            })
          }
        })

      await Promise.all(updates)
    } catch (error) {
      console.error("[v0] Recalculate thread freshness error:", error)
      throw error
    }
  }

  /**
   * Get freshness statistics for a thread
   */
  static getThreadStatistics(posts: ForumsPost[]): {
    verified: number
    possiblyOutdated: number
    outdated: number
    total: number
  } {
    const stats = {
      verified: 0,
      possiblyOutdated: 0,
      outdated: 0,
      total: posts.length,
    }

    posts.forEach((post) => {
      const metadata = post.extendedData
      if (!metadata?.freshness) return

      const state = calculateFreshnessState(metadata)
      if (state === "VERIFIED") stats.verified++
      else if (state === "POSSIBLY_OUTDATED") stats.possiblyOutdated++
      else if (state === "OUTDATED") stats.outdated++
    })

    return stats
  }

  private static createDefaultMetadata(): PostMetadata {
    const now = new Date().toISOString()
    return {
      freshness: {
        created_at: now,
        last_verified_at: now,
        freshness_window_days: 365,
        state: "VERIFIED",
        verification_score: 1.0,
        verification_count: 0,
        outdated_reports: 0,
      },
    }
  }
}
