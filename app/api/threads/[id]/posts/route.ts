import { type NextRequest, NextResponse } from "next/server"
import { forumsClient, getOrCreateUser } from "@/lib/foru-ms/client"
import { getDefaultFreshnessMetadata } from "@/lib/freshness/state-machine"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: threadId } = await params
    console.log("[v0] Getting posts for thread:", threadId)

    const response = await forumsClient.threads.getPosts(threadId)

    return NextResponse.json({ posts: response.posts })
  } catch (error) {
    console.error("[v0] Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts", posts: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: threadId } = await params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const authorId = await getOrCreateUser("Answer Author")

    const thread = await forumsClient.threads.retrieve(threadId)
    const questionType = thread.extendedData?.question_type || "stable-concept"

    const metadata = getDefaultFreshnessMetadata(questionType)

    const post = await forumsClient.posts.create({
      threadId,
      body: content,
      userId: authorId,
      extendedData: metadata,
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
