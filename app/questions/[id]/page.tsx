import Link from "next/link"
import { Button } from "@/components/ui/button"
import { forumsClient } from "@/lib/foru-ms/client"
import { formatDistanceToNow } from "date-fns"
import { AnswerList } from "@/components/answer-list"
import { StillHeader } from "@/components/still-header"
import { ArrowLeft, Clock, Zap, BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateStaticParams() {
  return []
}

async function getThreadWithPosts(threadId: string) {
  if (threadId === "new" || threadId === "answer") {
    return null
  }

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 10000))

    const dataPromise = Promise.all([
      forumsClient.threads.retrieve(threadId),
      forumsClient.threads.getPosts(threadId, {}),
    ])

    const [thread, postsData] = (await Promise.race([dataPromise, timeoutPromise])) as any
    return { thread, posts: postsData.posts || [] }
  } catch (error) {
    console.error("[v0] Failed to fetch thread:", error)
    return null
  }
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#030303]">
      <StillHeader />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 px-4">
          <Clock className="h-12 w-12 text-[#2a2a2a] mx-auto" />
          <h1 className="text-xl sm:text-2xl font-semibold text-[#fafafa]">Question Not Found</h1>
          <p className="text-sm text-[#666666]">This question doesn&apos;t exist or has been removed.</p>
          <Link href="/">
            <Button className="rounded-full bg-[#fafafa] text-[#030303] hover:bg-[#e5e5e5]">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "new") {
    const { default: NewQuestionPage } = await import("../new/page")
    return <NewQuestionPage />
  }

  const data = await getThreadWithPosts(id)

  if (!data) {
    return <NotFoundPage />
  }

  const { thread, posts } = data
  const questionType = thread.extendedData?.question_type || "stable-concept"
  const freshnessWindow = thread.extendedData?.freshness_window_days || 365

  const getTypeIcon = () => {
    switch (questionType) {
      case "fast-changing-tech":
        return <Zap className="h-3.5 w-3.5 text-yellow-400" />
      case "version-specific":
        return <Clock className="h-3.5 w-3.5 text-blue-400" />
      default:
        return <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
    }
  }

  return (
    <div className="min-h-screen bg-[#030303]">
      <StillHeader />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#666666] hover:text-[#fafafa] transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to questions
        </Link>

        {/* Question Header */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#fafafa] leading-tight">{thread.title}</h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#666666]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2a2a2a] bg-[#0a0a0a]">
              {getTypeIcon()}
              <span className="capitalize">{questionType.replace(/-/g, " ")}</span>
            </span>
            <span>{freshnessWindow}d freshness window</span>
            <span>·</span>
            <span>Asked {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
          </div>

          <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6">
            <p className="text-sm sm:text-base text-[#a1a1a1] leading-relaxed whitespace-pre-wrap">{thread.body}</p>
          </div>
        </div>

        {/* Answers Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#1a1a1a]">
            <h2 className="text-lg sm:text-xl font-semibold text-[#fafafa]">
              {posts.length} {posts.length === 1 ? "Answer" : "Answers"}
            </h2>
            <Link href={`/questions/${thread.id}/answer`}>
              <Button className="w-full sm:w-auto rounded-full bg-[#fafafa] text-[#030303] hover:bg-[#e5e5e5]">
                Write Answer
              </Button>
            </Link>
          </div>

          <AnswerList posts={posts} threadId={thread.id} questionType={questionType} />
        </div>
      </main>
    </div>
  )
}
