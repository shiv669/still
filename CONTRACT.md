# Still - The Contract

This document specifies exactly how Still behaves. No marketing language, no "may" or "might" - just concrete guarantees.

---

## What We Promise

### 1. Answers Will Decay

An answer that is not re-verified WILL transition to a less trusted state over time.

**Specific guarantee:**
- An answer in VERIFIED state that exceeds its freshness window WILL become POSSIBLY_OUTDATED
- An answer that exceeds 1.5x its freshness window WILL become OUTDATED

**Example:**
- Question type: fast-changing-tech (90-day window)
- Answer verified on January 1st
- By April 1st (90 days): POSSIBLY_OUTDATED
- By May 16th (135 days): OUTDATED

No exceptions. No manual overrides. Time does its job.

---

### 2. Community Reports Override Everything

Three "Outdated" reports WILL mark any answer as OUTDATED, regardless of:
- How many verifications it has
- What its current score is
- How recently it was verified
- What the AI thinks

**Why:** The community's judgment that something is wrong takes precedence. If three separate people say an answer is outdated, it probably is.

---

### 3. New Answers Start Unverified

A newly posted answer WILL have:
- State: POSSIBLY_OUTDATED
- Verification score: 0.5
- Verification count: 0
- Outdated reports: 0

**Why:** New answers haven't been checked by anyone. We don't pretend they're trustworthy just because they're new.

---

### 4. AI Assists But Never Decides

The AI assessment feature WILL:
- Provide analysis and reasoning
- Suggest whether content might be outdated
- List potential issues found

The AI assessment WILL NOT:
- Automatically change an answer's state
- Automatically adjust verification scores
- Override community votes
- Make any persistent changes without user action

**Why:** AI should inform human decisions, not make them.

---

### 5. Votes Are Persistent and Limited

A user's vote on an answer WILL be:
- Saved in their browser's localStorage
- Persisted across page reloads
- Limited to one vote per answer per type

A user CAN:
- Vote "Still True" once per answer
- Vote "Outdated" once per answer
- Switch their vote from one to the other

A user CANNOT:
- Click "Still True" multiple times on the same answer
- Click "Outdated" multiple times on the same answer
- Clear their vote history (without clearing localStorage)

**Why:** Prevents spam voting and gaming the system.

---

### 6. The System Works Without AI

If the AI (Groq) is unavailable, Still WILL:
- Fall back to keyword-based question classification
- Still allow manual verification and reporting
- Still enforce time-based decay
- Still display all UI elements normally

**What won't work without AI:**
- The "AI Context" button (will show an error)
- LLM-based question classification (heuristics instead)

**Why:** AI is a nice-to-have, not a requirement. The core functionality is deterministic.

---

### 7. Diminishing Returns on Verification

Each successive verification on the same answer WILL have less impact than the previous one.

**Formula:** `boost = 0.1 × (1 / √(verification_count + 1))`

**Impact by verification number:**
| # | Score Boost |
|---|-------------|
| 1st | +0.100 |
| 2nd | +0.071 |
| 3rd | +0.058 |
| 4th | +0.050 |
| 5th | +0.045 |

**Why:** One person (or bot) repeatedly clicking "Still True" shouldn't make an answer immortal. But many different people verifying over time shows genuine accuracy.

---

### 8. Outdated Reports Heal Slowly

Each "Still True" verification WILL reduce the outdated_reports count by 1 (minimum 0).

**Why:** If an answer was incorrectly reported, the community can heal it through verification. But it takes effort - you can't just click once and undo three reports.

---

## Freshness Windows

These are the default freshness windows assigned by question type:

| Question Type | Window | Rationale |
|---------------|--------|-----------|
| fast-changing-tech | 90 days | Framework APIs change with every release |
| stable-concept | 365 days | Algorithms don't change often |
| opinion | 180 days | Best practices evolve |
| policy | 180 days | Rules get updated |

These windows determine when time-based decay kicks in, but can be overridden by community votes at any time.

---

## State Calculation Priority

When calculating an answer's state, rules are applied in this order:

1. **Community override:** outdated_reports > 2 → OUTDATED
2. **Low confidence:** verification_score < 0.3 → OUTDATED
3. **No activity:** verification_count = 0 AND outdated_reports = 0 → POSSIBLY_OUTDATED
4. **Severe time decay:** days since verification > window × 1.5 → OUTDATED
5. **Moderate time decay:** days since verification > window → POSSIBLY_OUTDATED
6. **Default:** VERIFIED

The first matching rule wins. A three-times-reported answer is OUTDATED even if it was verified yesterday.

---

## What We Don't Promise

### Accuracy
We don't guarantee that VERIFIED answers are actually correct. We guarantee that the community and time have not flagged them as outdated.

### Fairness
We don't guarantee that all answers are treated equally. Popular threads get more eyes, more votes, more verification.

### Permanence
We don't guarantee that an answer will stay in any state. A VERIFIED answer can become OUTDATED in one day if three people report it.

### AI Correctness
We don't guarantee that AI assessments are accurate. The AI might be wrong. That's why it only provides context, not decisions.

---

## Edge Cases

### What if someone spams "Still True" from multiple browsers?
Each browser has its own localStorage, so this is possible. However, diminishing returns limit the impact. After ~10 verifications, additional ones barely move the score.

### What if an answer is reported and verified simultaneously?
Reports and verifications are processed sequentially. Whichever API call completes first modifies the state, then the second one modifies it further. The final state is deterministic based on the final metadata values.

### What if Foru.ms is slow?
UI shows loading states. If the API times out (3 seconds), we show an error. No silent failures.

### What if someone posts the same answer twice?
Each answer has its own metadata. They're treated as separate entities. If one is reported outdated, the other remains unaffected.

---

## Verification

All behaviors described in this contract can be verified by:
1. Reading the source code (it's all there)
2. Testing the live application
3. Checking browser localStorage for vote tracking
4. Inspecting API responses for metadata

We don't hide complexity. The system does exactly what this document says.
