import { type NextRequest, NextResponse } from "next/server"
import { forumsClient, getOrCreateUser } from "@/lib/foru-ms/client"
import { QuestionClassifier } from "@/lib/llm/classifier"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")

    console.log(`[v0] GET /api/threads - limit: ${limit}, page: ${page}`)

    const result = await forumsClient.threads.list({ limit, page })

    console.log(`[v0] Returning ${result.threads.length} threads`)

    return NextResponse.json(result)
  } catch (error: unknown) {
    const err = error as Error
    console.error("[v0] Error listing threads:", err.message)
    return NextResponse.json({ threads: [], count: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content } = body

    console.log(`[v0] POST /api/threads - title: "${title?.substring(0, 30)}..."`)

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Classify the question (with fallback)
    let classification
    try {
      console.log(`[v0] Classifying question...`)
      classification = await QuestionClassifier.classify(title, content)
      console.log(`[v0] Classification result:`, classification)
    } catch (classifyError: unknown) {
      const err = classifyError as Error
      console.error(`[v0] Classification failed:`, err.message)
      classification = {
        question_type: "stable-concept",
        freshness_window_days: 365,
        confidence: 0.5,
        reasoning: "Using default classification",
      }
    }

    const metadata = QuestionClassifier.toThreadMetadata(classification)
    console.log(`[v0] Thread metadata:`, metadata)

    // Get or create user first
    console.log(`[v0] Getting/creating user...`)
    const userId = await getOrCreateUser("Question Author")
    console.log(`[v0] User ID: ${userId}`)

    // Create the thread
    console.log(`[v0] Creating thread...`)
    const thread = await forumsClient.threads.create({
      title,
      body: content,
      userId,
      extendedData: metadata,
    })

    console.log(`[v0] Thread created successfully: ${thread.id}`)

    return NextResponse.json({ thread, classification }, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error
    console.error("[v0] Error creating thread:", err.message)
    console.error("[v0] Full error:", error)
    return NextResponse.json(
      { error: err.message || "Failed to create thread", details: String(error) },
      { status: 500 },
    )
  }
}
