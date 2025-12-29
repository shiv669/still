# Still — Behavioral Contract

This document defines **exactly how Still behaves**.

No marketing language.  
No vague claims.  
No “may” or “might”.

These guarantees describe the **current demo scope** of the system.

---

## What We Promise

### 1. Answers Decay Over Time

An answer that is not re-verified **will lose trust automatically** as time passes.

**Concrete guarantees:**
- An answer in **VERIFIED** state that exceeds its freshness window will become **POSSIBLY_OUTDATED**
- An answer that exceeds **1.5× its freshness window** will become **OUTDATED**

**Example:**
- Question type: `fast-changing-tech` (90-day window)
- Answer verified on January 1
- By April 1 (90 days): **POSSIBLY_OUTDATED**
- By May 16 (135 days): **OUTDATED**

By design, there are no manual overrides in this demo.  
Time enforces decay by default.

---

### 2. Community Reports Take Priority

If an answer receives **three “Outdated” reports**, it will be marked **OUTDATED**, regardless of:
- How many verifications it has
- How recently it was verified
- Its confidence score
- Any AI assessment

**Rationale:**  
If multiple independent people flag an answer as outdated, that signal outweighs all others.

---

### 3. New Answers Start Unverified

A newly submitted answer will always start with:

- State: **POSSIBLY_OUTDATED**
- Verification score: `0.5`
- Verification count: `0`
- Outdated reports: `0`

**Rationale:**  
New answers have not been validated. The system does not assume correctness by default.

---

### 4. AI Assists but Never Decides

AI features in Still are **strictly advisory**.

The AI system **will**:
- Provide context and reasoning
- Highlight potential outdated patterns
- Explain *why* something may no longer apply

The AI system **will not**:
- Automatically change an answer’s state
- Modify verification scores
- Override community actions
- Persist any changes without explicit user input

**Rationale:**  
AI informs human judgment. It does not replace it.

---

### 5. Vote Constraints (Demo Scope)

For this demo, vote constraints are enforced **client-side** to keep the system simple and inspectable.

A user’s interaction with an answer is constrained as follows:

- A user can mark an answer **“Still True”** once
- A user can mark an answer **“Outdated”** once
- A user may switch from one to the other
- Repeated clicks on the same action have no effect

Votes are persisted in the browser’s `localStorage` for this demo and remain consistent across reloads.

**Rationale:**  
This prevents accidental or trivial spam while keeping the demo lightweight.  
Production-grade identity and abuse prevention are out of scope.

---

### 6. The System Works Without AI

If the AI service (Groq) is unavailable, Still will continue to function.

**Guaranteed behavior without AI:**
- Time-based decay still applies
- Community verification and reporting still work
- UI remains fully usable
- Keyword-based classification replaces LLM classification

**Unavailable without AI:**
- “AI Context” explanations
- LLM-based question classification

**Rationale:**  
AI is an enhancement, not a dependency. The core system is deterministic.

---

### 7. Verification Has Diminishing Returns

Repeated verifications on the same answer have progressively less impact.

**Formula:**
**boost = 0.1 × (1 / √(verification_count + 1))**

**Approximate impact:**

| Verification # | Score Increase |
|---------------|----------------|
| 1st | +0.100 |
| 2nd | +0.071 |
| 3rd | +0.058 |
| 4th | +0.050 |
| 5th | +0.045 |

**Rationale:**  
One person cannot make an answer immortal.  
Trust grows through *independent* confirmation over time.

---

### 8. Outdated Reports Heal Gradually

Each successful **“Still True”** verification reduces the `outdated_reports` count by `1` (minimum `0`).

**Rationale:**  
Incorrect reports can be corrected, but not instantly.  
Recovery requires sustained verification.

---

## Freshness Windows

Default freshness windows assigned by question type:

| Type | Window | Rationale |
|-----|--------|-----------|
| fast-changing-tech | 90 days | APIs and frameworks evolve rapidly |
| stable-concept | 365 days | Core concepts change slowly |
| opinion | 180 days | Best practices evolve |
| policy | 180 days | Rules and guidelines update |

These windows determine **time-based decay only**.  
Community actions can override them at any time.

---

## State Evaluation Order

When determining an answer’s state, rules are applied in this order:

1. **Community override:** `outdated_reports > 2` → **OUTDATED**
2. **Low confidence:** `verification_score < 0.3` → **OUTDATED**
3. **No activity:** no verifications or reports → **POSSIBLY_OUTDATED**
4. **Severe time decay:** age > `window × 1.5` → **OUTDATED**
5. **Moderate time decay:** age > `window` → **POSSIBLY_OUTDATED**
6. **Default:** **VERIFIED**

The first matching rule determines the state.

---

## What We Do Not Promise

### Accuracy
A **VERIFIED** answer is not guaranteed to be correct.  
It is only guaranteed not to be flagged as outdated by time or people.

### Fairness
Popular questions may receive more verification.  
Still does not equalize attention.

### Permanence
No answer is permanent.  
Any state can change with time or community input.

### AI Correctness
AI explanations may be wrong or incomplete.  
They are informational only.

---

## Edge Cases (Non-Critical)

The following cases are documented for transparency.  
They are **not required** to evaluate the core idea.

- Multiple browsers can bypass client-side vote limits
- Concurrent reports and verifications are processed sequentially
- Duplicate answers are treated as independent entities
- API latency results in visible loading or error states

---

## Verification

All guarantees in this document can be validated by:
1. Inspecting the source code
2. Using the live application
3. Reviewing metadata in API responses
4. Inspecting client-side state where applicable

The system behaves exactly as described above.