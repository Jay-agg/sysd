# How challenge evaluation works

This document describes the **deterministic evaluation pipeline** in Scalelab: what runs when, and which fields from the **question bank** (`datav3.json`, typed as `Challenge`) actually drive checks versus which are **presentation-only** (copy, tags, hints).

---

## 1. Where the question bank comes from

- Challenges are loaded from **`datav3.json`** (wrapped as `{ "questions": Challenge[] }`) and cast to the `Challenge` type (`src/types/challenge.ts`).
- The loader is `src/lib/challenges/index.ts` (`getChallengeById`, `challenges`).

Every evaluation receives:

- The **`Challenge`** record (metadata + bank fields + tests).
- The user’s **canvas graph**: `SimNode[]` and `SimEdge[]` (`src/types/simulation.ts`).

---

## 2. Two entry points (Run vs Submit)

| Action | Function | Tests used | Checklists | Score / insights |
|--------|----------|------------|------------|------------------|
| **Run Test** | `evaluateRunTests` | `challenge.visibleTests` only | No (short reason string only) | No |
| **Submit** | `evaluateSubmission` | `visibleTests` + `hiddenTests` | Yes, per failing step | Only if **every** test passes |

Implementation: `src/lib/evaluation/challengeEvaluator.ts`.

---

## 3. Per-test evaluation (`evaluateSingleTest`)

For each `TestCase`, the engine builds **effective checks** by merging **per-test** `checks` with **challenge-level** defaults, then runs a **fixed sequence** of gates. The first failure stops that test (short-circuit).

In **datav3**, a test may omit keys (for example only `requiredCapabilities`, or only `noSinglePointOfFailure` + `minReplicas`). **`normalizeTestChecks`** fills missing simulation thresholds with permissive defaults (very high latency cap, 100% max error, 0 min throughput, empty component list, SPOF off) so unspecified gates do not fail the run.

### 3.1 Merging bank defaults into each test: `resolveTestChecksForChallenge`

**File:** `src/lib/evaluation/resolveTestChecks.ts`

| Source | Fields | How they merge |
|--------|--------|----------------|
| **Per test** | `test.checks` | Base thresholds and lists (normalized in `normalizeTestChecks`). |
| **Question bank** | `challenge.scalingExpectations` | `minReplicas` / `minShards`: **max** of test value and challenge value (challenge raises the bar). |
| **Question bank** | `challenge.requiredCapabilities` | **Union** with `test.checks.requiredCapabilities` (deduped). |

So for **pass/fail**, the bank contributes **stricter scaling floors** and **extra capability tokens** applied to **every** test, not only to one row in JSON.

### 3.2 Check order (same for every test)

After normalization, `evaluateSingleTest` runs:

1. **Empty graph** — if there are no nodes → fail (no simulation).
2. **Required components** — `checks.requiredComponents` (component types present on canvas).
3. **Required capabilities** — declarative tokens; validated against graph patterns (`evaluateRequiredCapabilities` / pattern machinery under `src/lib/evaluation/`).
4. **Single point of failure** — if `checks.noSinglePointOfFailure` is true, SPOF rules apply.
5. **Min replicas / min shards** — per DB-style nodes, using merged `minReplicas` / `minShards`.
6. **Simulation** — `simulateTick` at `test.input.traffic`, then `buildSimulationSnapshot`.
7. **Simulation thresholds** — `maxLatency`, `maxErrorRate`, `minThroughput` against the snapshot.

All of the above use the **merged** `NormalizedTestChecks` (see `src/lib/evaluation/checkEvaluators/normalizeChecks.ts`).

**Important:** Narrative fields on the challenge such as **`description`**, **`requirements`**, **`tags`**, **`companyTags`**, **`title`**, **`difficulty`** are **not** inputs to this pipeline. They are for the UI and learning only.

---

## 4. Submission-level outcome

### 4.1 Pass / fail

- `overallPass` is **true** only if there is at least one test result **and** **every** `SingleTestEvaluation.passed` is true (`challengeEvaluator.ts`).

If **any** test fails:

- `explainability` is **null** (no elite score).
- `graphInsights` is an **empty array**.
- `overallScore` is **0** in the result object (meaningful score is not computed).

### 4.2 After all tests pass: elite score + graph insights

Only when `overallPass` is true:

