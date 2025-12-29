# Still - How It's Built

This document explains the technical decisions behind Still. Not marketing - just how things actually work and why.

---

## The Core Idea

Every answer has metadata that tracks its freshness. This metadata lives in Foru.ms's `extendedData` field, so we don't need a separate database.

\`\`\`typescript
interface FreshnessMetadata {
  created_at: string           // When the answer was posted
  last_verified_at: string     // Last time someone clicked "Still True"
  freshness_window_days: number // How long before it needs reverification
  state: "VERIFIED" | "POSSIBLY_OUTDATED" | "OUTDATED"
  verification_score: number   // 0.0 to 1.0 confidence
  verification_count: number   // Total verifications received
  outdated_reports: number     // Times marked as outdated
}
\`\`\`

The state is always recalculated from this data. We never trust a stored state - we compute it fresh every time.

---

## State Machine

The freshness state is deterministic. Given the metadata and current time, the state is always the same:

\`\`\`
                    ┌─────────────┐
                    │  VERIFIED   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    Time passes     Score < 0.3      3+ reports
         │                 │                 │
         ▼                 │                 │
┌─────────────────┐        │                 │
│ POSSIBLY_OUTDATED│       │                 │
└────────┬────────┘        │                 │
         │                 │                 │
         └─────────────────┴─────────────────┘
                           │
                           ▼
                    ┌───────────┐
                    │  OUTDATED │
                    └───────────┘
\`\`\`

**Rules in order of precedence:**

1. **Community override**: 3+ outdated reports → OUTDATED (no exceptions)
2. **Low confidence**: Score below 0.3 → OUTDATED
3. **No votes yet**: Zero verifications AND zero reports → POSSIBLY_OUTDATED
4. **Time decay**: Past 1.5x window → OUTDATED, past 1x window → POSSIBLY_OUTDATED
5. **Default**: VERIFIED

The order matters. Community reports trump everything else. A perfectly timed answer with a high score still goes OUTDATED if three people report it.

---

## Verification Processing

When someone clicks "Still True" or "Outdated":

### "Still True" (verify)
\`\`\`typescript
// Diminishing returns formula
boost = 0.1 * (1 / sqrt(verification_count + 1))

// First verification: +0.1
// Second: +0.07
// Third: +0.058
// ...keeps getting smaller

score = min(1.0, score + boost)
last_verified_at = now
outdated_reports = max(0, outdated_reports - 1)  // Heals one report
\`\`\`

### "Outdated" (report)
\`\`\`typescript
penalty = 0.15
score = max(0, score - penalty)
outdated_reports++
\`\`\`

The diminishing returns are intentional. One person verifying an answer 50 times shouldn't make it immortal. But multiple different people verifying? That's signal.

---

## Question Classification

When a question is posted, we try to figure out what category it is:

### LLM Path (Groq)
\`\`\`typescript
const prompt = `Classify this question:
- fast-changing-tech (90 days): Framework APIs, library versions
- stable-concept (365 days): Algorithms, design patterns
- opinion (180 days): Best practices, recommendations
- policy (180 days): Rules, guidelines`
\`\`\`

We use Groq's Llama 3.3 70B because it's fast (~500ms) and good enough for classification.

### Heuristic Fallback
If Groq fails (timeout, rate limit, down), we fall back to keyword matching:

\`\`\`typescript
const techKeywords = ["react", "nextjs", "api", "version", "update"]
const stableKeywords = ["algorithm", "pattern", "theory", "concept"]
const opinionKeywords = ["best", "should", "recommend", "vs"]

// Count matches, pick highest
\`\`\`

Not perfect, but better than nothing. The system keeps working without AI.

---

## AI Assessment (AI Context Button)

When you click "AI Context", here's what happens:

1. **Gather context**: We build a list of relevant documentation sources based on keywords
2. **Build prompt**: Question + Answer + Time since posted + Documentation hints
3. **Call Groq**: Ask if the answer is still accurate
4. **Parse response**: Extract is_outdated, confidence_delta, reasoning, potential_issues

\`\`\`typescript
const assessment = {
  is_outdated: boolean,        // AI's verdict
  confidence_delta: -1 to +1,  // How much to adjust score
  reasoning: string,           // Plain English explanation
  potential_issues: string[]   // Specific problems found
}
\`\`\`

Important: The AI assessment is shown to the user but doesn't automatically change anything. The user decides whether to verify or report based on the AI's analysis.

---

## Vote Persistence

We track votes in localStorage:

\`\`\`typescript
// Key: "still_votes"
// Value: { [postId]: "verify" | "report_outdated" }

function getUserVote(postId: string): "verify" | "report_outdated" | null {
  const votes = JSON.parse(localStorage.getItem("still_votes") || "{}")
  return votes[postId] || null
}
\`\`\`

This prevents:
- Spam clicking the same button
- Voting both ways on the same answer
- Losing your vote on page reload

You CAN switch your vote (verify → outdated or vice versa), but you can't vote the same way twice.

---

## Featured Question Algorithm

The homepage doesn't just show the latest question. It picks the most engaging one:

\`\`\`typescript
// Fetch answers for top 5 most recent threads
const candidates = threads.slice(0, 5)

for (const thread of candidates) {
  const posts = await fetchPosts(thread.id)
  
  // Calculate engagement
  const answerCount = posts.length
  const totalVotes = posts.reduce((sum, post) => {
    const meta = post.extendedData?.freshness
    return sum + (meta?.verification_count || 0) + (meta?.outdated_reports || 0)
  }, 0)
  
  thread.engagement = answerCount * 2 + totalVotes
}

// Feature the highest engagement thread that has at least 1 answer
const featured = candidates
  .filter(t => t.answerCount > 0)
  .sort((a, b) => b.engagement - a.engagement)[0]
\`\`\`

This ensures judges see a thread with actual activity, not just an empty question.

---

## API Routes

### POST /api/threads
Create a question. Runs classification, stores metadata.

### POST /api/threads/[id]/posts
Create an answer. Initializes freshness metadata with POSSIBLY_OUTDATED state and 0.5 score.

### POST /api/posts/[postId]/verify
Process a verification action. Updates metadata, recalculates state.

### POST /api/posts/[postId]/assess
Run AI assessment. Returns analysis without modifying anything.

### GET /api/threads/[id]/posts
List answers for a question. Used by featured question component.

---

## Error Handling Philosophy

Every component has a fallback:

| Component | Primary | Fallback |
|-----------|---------|----------|
| Classification | Groq LLM | Keyword heuristics |
| Assessment | Groq LLM | Neutral response ("Unable to assess") |
| Post Update | Foru.ms API | Return success anyway (data in memory) |
| User Auth | Foru.ms login | Create anonymous user |

The app never shows a blank screen. Something always renders.

---

## Rate Limiting

### AI Context Button
30-second cooldown per answer. Stored in component state, resets on page reload. Prevents API abuse.

### Vote Buttons
One vote per answer per type, persisted in localStorage. No cooldown needed since you can't repeat votes.

---

## Performance Decisions

### Why Client-Side Data Fetching?
The home page fetches threads client-side with useEffect. This means:
- Page shell renders instantly
- Data streams in with skeleton loading states
- No server-side blocking on slow Foru.ms API

### Why Only Check Top 5 for Featured?
Checking engagement for all 20+ threads would make 20+ API calls. We limit to 5 because:
- Most engagement happens on recent threads anyway
- 5 parallel calls is acceptable (~1s total)
- Good enough for hackathon demo

### Why No Server Components for Lists?
Server components would block rendering until Foru.ms responds. Client components with loading states give better perceived performance.

---

## What We'd Do Differently in Production

1. **Real authentication** - Currently using auto-generated anonymous users
2. **Redis cache** - In-memory cache doesn't survive deployments
3. **WebSocket updates** - Real-time verification count changes
4. **Rate limiting middleware** - Server-side protection
5. **Proper error tracking** - Sentry or similar
6. **Analytics** - Track verification patterns, decay rates

---

## File-by-File Breakdown

### Core Logic
- `lib/freshness/state-machine.ts` - The 50 lines that decide everything
- `lib/freshness/engine.ts` - Processes verifications, updates scores
- `lib/llm/classifier.ts` - Question categorization (LLM + fallback)
- `lib/llm/verifier.ts` - AI assessment with web context

### API Layer
- `app/api/threads/route.ts` - List and create questions
- `app/api/posts/[postId]/verify/route.ts` - Handle votes
- `app/api/posts/[postId]/assess/route.ts` - AI analysis

### UI Components
- `components/featured-question.tsx` - Homepage showcase with inline voting
- `components/freshness-badge.tsx` - Visual state indicators
- `components/verification-actions.tsx` - Reusable vote buttons

### Pages
- `app/page.tsx` - Home with featured question + recent list
- `app/questions/[id]/page.tsx` - Question detail with all answers
- `app/questions/new/page.tsx` - Ask a question form
- `app/questions/[id]/answer/page.tsx` - Submit an answer form

---

## The Honest Truth

This is a hackathon project. It demonstrates a concept, not production infrastructure.

What works well:
- The core decay logic is solid
- AI integration is graceful (fails safely)
- UI is clean and responsive
- Vote tracking prevents abuse

What's hacky:
- Foru.ms API credentials are in the code
- No real user accounts
- localStorage for vote tracking
- In-memory caching only

But the core idea - **answers that expire unless verified** - is proven by the implementation. Everything else is engineering work.
