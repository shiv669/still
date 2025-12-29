"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { FreshnessBadge } from "./freshness-badge"
import { Button } from "./ui/button"
import { MessageSquare, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react"
import type { ForumsThread, ForumsPost } from "@/lib/foru-ms/client"
import type { FreshnessState } from "@/lib/foru-ms/types"

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

interface FeaturedQuestionProps {
  thread: ForumsThread
}

interface AnswerPreview {
  id: string
  body: string
  state: FreshnessState
  verificationScore: number
  timeAgo: string
}

export function FeaturedQuestion({ thread }: FeaturedQuestionProps) {
  const [answers, setAnswers] = useState<AnswerPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{
    answerId: string
    type: "success" | "error" | "info"
    message: string
  } | null>(null)
  const [actionLoading, setActionLoading] = useState<{ answerId: string; action: string } | null>(null)
  const [aiCooldowns, setAiCooldowns] = useState<Record<string, number>>({})
  const [userVotes, setUserVotes] = useState<Record<string, "verify" | "report_outdated" | null>>({})
  const AI_COOLDOWN_SECONDS = 30

  useEffect(() => {
    const hasActiveCooldown = Object.values(aiCooldowns).some((v) => v > 0)
    if (hasActiveCooldown) {
      const timer = setTimeout(() => {
        setAiCooldowns((prev) => {
          const updated: Record<string, number> = {}
          for (const [id, val] of Object.entries(prev)) {
            if (val > 0) updated[id] = val - 1
          }
          return updated
        })
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [aiCooldowns])

  const fetchAnswers = async () => {
    try {
      const response = await fetch(`/api/threads/${thread.id}/posts`)
      const data = await response.json()

      if (data.posts && data.posts.length > 0) {
        const mappedAnswers = data.posts.slice(0, 3).map((post: ForumsPost) => {
          const freshnessData = post.extendedData?.freshness
          const freshnessState = (freshnessData?.state as FreshnessState) || "VERIFIED"
          const verificationScore = freshnessData?.verification_score ?? 1
          return {
            id: post.id,
            body: post.body,
            state: freshnessState,
            verificationScore,
            timeAgo: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
          }
        })
        setAnswers(mappedAnswers)

        const votes: Record<string, "verify" | "report_outdated" | null> = {}
        mappedAnswers.forEach((answer: AnswerPreview) => {
          votes[answer.id] = getUserVote(answer.id)
        })
        setUserVotes(votes)
      }
    } catch (error) {
      console.error("Failed to fetch answers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnswers()
  }, [thread.id])

  const handleAction = async (answerId: string, action: "verify" | "report_outdated" | "ai_context") => {
    if (action === "ai_context" && (aiCooldowns[answerId] || 0) > 0) {
      setFeedback({
        answerId,
        type: "error",
        message: `Please wait ${aiCooldowns[answerId]}s before using AI Context again`,
      })
      return
    }

    if (action !== "ai_context" && userVotes[answerId] === action) {
      setFeedback({
        answerId,
        type: "info",
        message: action === "verify" ? "You've already verified this answer" : "You've already marked this as outdated",
      })
      return
    }

    setActionLoading({ answerId, action })
    setFeedback(null)

    try {
      if (action === "ai_context") {
        const response = await fetch(`/api/posts/${answerId}/assess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: thread.id }),
        })
        const data = await response.json()
        if (response.ok && data.assessment) {
          setAiCooldowns((prev) => ({ ...prev, [answerId]: AI_COOLDOWN_SECONDS }))
          setFeedback({
            answerId,
            type: data.assessment.is_outdated ? "error" : "info",
            message: data.explanation || data.assessment.reasoning || "AI analysis complete",
          })
        } else {
          setFeedback({ answerId, type: "error", message: data.error || "AI assessment failed" })
        }
      } else {
        const response = await fetch(`/api/posts/${answerId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: thread.id, action }),
        })
        if (response.ok) {
          setUserVote(answerId, action)
          setUserVotes((prev) => ({ ...prev, [answerId]: action }))
          await fetchAnswers()
          setFeedback({
            answerId,
            type: "success",
            message: action === "verify" ? "Marked as still true!" : "Marked as outdated!",
          })
        }
      }
    } catch (error) {
      setFeedback({ answerId, type: "error", message: "Network error" })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="w-full border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1a] bg-[#050505]">
        <span className="text-[10px] uppercase tracking-wider text-[#666666] font-medium">Featured Question</span>
        <p className="text-[10px] text-[#444444] mt-1">This thread contains answers in different freshness states.</p>
      </div>

      {/* Question */}
      <div className="p-4 sm:p-5 border-b border-[#1a1a1a]">
        <Link href={`/questions/${thread.id}`} className="group">
          <h3 className="text-base sm:text-lg font-medium text-[#fafafa] group-hover:text-white transition-colors leading-snug">
            {thread.title}
          </h3>
        </Link>
        <p className="text-xs sm:text-sm text-[#666666] mt-2">{thread.body}</p>
        <span className="text-[10px] text-[#444444] mt-2 inline-block">
          {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Answers Section */}
      {loading ? (
        <div className="p-4 sm:p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-20 bg-[#1a1a1a] rounded mb-2" />
              <div className="h-12 bg-[#1a1a1a] rounded" />
            </div>
          ))}
        </div>
      ) : answers.length > 0 ? (
        <div className="divide-y divide-[#1a1a1a]">
          {answers.map((answer) => (
            <div key={answer.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <FreshnessBadge state={answer.state} iconOnly className="flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-[#999999] leading-relaxed flex-1 break-words">{answer.body}</p>
              </div>

              {/* Timestamp */}
              <p className="text-[10px] text-[#444444] pl-8">
                Confidence: {Math.round(answer.verificationScore * 100)}% · Last checked: {answer.timeAgo}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pl-8">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAction(answer.id, "ai_context")}
                  disabled={actionLoading !== null || (aiCooldowns[answer.id] || 0) > 0}
                  className="h-8 gap-1.5 text-purple-400 hover:text-purple-400 hover:bg-purple-400/10 px-3 rounded-full text-[11px] justify-start sm:justify-center"
                >
                  {actionLoading?.answerId === answer.id && actionLoading.action === "ai_context" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {(aiCooldowns[answer.id] || 0) > 0 ? `Wait ${aiCooldowns[answer.id]}s` : "AI Context"}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAction(answer.id, "verify")}
                  disabled={actionLoading !== null || userVotes[answer.id] === "verify"}
                  className={`h-8 gap-1.5 px-3 rounded-full text-[11px] justify-start sm:justify-center ${
                    userVotes[answer.id] === "verify"
                      ? "text-emerald-400/50 bg-emerald-400/5 cursor-not-allowed"
                      : "text-emerald-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                  }`}
                >
                  {actionLoading?.answerId === answer.id && actionLoading.action === "verify" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {userVotes[answer.id] === "verify" ? "Verified ✓" : "Still True"}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAction(answer.id, "report_outdated")}
                  disabled={actionLoading !== null || userVotes[answer.id] === "report_outdated"}
                  className={`h-8 gap-1.5 px-3 rounded-full text-[11px] justify-start sm:justify-center ${
                    userVotes[answer.id] === "report_outdated"
                      ? "text-red-400/50 bg-red-400/5 cursor-not-allowed"
                      : "text-red-400 hover:text-red-400 hover:bg-red-400/10"
                  }`}
                >
                  {actionLoading?.answerId === answer.id && actionLoading.action === "report_outdated" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {userVotes[answer.id] === "report_outdated" ? "Reported ✓" : "Outdated"}
                </Button>
              </div>

              {feedback?.answerId === answer.id && (
                <div
                  className={`text-xs p-3 rounded-lg ml-8 ${
                    feedback.type === "success"
                      ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"
                      : feedback.type === "error"
                        ? "text-red-400 bg-red-400/10 border border-red-400/20"
                        : "text-purple-400 bg-purple-400/10 border border-purple-400/20"
                  }`}
                >
                  <p className="break-words whitespace-pre-wrap leading-relaxed overflow-hidden">{feedback.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <p className="text-xs text-[#444444] text-center mb-3">No answers yet</p>
        </div>
      )}

      {/* Write Answer Link */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <Link href={`/questions/${thread.id}/answer`}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-9 text-xs text-[#666666] hover:text-[#fafafa] hover:bg-[#1a1a1a] rounded-full gap-2"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Write an Answer
          </Button>
        </Link>
      </div>

      {/* View Full Thread */}
      <Link
        href={`/questions/${thread.id}`}
        className="flex items-center justify-center gap-1 px-4 py-3 border-t border-[#1a1a1a] text-[10px] text-[#666666] hover:text-[#fafafa] hover:bg-[#0f0f0f] transition-colors"
      >
        View full thread
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