1. **Peak traffic** — `max` of each test’s traffic across the suite.
2. **One more simulation** at that peak: `simulateTick` → `buildSimulationSnapshot`.
3. **`computeEliteScore`** — `src/lib/evaluation/eliteScoring.ts`  
   - Produces **0–100** final score, **five dimension breakdown** (`ScoreBreakdown`), **penalties**, **highlights**.
4. **`runGraphAnalysis`** — `src/lib/evaluation/graphAnalysis.ts`  
   - Deterministic list of **graph insight** items (SPOF, bottlenecks, pattern hints, etc.).

---

## 5. Question bank fields used *inside* scoring (elite layer)

These fields affect **weights** and **rule-based feedback** after all tests pass. They do **not** replace the per-test pass/fail gates.

| Bank field | Role |
|------------|------|
| **`evaluationCriteria`** | Weights for the five dimensions (scalability, reliability, latency, architecture, efficiency). `getEliteWeights` supports **5 numbers** or **3 numbers** (scalability / reliability / latency); if missing, **defaults** are used (`eliteScoring.ts`). |
| **`expectedPatterns`** | List of **tokens** (e.g. `caching`, `load_balancing`). Compared to **detected patterns** on the graph: matches add **highlights**, misses add **penalties** (wording includes “expected pattern”). |
| **`antiPatterns`** | Tokens such as `single_point_of_failure`, `no_async_processing`, `db_bottleneck`. If the graph exhibits the bad condition **and** the bank lists that anti-pattern, **extra penalties** are appended. |

**Not used in `computeEliteScore`:** `idealSolutionCharacteristics` — that is **mentor copy** for the UI, not a scoring input.

---

## 6. Question bank fields that only affect *tests* (merged checks)

Already covered in §3.1; repeated here for clarity:

| Bank field | Role |
|------------|------|
| **`scalingExpectations`** | Raises **minimum** replicas/shards for tests vs test-only `checks`. |
| **`requiredCapabilities`** | Extra capability strings merged into every test’s effective checks. |

Per-test JSON still supplies **`visibleTests[].checks`** and **`hiddenTests[].checks`** (traffic, latency/error/throughput limits, components, SPOF flag, etc.).

---

## 7. What is *not* part of automated evaluation

These come from the same `Challenge` object but are **not** read by `challengeEvaluator` / `eliteScoring` / `runGraphAnalysis`:

- **`description`**, **`requirements`**
- **`tags`**, **`difficulty`**, **`companyTags`**
- **`idealSolutionCharacteristics`**, **`expectedPatterns` / `antiPatterns` as teaching text** — note: the **token lists** `expectedPatterns` / `antiPatterns` **are** used in elite scoring as in §5; there is no separate “free text” scoring field.

---

## 8. Optional: AI feedback (outside core evaluation)

After a successful submission with explainability, the app may call **`/api/challenge/ai-feedback`** with architecture and evaluation outputs. That is **additional** to the deterministic pipeline and depends on server configuration (not required to understand pass/fail or score math).

---

## 9. File map (quick reference)

| Concern | Location |
|---------|----------|
| Orchestration | `src/lib/evaluation/challengeEvaluator.ts` |
| Merge test + bank checks | `src/lib/evaluation/resolveTestChecks.ts` |
| Check normalization | `src/lib/evaluation/checkEvaluators/normalizeChecks.ts` |
| Individual gates | `src/lib/evaluation/checkEvaluators/*.ts` |
| Weighted score + penalties/highlights | `src/lib/evaluation/eliteScoring.ts` |
| Graph insight messages | `src/lib/evaluation/graphAnalysis.ts`, `src/lib/evaluation/graph/*` |
| Types | `src/types/challenge.ts`, `src/types/evaluation.ts` |

---

## 10. Summary

1. **Pass/fail** is driven by **each test’s** `input.traffic` and **merged** `checks` (including **`scalingExpectations`** and **`requiredCapabilities`** from the bank).
2. **Numeric score and breakdown** run **only** when **all** visible + hidden tests pass, using **`evaluationCriteria`** weights and graph-derived dimensions in **`eliteScoring.ts`**.
3. **Pattern / anti-pattern lists** from the bank shape **elite penalties and highlights**, not the binary test runner.
4. **Story fields** (description, requirements, etc.) explain the problem to humans; they are **not** inputs to the evaluator.
