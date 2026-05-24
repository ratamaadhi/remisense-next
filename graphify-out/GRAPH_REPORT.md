# Graph Report - .  (2026-05-24)

## Corpus Check
- Corpus is ~32,873 words - fits in a single context window. You may not need a graph.

## Summary
- 161 nodes · 234 edges · 24 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Card Engine Core|Card Engine Core]]
- [[_COMMUNITY_Solver & Heuristics|Solver & Heuristics]]
- [[_COMMUNITY_Game UI Components|Game UI Components]]
- [[_COMMUNITY_Layout & UI Primitives|Layout & UI Primitives]]
- [[_COMMUNITY_Discard Pickup Flow|Discard Pickup Flow]]
- [[_COMMUNITY_Design Rationale & Strategy|Design Rationale & Strategy]]
- [[_COMMUNITY_Card Interaction Handlers|Card Interaction Handlers]]
- [[_COMMUNITY_Feature Components|Feature Components]]
- [[_COMMUNITY_Game State & Validation|Game State & Validation]]
- [[_COMMUNITY_Interactive UI Elements|Interactive UI Elements]]
- [[_COMMUNITY_Brand Assets|Brand Assets]]
- [[_COMMUNITY_Suit Type|Suit Type]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Vitest Setup|Vitest Setup]]
- [[_COMMUNITY_PostCSS Setup|PostCSS Setup]]
- [[_COMMUNITY_Next.js Setup|Next.js Setup]]
- [[_COMMUNITY_ESLint Setup|ESLint Setup]]
- [[_COMMUNITY_Card UI|Card UI]]
- [[_COMMUNITY_Separator UI|Separator UI]]
- [[_COMMUNITY_Progress UI|Progress UI]]
- [[_COMMUNITY_Card Type Model|Card Type Model]]
- [[_COMMUNITY_Globe Icon|Globe Icon]]
- [[_COMMUNITY_Window Icon|Window Icon]]
- [[_COMMUNITY_File Icon|File Icon]]

## God Nodes (most connected - your core abstractions)
1. `Heuristic Evaluator - scoreCard()` - 12 edges
2. `scoreCard()` - 10 edges
3. `cardEquals()` - 10 edges
4. `Combination Solver - solveOptimalMelds()` - 10 edges
5. `cn()` - 9 edges
6. `detectNearMelds()` - 9 edges
7. `Recommendation Engine - analyze()` - 9 edges
8. `Recommendation Engine - analyzeDiscardPickup()` - 9 edges
9. `analyzeDiscardPickup()` - 8 edges
10. `solveOptimalMelds()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Joker Mechanism (Rank-Based Wildcard)` --conceptually_related_to--> `Combination Solver - solveOptimalMelds()`  [INFERRED]
  PRD.md → src/engine/solver/combinationSolver.test.ts
- `Heuristic Card Scoring Formula` --conceptually_related_to--> `Combination Solver - solveOptimalMelds()`  [INFERRED]
  PRD.md → src/engine/solver/combinationSolver.test.ts
- `Discard Pickup Net Score Formula` --semantically_similar_to--> `Heuristic Card Scoring Formula`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-05-24-discard-pickup-design.md → PRD.md
- `Discard Pickup Feature Spec` --references--> `Combination Solver - solveOptimalMelds()`  [EXTRACTED]
  docs/superpowers/specs/2026-05-24-discard-pickup-design.md → src/engine/solver/combinationSolver.test.ts
- `Discard Pickup Feature Spec` --references--> `Opponent Pickup From Discard Action`  [EXTRACTED]
  docs/superpowers/specs/2026-05-24-discard-pickup-design.md → src/store/gameStore.ts

