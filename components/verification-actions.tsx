"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react"
import type { FreshnessState } from "@/lib/foru-ms/types"

interface VerificationActionsProps {
  postId: string
  threadId: string
  currentState: FreshnessState
  onStateChange?: (newState: FreshnessState) => void
}

function getUserVote(postId: string): "verify" | "report_outdated" | null {
  if (typeof window === "undefined") return null
  const votes = JSON.parse(localStorage.getItem("still_votes") || "{}")
  return votes[postId] || null
}

function setUserVote(postId: string, action: "verify" | "report_outdated") {
  if (typeof window === "undefined") return
  const votes = JSON.parse(localStorage.getItem("still_votes") || "{}")
  votes[postId] = action
  localStorage.setItem("still_votes", JSON.stringify(votes))
}

export function VerificationActions({ postId, threadId, currentState, onStateChange }: VerificationActionsProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isAssessing, setIsAssessing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [aiCooldown, setAiCooldown] = useState(0)
  const [userVote, setUserVoteState] = useState<"verify" | "report_outdated" | null>(null)
  const AI_COOLDOWN_SECONDS = 30

  useEffect(() => {
    setUserVoteState(getUserVote(postId))
  }, [postId])

  useEffect(() => {
    if (aiCooldown > 0) {
      const timer = setTimeout(() => setAiCooldown(aiCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [aiCooldown])

  const handleVerify = async () => {
    if (userVote === "verify") {
      setFeedback({ type: "info", message: "You've already verified this answer" })
      return
    }

    setIsVerifying(true)
    setFeedback(null)
    try {
      const response = await fetch(`/api/posts/${postId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, action: "verify" }),
      })

      if (response.ok) {
        setUserVote(postId, "verify")
        setUserVoteState("verify")
        setFeedback({ type: "success", message: "Marked as still true!" })
        onStateChange?.("VERIFIED")
      } else {
        const data = await response.json().catch(() => ({}))
        setFeedback({ type: "error", message: data.error || "Failed to verify" })
      }
    } catch (error) {
      setFeedback({ type: "error", message: "Network error" })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReportOutdated = async () => {
    if (userVote === "report_outdated") {
      setFeedback({ type: "info", message: "You've already marked this as outdated" })
      return
    }

    setIsVerifying(true)
    setFeedback(null)
    try {
      const response = await fetch(`/api/posts/${postId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, action: "report_outdated" }),
      })

      if (response.ok) {
        setUserVote(postId, "report_outdated")
        setUserVoteState("report_outdated")
        setFeedback({ type: "success", message: "Marked as outdated!" })
        onStateChange?.("OUTDATED")
      } else {
        const data = await response.json().catch(() => ({}))
        setFeedback({ type: "error", message: data.error || "Failed to report" })
      }
    } catch (error) {
      setFeedback({ type: "error", message: "Network error" })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleAIAssess = async () => {
    if (aiCooldown > 0) {
      setFeedback({ type: "error", message: `Please wait ${aiCooldown}s before using AI Context again` })
      return
    }

    setIsAssessing(true)
    setFeedback(null)
    try {
      const response = await fetch(`/api/posts/${postId}/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      })

      const data = await response.json()

      if (response.ok && data.assessment) {
        const { assessment, explanation } = data
        setAiCooldown(AI_COOLDOWN_SECONDS)
        if (assessment.is_outdated) {
          setFeedback({
            type: "error",
            message: explanation || assessment.reasoning || "AI detected this may be outdated",
          })
        } else {
          setFeedback({
            type: "info",
            message: assessment.reasoning || "AI thinks this answer is still valid",
          })
        }
      } else {
        setFeedback({ type: "error", message: data.error || "AI assessment failed" })
      }
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to assess with AI" })
    } finally {
      setIsAssessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAIAssess}
          disabled={isAssessing || isVerifying || aiCooldown > 0}
          className="h-9 gap-2 text-purple-400 hover:text-purple-400 hover:bg-purple-400/10 px-3 rounded-full text-xs justify-center"
        >
          {isAssessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span>{aiCooldown > 0 ? `Wait ${aiCooldown}s` : "AI Context"}</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleVerify}
          disabled={isVerifying || isAssessing || userVote === "verify"}
          className={`h-9 gap-2 px-3 rounded-full text-xs justify-center ${
            userVote === "verify"
              ? "text-emerald-400/50 bg-emerald-400/5 cursor-not-allowed"
              : "text-emerald-400 hover:text-emerald-400 hover:bg-emerald-400/10"
          }`}
        >
          {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>{userVote === "verify" ? "Verified ✓" : "Still True"}</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleReportOutdated}
          disabled={isVerifying || isAssessing || userVote === "report_outdated"}
          className={`h-9 gap-2 px-3 rounded-full text-xs justify-center ${
            userVote === "report_outdated"
              ? "text-red-400/50 bg-red-400/5 cursor-not-allowed"
              : "text-red-400 hover:text-red-400 hover:bg-red-400/10"
          }`}
        >
          {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5" />}
          <span>{userVote === "report_outdated" ? "Reported ✓" : "Outdated"}</span>
        </Button>
      </div>

      {feedback && (
        <div
          className={`text-xs p-3 rounded-lg w-full overflow-hidden ${
            feedback.type === "success"
              ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"
              : feedback.type === "error"
                ? "text-red-400 bg-red-400/10 border border-red-400/20"
                : "text-purple-400 bg-purple-400/10 border border-purple-400/20"
          }`}
        >
          <p className="break-words whitespace-pre-wrap leading-relaxed">{feedback.message}</p>
        </div>
      )}
    </div>
  )
}
