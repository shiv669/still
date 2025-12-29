"use client"

import { useEffect, useState } from "react"
import type { FreshnessState } from "@/lib/foru-ms/types"
import { cn } from "@/lib/utils"

interface FreshnessTimelineProps {
  createdAt: Date
  lastVerifiedAt: Date
  freshnessWindowDays: number
  state: FreshnessState
}

export function FreshnessTimeline({ createdAt, lastVerifiedAt, freshnessWindowDays, state }: FreshnessTimelineProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const now = new Date().getTime()
    const verifiedTime = lastVerifiedAt.getTime()
    const windowMs = freshnessWindowDays * 24 * 60 * 60 * 1000

    const elapsed = now - verifiedTime
    const progressPercent = Math.min(100, (elapsed / windowMs) * 100)

    setProgress(progressPercent)
  }, [lastVerifiedAt, freshnessWindowDays])

  const getProgressColor = () => {
    if (state === "VERIFIED") return "bg-emerald-400"
    if (state === "POSSIBLY_OUTDATED") return "bg-yellow-400"
    return "bg-red-400"
  }

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center justify-between text-xs text-[#666666]">
        <span>Last verified</span>
        <span>
          {progress.toFixed(0)}% of {freshnessWindowDays}d window
        </span>
        <span>Expiry</span>
      </div>

      <div className="relative h-1.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
        <div
          className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-500", getProgressColor())}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
