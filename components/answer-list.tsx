import type { ForumPost } from "@/lib/foru-ms/types"
import { FreshnessBadge } from "./freshness-badge"
import { VerificationActions } from "./verification-actions"
import { FreshnessTimeline } from "./freshness-timeline"
import { formatDistanceToNow } from "date-fns"
import { calculateFreshnessState } from "@/lib/freshness/state-machine"
import { Clock } from "lucide-react"

interface AnswerListProps {
  posts: ForumPost[]
  threadId: string
  questionType: string
}

export function AnswerList({ posts, threadId, questionType }: AnswerListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-8 sm:p-12 text-center">
        <Clock className="h-10 w-10 text-[#2a2a2a] mx-auto mb-4" />
        <p className="text-sm sm:text-base text-[#666666]">No answers yet. Be the first to answer!</p>
      </div>
    )
  }

  const sortedPosts = [...posts].sort((a, b) => {
    const aScore = a.extendedData?.freshness?.verification_score || 0
    const bScore = b.extendedData?.freshness?.verification_score || 0
    return bScore - aScore
  })

  return (
    <div className="space-y-4">
      {sortedPosts.map((post) => (
        <AnswerCard key={post.id} post={post} threadId={threadId} />
      ))}
    </div>
  )
}

function AnswerCard({ post, threadId }: { post: ForumPost; threadId: string }) {
  const freshnessData = post.extendedData?.freshness
  const state = freshnessData ? calculateFreshnessState({ freshness: freshnessData }) : "VERIFIED"

  return (
    <article className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6 space-y-4">
      {/* Answer Content */}
      <div className="prose prose-invert max-w-none">
        <p className="text-sm sm:text-base text-[#e5e5e5] leading-relaxed whitespace-pre-wrap">{post.body}</p>
      </div>

      {/* Freshness Timeline */}
      {freshnessData && (
        <FreshnessTimeline
          createdAt={new Date(freshnessData.created_at)}
          lastVerifiedAt={new Date(freshnessData.last_verified_at)}
          freshnessWindowDays={freshnessData.freshness_window_days}
          state={state}
        />
      )}

      {/* Answer Metadata & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#1a1a1a]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <FreshnessBadge state={state} />
          {freshnessData && (
            <span className="text-xs text-[#666666]">
              Score: {(freshnessData.verification_score * 100).toFixed(0)}%
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-xs text-[#666666]">
            Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
          <VerificationActions postId={post.id} threadId={threadId} currentState={state} />
        </div>
      </div>
    </article>
  )
}
