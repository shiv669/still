import type { ThreadMetadata } from "../foru-ms/types"
import { FRESHNESS_WINDOWS } from "../freshness/types"

export interface ClassificationResult {
  question_type: "fast-changing-tech" | "stable-concept" | "opinion" | "policy"
  freshness_window_days: number
  confidence: number
  reasoning: string
}

async function callGroqAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured")
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

export class QuestionClassifier {
  /**
   * Classify a question using LLM (completely optional)
   * Falls back to heuristic classification if LLM fails
   */
  static async classify(title: string, content: string): Promise<ClassificationResult> {
    try {
      console.log("[v0] Attempting LLM classification with Groq...")
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("LLM timeout")), 8000))

      const classifyPromise = this.classifyWithLLM(title, content)

      const result = await Promise.race([classifyPromise, timeoutPromise])
      console.log("[v0] LLM classification succeeded:", result.question_type)
      return result
    } catch (error: any) {
      console.log("[v0] LLM classification failed, using heuristics:", error.message)
      return this.classifyHeuristic(title, content)
    }
  }

  private static classifyHeuristic(title: string, content: string): ClassificationResult {
    const combined = `${title} ${content}`.toLowerCase()

    // Fast-changing tech keywords
    const techKeywords = [
      "react",
      "next.js",
      "nextjs",
      "api",
      "framework",
      "library",
      "deployment",
      "version",
      "update",
      "latest",
      "new",
      "typescript",
      "javascript",
      "css",
      "tailwind",
    ]

    // Stable concept keywords
    const stableKeywords = [
      "algorithm",
      "data structure",
      "theory",
      "concept",
      "principle",
      "pattern",
      "architecture",
      "design",
    ]

    // Opinion keywords
    const opinionKeywords = ["best", "better", "should i", "recommend", "prefer", "favorite", "vs", "or"]

    // Count matches
    const techScore = techKeywords.filter((kw) => combined.includes(kw)).length
    const stableScore = stableKeywords.filter((kw) => combined.includes(kw)).length
    const opinionScore = opinionKeywords.filter((kw) => combined.includes(kw)).length

    // Determine category based on scores
    let questionType: ClassificationResult["question_type"] = "stable-concept"
    let confidence = 0.6

    if (techScore > stableScore && techScore > opinionScore) {
      questionType = "fast-changing-tech"
      confidence = 0.7
    } else if (opinionScore > techScore && opinionScore > stableScore) {
      questionType = "opinion"
      confidence = 0.65
    } else if (stableScore > 0) {
      questionType = "stable-concept"
      confidence = 0.7
    } else {
      // Default to fast-changing-tech for tech forum
      questionType = "fast-changing-tech"
      confidence = 0.5
    }

    return {
      question_type: questionType,
      freshness_window_days: FRESHNESS_WINDOWS[questionType],
      confidence,
      reasoning: "Classified using keyword heuristics",
    }
  }

  private static async classifyWithLLM(title: string, content: string): Promise<ClassificationResult> {
    console.log("[v0] Calling Groq API directly for classification...")

    const prompt = `You are a question classifier for a truth-verification forum system. Analyze this question and classify it into one of these categories:

1. **fast-changing-tech**: Questions about rapidly evolving technology, frameworks, APIs, or best practices
2. **stable-concept**: Questions about fundamental concepts, algorithms, or principles that don't change often
3. **opinion**: Questions asking for subjective opinions or preferences
4. **policy**: Questions about rules, regulations, or organizational policies

Question Title: ${title}

Question Content: ${content}

Respond in JSON format:
{
  "question_type": "one of the four categories",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`

    const text = await callGroqAPI(prompt)

    console.log("[v0] Groq API response received")

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse LLM response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    const questionType = this.validateQuestionType(parsed.question_type)
    const freshnessWindow = FRESHNESS_WINDOWS[questionType]

    return {
      question_type: questionType,
      freshness_window_days: freshnessWindow,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.8)),
      reasoning: parsed.reasoning || "Classification based on content analysis",
    }
  }

  private static validateQuestionType(type: string): ClassificationResult["question_type"] {
    const validTypes: ClassificationResult["question_type"][] = [
      "fast-changing-tech",
      "stable-concept",
      "opinion",
      "policy",
    ]

    if (validTypes.includes(type as any)) {
      return type as ClassificationResult["question_type"]
    }

    return "stable-concept" // Safe fallback
  }

  /**
   * Convert classification to thread metadata
   */
  static toThreadMetadata(classification: ClassificationResult): ThreadMetadata {
    return {
      question_type: classification.question_type,
      freshness_window_days: classification.freshness_window_days,
      classification_confidence: classification.confidence,
      classification_reason: classification.reasoning,
    }
  }
}
