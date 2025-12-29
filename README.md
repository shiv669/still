# Still

**A forum where answers expire unless they’re still true.**

---

## The Problem

You search for a solution.
You find an answer with hundreds of upvotes.
It was written years ago.
It no longer works.

Traditional forums reward popularity forever.  
They have no concept of time.

**Votes don’t measure accuracy. Time matters.**

---

## What Still Does

Still treats **time as a first-class signal**.

Answers are not trusted by default.
They must be **re-verified** by people, or they slowly decay.

If nobody confirms an answer is still correct, the system assumes it may no longer be reliable.

---

## Quick Demo (30 seconds)

1. Open the app  
2. Click the **featured question**
3. Notice answers in different freshness states
4. Click **AI Context** to see why an answer may be outdated
5. Click **Still True** or **Outdated** and watch the state update

You understand the product without reading documentation.

---

## How It Works (Simple)

1. **Questions get a freshness window**  
   Fast-changing topics decay faster than stable concepts.

2. **Answers decay by default**  
   If time passes without verification, trust decreases automatically.

3. **People verify, AI explains**  
   The community confirms or flags answers.  
   AI provides context — it does not decide truth.

---

## Freshness States

Answers move through three states:

- **Verified** — recently confirmed accurate  
- **Possibly Outdated** — time passed, needs review  
- **Outdated** — confirmed stale by people

This happens automatically, even if nobody clicks anything.

---

## Why This Is Different

**Traditional forums**
- Old answers accumulate votes forever
- No signal for relevance over time
- Incorrect advice often looks authoritative

**Still**
- Answers must prove they’re still valid
- Time degrades trust automatically
- Community and AI provide continuous verification
- Fresh answers surface naturally

---

## Important Design Principle

> Still does not decide truth.  
> It tracks whether advice still matches the current state of the world.

AI never auto-modifies content.  
It only explains *why* something might be outdated.

The final judgment is always human.

---

## Tech Stack

- **Next.js (App Router)**
- **Foru.ms API** — threads, posts, metadata
- **Groq (Llama 3.3)** — fast AI context generation
- **Tailwind CSS**
- **Vercel**

Frontend UI was generated and iterated using **v0 by Vercel**.

---

## Core Guarantees

1. Answers **will decay** if not verified  
2. Community actions are **persisted and replayable**  
3. AI assists but **never enforces decisions**  
4. The system works **even without AI**

---

## Built For

Developers working with fast-changing technology  
who are tired of confidently wrong answers.

---

## Credits

Built for the **Foru.ms x v0 by Vercel Hackathon**.

- **Foru.ms** — forum infrastructure  
- **v0 by Vercel** — UI generation and iteration  
- **Groq** — LLM inference  
- **Vercel** — deployment