## Hyperedges (group relationships)
- **Remi Game State Data Flow** — gameStore_ref, page_Home, HandArea_component, RecommendationPanel_component [INFERRED 0.90]
- **AI Recommendation Pipeline** — recommendationEngine_ref, RecommendationPanel_component, index_Recommendation, index_DiscardPickupRecommendation [INFERRED 0.85]
- **Card Domain Model Type System** — index_Card, index_Suit, index_Meld, index_NearMeld, index_MeldAllocation [EXTRACTED 1.00]
- **Engine Analysis Pipeline (meld detection → probability → heuristics → recommendation)** — meldDetector_detectNearMelds, probabilityTracker_getCompletionProbability, heuristicEvaluator_scoreCard, recommendationEngine_analyze [INFERRED 0.90]
- **CardPicker Reuse Pattern (shared card selection UI)** — CardPicker_component, MeldTable_component, DiscardPile_component, DiscardPickupFlow_component, GameSetup_component [EXTRACTED 1.00]
- **Game Store State Consumers (all components share Zustand store)** — store_gameStore, CardPicker_component, MeldTable_component, DiscardPile_component, DiscardPickupFlow_component, GameSetup_component [EXTRACTED 1.00]
- **Discard Pickup Feature End-to-End Flow** — spec_discard_pickup, plan_discard_pickup, gameStore_pickupFromDiscard, gameStore_opponentPickupFromDiscard, combinationSolver_solveOptimalMelds [EXTRACTED 0.90]
- **Recommendation Scoring System** — PRD_heuristic_formula, PRD_recommendation_priorities, combinationSolver_solveOptimalMelds, spec_discard_pickup_net_score [INFERRED 0.80]
- **Game State Integrity System** — gameStore_useGameStore, gameStore_isCardUsed, gameStore_mutual_exclusion, gameStore_pickupFromDiscard [EXTRACTED 0.90]

## Communities (33 total, 17 thin omitted)

### Community 0 - "Card Engine Core"
Cohesion: 0.17
Nodes (15): cardEquals(), getRankValue(), isJoker(), parseCard(), scoreCard(), detectNearMelds(), detectSequences(), detectSets() (+7 more)

### Community 1 - "Solver & Heuristics"
Cohesion: 0.21
Nodes (19): Card Utils - ALL_CARDS constant, Card Utils - cardEquals(), Card Utils - isJoker(), Backtracking with Branch-and-Bound Pruning, Contested Cards Resolution Logic, Combination Solver - solveOptimalMelds(), Heuristic Evaluator - scoreCard(), Meld Detector - detectNearMelds() (+11 more)

### Community 2 - "Game UI Components"
Cohesion: 0.2
Nodes (18): CardChip Component, HandArea Component, RecommendationPanel Component, Card Utilities, Game Store (Zustand), Card Type, DiscardPickupOption Type, DiscardPickupRecommendation Type (+10 more)

### Community 5 - "Design Rationale & Strategy"
Cohesion: 0.2
Nodes (10): Heuristic Card Scoring Formula, Joker Mechanism (Rank-Based Wildcard), Pure Client-Side SPA Architecture, Recommendation Priority Order, RemiSense AI Product Requirements, Source Paper: Strategi Greedy pada Permainan Kartu Remi, Strategic Explainability Principle, RemiSense AI MVP Implementation Plan (+2 more)

### Community 6 - "Card Interaction Handlers"
Cohesion: 0.28
Nodes (4): formatCard(), handleCardClick(), isSelected(), isUsed()

### Community 7 - "Feature Components"
Cohesion: 0.39
Nodes (9): CardPicker Component, DiscardPickupFlow Component, DiscardPile Component, GameSetup Component, MeldTable Component, Card Utils - formatCard(), Probability Tracker - getTopNDiscards(), Game Store (Zustand) (+1 more)

### Community 8 - "Game State & Validation"
Cohesion: 0.25
Nodes (9): Card Uniqueness Validation (isCardUsed), Card Mutual Exclusion Invariant, Opponent Pickup From Discard Action, Pickup From Discard Action, Game Store Test Suite, Game Store (Zustand), Discard Pickup Implementation Plan, Discard Pickup Feature Spec (+1 more)

## Knowledge Gaps
- **31 isolated node(s):** `Suit Type`, `GameContext Type`, `GameSetup Type`, `GamePhase Type`, `RootLayout Component` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cardEquals()` connect `Card Engine Core` to `Discard Pickup Flow`, `Card Interaction Handlers`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `cn()` connect `Layout & UI Primitives` to `Card Interaction Handlers`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `Combination Solver - solveOptimalMelds()` connect `Solver & Heuristics` to `Game State & Validation`, `Design Rationale & Strategy`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `scoreCard()` (e.g. with `generateReasons()` and `isJoker()`) actually correct?**
  _`scoreCard()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Combination Solver - solveOptimalMelds()` (e.g. with `Meld Detector - detectSets()` and `Meld Detector - detectSequences()`) actually correct?**
  _`Combination Solver - solveOptimalMelds()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Suit Type`, `GameContext Type`, `GameSetup Type` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Layout & UI Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._