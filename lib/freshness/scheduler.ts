import { forumsClient } from "../foru-ms/client"
import { FreshnessEngine } from "./engine"

export class FreshnessScheduler {
  private static isRunning = false
  private static intervalId: NodeJS.Timeout | null = null

  /**
   * Start the background scheduler
   * Runs every hour to recalculate freshness states
   */
  static start(intervalMinutes = 60) {
    if (this.isRunning) {
      console.log("[v0] Freshness scheduler already running")
      return
    }

    console.log(`[v0] Starting freshness scheduler (interval: ${intervalMinutes}m)`)
    this.isRunning = true

    // Run immediately on start
    this.runBatch()

    // Then run at intervals
    this.intervalId = setInterval(
      () => {
        this.runBatch()
      },
      intervalMinutes * 60 * 1000,
    )
  }

  /**
   * Stop the scheduler
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log("[v0] Freshness scheduler stopped")
  }

  /**
   * Run a batch recalculation for all threads
   */
  private static async runBatch() {
    try {
      console.log("[v0] Running freshness recalculation batch...")

      // Fetch all threads (paginated)
      const response = await forumsClient.getThreads(1, 100)
      const threads = response.threads || []

      console.log(`[v0] Found ${threads.length} threads to process`)

      // Process each thread (with rate limiting)
      for (const thread of threads) {
        try {
          await FreshnessEngine.recalculateThreadFreshness(thread.id)
          // Small delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`[v0] Failed to recalculate thread ${thread.id}:`, error)
          // Continue with other threads
        }
      }

      console.log("[v0] Freshness recalculation batch complete")
    } catch (error) {
      console.error("[v0] Error in freshness batch:", error)
    }
  }

  /**
   * Manually trigger a batch recalculation
   */
  static async triggerManual() {
    console.log("[v0] Manual freshness recalculation triggered")
    await this.runBatch()
  }
}
