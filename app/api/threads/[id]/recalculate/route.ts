import { type NextRequest, NextResponse } from "next/server"
import { FreshnessEngine } from "@/lib/freshness/engine"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: threadId } = await params

    await FreshnessEngine.recalculateThreadFreshness(threadId)

    return NextResponse.json({ success: true, message: "Thread freshness recalculated" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to recalculate thread freshness" }, { status: 500 })
  }
}
