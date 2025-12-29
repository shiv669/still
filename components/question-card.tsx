import Link from "next/link"
import type { ForumsThread } from "@/lib/foru-ms/client"
import { formatDistanceToNow } from "date-fns"
import { Clock, Zap, BookOpen } from "lucide-react"

interface QuestionCardProps {
  thread: ForumsThread
}

export function QuestionCard({ thread }: QuestionCardProps) {
  const questionType = thread.extendedData?.question_type || "stable-concept"
  const freshnessWindow = thread.extendedData?.freshness_window_days || 365

  const getTypeIcon = () => {
    switch (questionType) {
      case "fast-changing-tech":
        return <Zap className="h-3 w-3 text-yellow-400" />
      case "version-specific":
        return <Clock className="h-3 w-3 text-blue-400" />
      default:
        return <BookOpen className="h-3 w-3 text-emerald-400" />
    }
  }

  return (
    <Link href={`/questions/${thread.id}`}>
      <article className="group relative overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6 transition-all hover:border-[#2a2a2a] hover:bg-[#0f0f0f]">
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-medium text-[#fafafa] group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {thread.title}
          </h2>
          <p className="line-clamp-2 text-xs sm:text-sm text-[#666666] leading-relaxed">{thread.body}</p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#666666]">
            <span className="flex items-center gap-1">
              {getTypeIcon()}
              <span className="capitalize hidden sm:inline">{questionType.replace(/-/g, " ")}</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span>{freshnessWindow}d freshness</span>
            <span className="hidden sm:inline">·</span>
            <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
