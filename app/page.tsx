"use client"

import { useState, useEffect } from "react"
import { StillHero } from "@/components/still-hero"
import { StillHeader } from "@/components/still-header"
import { QuestionCard } from "@/components/question-card"
import { AlertCircle, Clock } from "lucide-react"
import type { ForumsThread } from "@/lib/foru-ms/client"

const MAX_QUESTIONS = 7

interface ThreadWithEngagement extends ForumsThread {
  answerCount?: number
}

export default function HomePage() {
  const [threads, setThreads] = useState<ThreadWithEngagement[]>([])
  const [featuredThread, setFeaturedThread] = useState<ThreadWithEngagement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchThreads() {
      try {
        const res = await fetch("/api/threads?limit=20", {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        const allThreads: ThreadWithEngagement[] = data.threads || []

        if (allThreads.length > 0) {
          const topCandidates = allThreads.slice(0, 5)

          const threadEngagement = await Promise.all(
            topCandidates.map(async (thread) => {
              try {
                const postsRes = await fetch(`/api/threads/${thread.id}/posts`)
                const postsData = await postsRes.json()
                const posts = postsData.posts || []

                let engagementScore = posts.length
                posts.forEach((post: any) => {
                  const freshness = post.extendedData?.freshness
                  if (freshness) {
                    engagementScore += freshness.verification_count || 0
                    engagementScore += freshness.outdated_reports || 0
                  }
                })

                return { ...thread, answerCount: posts.length, engagementScore }
              } catch {
                return { ...thread, answerCount: 0, engagementScore: 0 }
              }
            }),
          )

          const sortedByEngagement = [...threadEngagement].sort(
            (a, b) => (b.engagementScore || 0) - (a.engagementScore || 0),
          )

          const bestFeatured = sortedByEngagement.find((t) => (t.answerCount || 0) >= 1)

          if (bestFeatured) {
            setFeaturedThread(bestFeatured)
            setThreads(allThreads.filter((t) => t.id !== bestFeatured.id))
          } else {
            setFeaturedThread(allThreads[0])
            setThreads(allThreads.slice(1))
          }
        } else {
          setThreads([])
          setFeaturedThread(null)
        }
      } catch (err: any) {
        setError(err.message || "Failed to load questions")
      } finally {
        setLoading(false)
      }
    }
    fetchThreads()
  }, [])

  const recentQuestions = threads.slice(0, MAX_QUESTIONS)

  return (
    <div className="min-h-screen flex flex-col bg-[#030303]">
      <StillHeader />
      <StillHero featuredThread={featuredThread} isLoading={loading} />

      {/* Questions Section */}
      <main id="questions" className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[#fafafa]">Recent Questions</h2>
          <span className="text-xs text-[#666666]">
            {recentQuestions.length} of {MAX_QUESTIONS} shown
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">Unable to connect to the server.</p>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {loading ? (
            // Loading skeleton
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 animate-pulse">
                  <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-1/4" />
                </div>
              ))}
            </>
          ) : recentQuestions.length === 0 ? (
            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
              <Clock className="h-10 w-10 text-[#2a2a2a] mx-auto mb-4" />
              <p className="text-sm text-[#666666]">
                {error ? "Questions will appear here once connected." : "No questions yet. Ask the first one above!"}
              </p>
            </div>
          ) : (
            recentQuestions.map((thread) => <QuestionCard key={thread.id} thread={thread} />)
          )}
        </div>
      </main>

      <footer className="border-t border-[#1a1a1a] py-6 bg-[#030303]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <p className="text-xs text-[#666666]">Built for developers dealing with fast-changing tech.</p>
        </div>
      </footer>
    </div>
  )
}
