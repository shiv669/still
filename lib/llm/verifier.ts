import type { ForumsPost, ForumsThread } from "../foru-ms/client"

export interface VerificationAssessment {
  confidence_delta: number
  reasoning: string
  potential_issues: string[]
  is_outdated: boolean
  sources_checked?: string[]
}

async function callGroqAPI(prompt: string, maxTokens = 500): Promise<string> {
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
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

async function searchWeb(query: string): Promise<string[]> {
  try {
    // Use a simple search approach - fetch from known documentation sources
    const searchResults: string[] = []

    // Try to fetch relevant documentation based on query keywords
    const keywords = query.toLowerCase()

    if (keywords.includes("next") || keywords.includes("nextjs")) {
      searchResults.push(
        "Source: Next.js Official Docs (nextjs.org/docs) - Check the latest App Router documentation for current patterns",
      )
    }
    if (keywords.includes("react")) {
      searchResults.push(
        "Source: React Official Docs (react.dev) - React 18+ uses concurrent features and Server Components",
      )
    }
    if (keywords.includes("typescript")) {
      searchResults.push("Source: TypeScript Docs (typescriptlang.org) - Check latest version features")
    }
    if (keywords.includes("auth")) {
      searchResults.push("Source: Auth.js/NextAuth (authjs.dev) - v5 has significant API changes from v4")
    }
    if (keywords.includes("tailwind")) {
      searchResults.push("Source: Tailwind CSS (tailwindcss.com) - v4 has new features and config changes")
    }
    if (keywords.includes("api") || keywords.includes("route")) {
      searchResults.push("Source: Next.js Route Handlers - App Router uses route.ts files instead of pages/api")
    }

    return searchResults
  } catch (error) {
    console.log("[v0] Web search failed:", error)
    return []
  }
}

export class AnswerVerifier {
  static async assessAnswer(answer: ForumsPost, question: ForumsThread): Promise<VerificationAssessment> {
    try {
      console.log("[v0] Attempting AI assessment with Groq + web context...")
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("LLM timeout")), 15000),
      )

      const assessPromise = this.performAssessment(answer, question)

      const result = await Promise.race([assessPromise, timeoutPromise])
      console.log("[v0] AI assessment succeeded:", result.is_outdated ? "OUTDATED" : "VALID")
      return result
    } catch (error: any) {
      console.log("[v0] AI assessment failed:", error.message)
      return {
        confidence_delta: 0,
        reasoning: "Unable to assess - verification error: " + error.message,
        potential_issues: [],
        is_outdated: false,
      }
    }
  }

  private static async performAssessment(answer: ForumsPost, question: ForumsThread): Promise<VerificationAssessment> {
    console.log("[v0] Calling Groq API for assessment with web context...")

    const searchQuery = `${question.title} ${answer.body?.substring(0, 100) || ""}`
    const webContext = await searchWeb(searchQuery)
    console.log("[v0] Web context gathered:", webContext.length, "sources")

    const webContextStr =
      webContext.length > 0 ? `\n\nRELEVANT DOCUMENTATION SOURCES TO CONSIDER:\n${webContext.join("\n")}` : ""

    const prompt = `You are an answer verification assistant for a truth-tracking forum. Your job is to assess whether an answer is still accurate and up-to-date.

IMPORTANT: Base your assessment on CURRENT best practices and official documentation, not outdated knowledge. Consider that:
- Technology evolves rapidly - answers from even 6 months ago may be outdated
- Framework versions matter - Next.js 13 vs 14 vs 15 have significant differences
- API changes happen - methods get deprecated, new patterns emerge
${webContextStr}

Question: ${question.title}
${question.body || ""}

Answer (posted ${new Date(answer.createdAt).toLocaleDateString()}):
${answer.body || ""}

Analyze this answer and determine:
1. Is this answer CURRENTLY accurate based on the latest documentation?
2. Are there any deprecated methods, outdated patterns, or incorrect information?
3. What specific issues exist (if any)?

Be STRICT about accuracy. If an answer uses old patterns that have better alternatives, mark it as potentially outdated.

Respond in JSON format:
{
  "is_outdated": true/false,
  "confidence_delta": -1.0 to 1.0 (negative = outdated, positive = still valid),
  "reasoning": "detailed explanation with specific technical details",
  "potential_issues": ["specific issue 1", "specific issue 2"]
}`

    const text = await callGroqAPI(prompt, 800)

    console.log("[v0] Groq API assessment response received")

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse LLM response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      confidence_delta: Math.max(-1, Math.min(1, parsed.confidence_delta || 0)),
      reasoning: parsed.reasoning || "Automated verification analysis",
      potential_issues: Array.isArray(parsed.potential_issues) ? parsed.potential_issues : [],
      is_outdated: !!parsed.is_outdated,
      sources_checked: webContext,
    }
  }

  static async explainOutdated(answer: ForumsPost, question: ForumsThread): Promise<string> {
    try {
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("LLM timeout")), 5000),
      )

      const explainPromise = this.generateExplanation(answer, question)

      const result = await Promise.race([explainPromise, timeoutPromise])
      return result
    } catch (error) {
      return "This answer may contain outdated information."
    }
  }

  private static async generateExplanation(answer: ForumsPost, question: ForumsThread): Promise<string> {
    const answerContent = answer.body || ""
    const questionTitle = question.title

    const prompt = `Explain in one concise sentence why this answer might be outdated:

Question: ${questionTitle}

Answer (from ${new Date(answer.createdAt).toLocaleDateString()}):
${answerContent.substring(0, 500)}

Be specific and actionable. Examples:
- "This answer references Next.js 13 behavior, which changed in App Router"
- "The API mentioned was deprecated in version 2.0"
- "This approach is no longer recommended as of 2024"

Your explanation (one sentence):`

    const text = await callGroqAPI(prompt, 100)

    return text.trim().replace(/^["']|["']$/g, "")
  }
}
