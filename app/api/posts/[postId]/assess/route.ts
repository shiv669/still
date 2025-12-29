import { type NextRequest, NextResponse } from "next/server"
import { forumsClient } from "@/lib/foru-ms/client"
import { AnswerVerifier } from "@/lib/llm/verifier"

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params
    const body = await request.json()
    const { threadId } = body

    if (!threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }

    const [post, thread] = await Promise.all([
      forumsClient.posts.retrieve(postId),
      forumsClient.threads.retrieve(threadId),
    ])

    // Use LLM to assess the answer
    const assessment = await AnswerVerifier.assessAnswer(post, thread)

    // Generate explanation if outdated
    let explanation = null
    if (assessment.is_outdated) {
      explanation = await AnswerVerifier.explainOutdated(post, thread)
    }

    return NextResponse.json({
      assessment,
      explanation,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error("[v0] Error assessing answer:", err.message)
    return NextResponse.json({ error: "Failed to assess answer" }, { status: 500 })
  }
}
