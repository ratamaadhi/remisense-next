<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)



Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project Context (updated 2026-05-26)

**RemiSense** — AI decision support untuk permainan kartu Remi Indonesia.

### Stack
- Next.js 16.2.6, React 19.2.4, TypeScript, Tailwind 4, Shadcn, Zustand 5
- Vitest (112 tests, semua pass per 2026-05-26)

### Engine modules (src/engine/)
- `cards/cardUtils` — card utilities
- `melds/meldDetector` — deteksi set & sequence (termasuk joker wildcard)
- `solver/combinationSolver` — backtracking optimal meld allocation
- `heuristics/heuristicEvaluator` — scoring: (comboPotential×40)+(completionChance×30)+(flexibility×20)-(deadRisk×25)-(highPointPenalty×10)
- `probability/probabilityTracker` — estimasi kartu tersisa
- `recommendation/recommendationEngine` — output rekomendasi final

### Key types (src/types/index.ts)
- `Card { suit, rank }` — rank: 1=A, 11=J, 12=Q, 13=K
- `Meld`, `NearMeld`, `MeldAllocation`, `Recommendation`, `GameContext`
- `DiscardPickupOption` & `DiscardPickupRecommendation` — analisis ambil dari tumpukan buangan

### Joker mechanism
Bukan kartu joker terpisah. Ditentukan awal game: satu kartu diambil blind, semua kartu rank sama jadi wildcard (4 joker total).

### UI components (src/components/)
`hand/`, `discard/`, `melds/`, `setup/`, `recommendation/`, `panduan/`

### Prinsip engineering
- Pure functions, engine framework-independent
- No LLM/ML — deterministic heuristics only
- Offline-capable, target <200ms per rekomendasi
