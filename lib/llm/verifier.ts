import type { ForumsPost, ForumsThread } from "../foru-ms/client"

export interface VerificationAssessment {
  confidence_delta: number
  reasoning: string
  potential_issues: string[]
  is_outdated: boolean
  sources_checked?: string[]
}

async function callGroqAPI(prompt: string, maxTokens = 700): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY not configured")

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // This is a current production model. It can be overridden without a code change.
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(12000),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}

async function searchWeb(query: string): Promise<string[]> {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "still-verifier/1.0 (+https://still.app)" },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error(`Search provider returned ${response.status}`)

    const html = await response.text()
    const results: string[] = []
    const resultPattern = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    for (const match of html.matchAll(resultPattern)) {
      const clean = (value: string) => value.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim()
      const title = clean(match[2])
      const snippet = clean(match[3])
      if (title && snippet) results.push(`${title} — ${snippet} (${match[1]})`)
      if (results.length === 5) break
    }
    return results
  } catch (error) {
    console.log("[v0] Live web search failed:", error)
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

Return exactly one complete JSON object with these keys only. Do not use markdown, code fences, or extra text. Keep reasoning under 240 characters and include no more than 3 short issues. Finish the object before stopping:
{
  "is_outdated": true,
  "confidence_delta": 0,
  "reasoning": "brief explanation with the key technical detail",
  "potential_issues": ["short issue"]
}`

    const text = await callGroqAPI(prompt, 1400)

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
