# Still

**A forum where answers expire unless they're still true.**

---

## The Problem We're Solving

You're debugging at 2 AM. You find a Stack Overflow answer from 2019. It has 847 upvotes. You try it. It doesn't work.

Why? Because Next.js 9 and Next.js 15 are completely different frameworks. But that answer still sits there, collecting upvotes from people who don't realize it's outdated.

**Votes measure popularity, not accuracy. Time matters.**

Still is built on a simple idea: answers should prove they're still correct, or they fade away.

---

## How It Actually Works

### 1. You Ask a Question

When you post a question, our AI looks at it and thinks: "Is this about React hooks (changes every 6 months) or binary search (hasn't changed since 1946)?"

Based on that, it assigns a **freshness window**:
- Fast-changing tech (Next.js, React, APIs): **90 days**
- Stable concepts (algorithms, design patterns): **365 days**
- Opinions and best practices: **180 days**

If the AI isn't sure, we fall back to keyword detection. No AI? No problem. The system keeps working.

### 2. Someone Answers

New answers start in a "possibly outdated" state with 50% confidence. They haven't been verified by anyone yet, so we don't pretend they're trustworthy.

### 3. The Community Verifies

Anyone can click **"Still True"** or **"Outdated"**. Each click adjusts the confidence score:
- "Still True" boosts the score (with diminishing returns - spam clicking doesn't help)
- "Outdated" drops the score and counts as a report

Three "Outdated" reports? The answer is marked stale, no matter how many upvotes it has.

### 4. AI Provides Context

Not sure if an answer is still accurate? Hit **"AI Context"**. Our system:
- Checks the answer against known documentation patterns
- Looks for deprecated methods, outdated APIs, or old patterns
- Gives you a plain-English explanation of what might be wrong

The AI doesn't make the final call - you do. It just gives you context to decide.

### 5. Time Does Its Job

Even if nobody clicks anything, time passes. An answer that was "Verified" 100 days ago in a 90-day freshness window? It automatically becomes "Possibly Outdated."

No maintenance needed. The system enforces honesty by default.

---

## The Freshness States

| State | What It Means | Visual |
|-------|---------------|--------|
| **Verified** | Recently confirmed accurate | Green checkmark |
| **Possibly Outdated** | Needs review (time passed or new answer) | Yellow warning |
| **Outdated** | Confirmed stale by community or AI | Red X |

---

## What Makes This Different

**Traditional Forums:**
- Old answers accumulate votes forever
- No way to know if information is current
- Good new answers buried under popular old ones

**Still:**
- Answers must prove they're still valid
- Time automatically degrades trust
- Community + AI verification
- Fresh answers surface naturally

---

## Tech Stack

| What | Why |
|------|-----|
| Next.js 16 (App Router) | Fast, modern React with server components |
| Foru.ms API | Forum backend - threads, posts, users |
| Groq (Llama 3.3 70B) | Fast AI for classification and assessment |
| Tailwind CSS v4 | Clean, dark UI that stays out of your way |
| Vercel | Deployment and edge functions |

---

## Project Structure

```
still/
├── app/
│   ├── page.tsx                    # Home - featured question + recent threads
│   ├── questions/
│   │   ├── new/                    # Ask a new question
│   │   └── [id]/                   # Question detail + answers
│   │       └── answer/             # Submit an answer
│   └── api/
│       ├── threads/                # Create/list questions
│       └── posts/[postId]/
│           ├── verify/             # Community verification
│           └── assess/             # AI assessment
├── components/
│   ├── featured-question.tsx       # Homepage showcase
│   ├── freshness-badge.tsx         # State indicators
│   └── verification-actions.tsx    # Vote buttons + AI
├── lib/
│   ├── freshness/
│   │   ├── state-machine.ts        # Core decay logic
│   │   └── engine.ts               # Verification processing
│   ├── llm/
│   │   ├── classifier.ts           # Question categorization
│   │   └── verifier.ts             # Answer assessment
│   └── foru-ms/
│       └── client.ts               # Forum API wrapper
```

---

## Key Features

### Featured Question Algorithm
The homepage doesn't just show the latest question. It calculates engagement (answers + votes) and features the most active thread. Judges see real activity, not just the newest post.

### Vote Persistence
Your votes are saved locally. You can verify OR report an answer, but not spam either button. Switch your vote? Sure. Click the same thing 50 times? Nope.

### Rate-Limited AI
AI Context has a 30-second cooldown per answer. Prevents API abuse and makes users think before clicking.

### Graceful Degradation
- Groq down? Falls back to keyword classification
- API slow? Shows loading skeletons
- Network error? Clear error messages

---

## Running Locally

```bash
# Clone and install
git clone <repo>
cd still
npm install

# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env.local

# Run
npm run dev
```

---

## The Contract

We make specific promises about how Still behaves. See [CONTRACT.md](./CONTRACT.md) for the full specification.

**Core guarantees:**
1. Answers WILL decay if not verified
2. Three "Outdated" reports WILL mark any answer stale
3. AI assists but NEVER auto-modifies
4. The system works WITHOUT AI (heuristic fallback)

---

## Built For

Developers dealing with fast-changing tech who are tired of finding outdated answers with high upvotes.

---

## Credits

Built for the Foru.ms Hackathon.

- **Foru.ms** - Forum infrastructure
- **Groq** - Fast LLM inference
- **Vercel** - Deployment
- **shadcn/ui** - UI components
