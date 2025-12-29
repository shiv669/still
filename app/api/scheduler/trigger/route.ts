import { NextResponse } from "next/server"
import { FreshnessScheduler } from "@/lib/freshness/scheduler"

export async function POST() {
  try {
    // Manually trigger a freshness recalculation
    await FreshnessScheduler.triggerManual()

    return NextResponse.json({
      success: true,
      message: "Freshness recalculation triggered",
    })
  } catch (error) {
    console.error("[v0] Error triggering scheduler:", error)
    return NextResponse.json({ error: "Failed to trigger recalculation" }, { status: 500 })
  }
}
