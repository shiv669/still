# Still — System Architecture

This document explains how Still is built and why the system behaves the way it does.
It focuses on core mechanisms, not marketing or unnecessary implementation detail.

---

## Core Architecture Idea

Every answer carries freshness metadata stored directly in Foru.ms using the `extendedData` field.

This design means:
- No separate database
- No synchronization issues
- State can always be recomputed

The system never trusts stored state.  
Freshness is recalculated from metadata and current time on every read.

```ts
interface FreshnessMetadata {
  created_at: string
  last_verified_at: string
  freshness_window_days: number
  state: "VERIFIED" | "POSSIBLY_OUTDATED" | "OUTDATED"
  verification_score: number
  verification_count: number
  outdated_reports: number
}
```

---

## Deterministic Freshness Engine

Freshness is controlled by a pure, deterministic state machine.

Given the same metadata and time, the output state is always the same. There are no side effects and no hidden state.

### State Evaluation Order

Rules are applied in strict priority order:

1. **Community override:** `outdated_reports > 2` → **OUTDATED**
2. **Low confidence:** `verification_score < 0.3` → **OUTDATED**
3. **No activity:** no verifications and no reports → **POSSIBLY_OUTDATED**
4. **Severe time decay:** `age > window × 1.5` → **OUTDATED**
5. **Moderate time decay:** `age > window` → **POSSIBLY_OUTDATED**
6. **Default:** **VERIFIED**

Community signals always take precedence over time or AI input.

---

## Verification Mechanics

**Still True**
* Increases verification score using diminishing returns
* Updates the last verification timestamp
* Gradually heals outdated reports

**Outdated**
* Decreases verification score
* Increments outdated report count

This prevents spam, accidental immortality of answers, and single-user dominance.

---

## Question Classification

When a question is created, the system assigns a freshness window.

**Primary Path**
* Uses Groq (Llama 3.x)
* Classifies questions into:
    * `fast-changing-tech`
    * `stable-concept`
    * `opinion`
    * `policy`

**Fallback Path**
* Keyword-based heuristics
* Ensures full functionality without AI

Classification affects decay speed only. It never determines correctness.

---

## AI Context (Advisory Only)

The AI Context feature:
* Analyzes answers against known patterns
* Highlights potentially outdated assumptions
* Explains risks in plain language

**AI output:**
* Never changes answer state
* Never mutates stored data
* Never overrides community actions

AI informs decisions. Humans make them.

---

## Frontend Architecture

**Next.js App Router**
* Client components for interactive flows
* Loading states instead of blocking renders
* Optimistic UI for verification actions

The interface is designed so users understand the system without reading documentation.

---

## API Surface

The API is intentionally minimal:
* Create questions (with classification metadata)
* Create answers (with freshness initialization)
* Verify or report answers
* Request AI context

All business logic lives in shared libraries, not API routes.

---

## Failure & Fallback Philosophy

Every dependency has a safe failure mode:

| Dependency | Behavior on Failure |
| :--- | :--- |
| **AI** | Feature disables, core system continues |
| **Foru.ms latency** | UI shows loading or error state |
| **Classification** | Heuristic fallback |
| **Verification** | Deterministic recomputation |

The system never silently lies to the user.

---

## Performance Decisions

* Metadata stored with content avoids joins
* Limited-scope engagement checks
* Parallel API requests where possible
* No background jobs required for correctness

The system scales conceptually before scaling infrastructure.

---

## Demo Scope Notes

This is a hackathon demo, not production software.

**Out of scope by design:**
* Real authentication
* Cross-device identity
* Distributed caching
* Advanced abuse prevention

**What is proven:**
* Time-based decay works
* Community overrides work
* AI assists safely
* The core idea survives real usage

---

## Architectural Truth

Still is simple by constraint, not by accident.

> Answers decay.
> People verify.
> AI explains.
> Time enforces honesty.
