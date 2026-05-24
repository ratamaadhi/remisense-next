
#### Source Paper
[Strategi Greedy pada Permainan Kartu Remi](https://informatika.stei.itb.ac.id/~rinaldi.munir/Stmik/2020-2021/Makalah2021/Makalah-Stima-2021-K3%20(9).pdf)

# Product Requirements Document (PRD)

## AI Remi Assistant — MVP

---

# 1. Product Overview

## Product Name

**RemiSense AI** *(working title)*

## Product Type

AI-powered decision support application for Remi card games.

## Product Goal

Help players make better decisions during Remi games by analyzing:

* cards in hand,
* visible melds,
* discard pile,
* newly drawn cards,

then recommending:

* best discard,
* strongest combinations,
* highest probability completion paths,
* dead cards,
* future potential combinations.

This is **NOT** a full autonomous Remi AI player.

This is:

## “AI Recommendation Assistant”

---

# 2. Problem Statement

Many Remi players:

* struggle identifying optimal combinations,
* hold dead cards too long,
* cannot estimate probability of completion,
* make emotionally biased decisions,
* fail to evaluate multiple possible meld paths.

The application solves this by:

* calculating best combination structures,
* estimating completion probabilities,
* recommending strategic discards.

---

# 3. Product Scope (MVP Only)

## Included in MVP

### Core Features

* Manual card input
* Hand analysis
* Meld detection
* Near-combination detection
* Dead card detection
* Best discard recommendation
* Probability-based recommendation
* Visible discard tracking
* Recommendation explanation
* Joker system (rank-based wildcard)
* Game setup flow (initial discard + joker determination)

---

## Excluded from MVP

* Multiplayer
* Online gameplay
* Camera scanning
* OCR
* Real-time opponent tracking
* Monte Carlo simulation
* Reinforcement learning
* User accounts
* Analytics dashboard
* Native mobile app
* Voice assistant
* Auto-detect cards from image

---

# 4. Target Users

## Primary Users

* Casual Remi players
* Competitive Remi players
* Mobile card game enthusiasts

## User Skill Levels

* Beginner
* Intermediate
* Advanced

---

# 5. User Stories

---

## US-001 — Input Hand

### As a player

I want to input cards in my hand
So that the AI can analyze my position.

### Acceptance Criteria

* User can add/remove cards
* Maximum configurable hand size
* Cards displayed visually

---

## US-002 — Track Discard Pile

### As a player

I want to input discarded cards
So that AI can estimate probability.

### Acceptance Criteria

* User can append discard cards
* Ordered discard history maintained
* AI updates recommendations dynamically

---

## US-003 — Track Open Melds

### As a player

I want to input visible melds on the table
So AI understands cards already used.

### Acceptance Criteria

* User can add meld groups
* Melds visible separately
* AI excludes used cards from probability pool

---

## US-004 — Draw Card Analysis

### As a player

I want to input newly drawn cards
So AI can reevaluate my hand.

### Acceptance Criteria

* Single-click add draw card
* Recommendations update instantly

---

## US-005 — Best Discard Recommendation

### As a player

I want AI to suggest best discard
So I can maximize winning potential.

### Acceptance Criteria

* AI highlights discard card
* Recommendation includes explanation

Example:

```text
Discard: K♥
Reason:
- low synergy
- high dead weight
- low completion probability
```

---

## US-006 — Combination Recommendation

### As a player

I want AI to show strongest combinations
So I know which cards to keep.

### Acceptance Criteria

* AI shows:

  * completed melds
  * near melds
  * future potential

---

# 6. Functional Requirements

---

# 6.1 Card System

## Requirements

* Standard 52-card support
* Joker system: rank-based wildcard (included in MVP)

## Joker Mechanism

The joker in this Remi variant is NOT a separate joker card. It is determined at the start of each game:

1. Each player receives 7 cards
2. All players discard 1 card face-up → initial discard pile (e.g., 4 cards for 4 players)
3. One player draws 1 card blindly from the remaining deck → revealed to all players
4. All cards sharing the same rank as the drawn card become jokers (wildcards)
   - Example: drawn card is 7♥ → 7♠, 7♦, 7♣ are also jokers (4 total joker cards)
5. The drawn indicator card is placed separately (visible to all, owned by no one)
6. Joker cards can substitute any card to complete a set or sequence

## Card Model

```ts
type Suit = "spade" | "heart" | "diamond" | "club"

type Card = {
  suit: Suit
  rank: number
}
```

## Game Setup State

```ts
type GameSetup = {
  playerCount: number          // number of players (for initial discard tracking)
  jokerRank: number | null     // rank that acts as wildcard (null before determined)
  jokerIndicator: Card | null  // the drawn card that determines joker rank
}
```

---

# 6.2 Hand Management

## Features

* Add card
* Remove card
* Reset hand

## Validation

* Prevent invalid duplicates
* Max hand size configurable

---

# 6.3 Meld Detection Engine

## Must Detect

### Sets

Example:

```text
7♠ 7♦ 7♣
```

### Sets with Joker

Example (if joker rank is 3):

```text
7♠ 3♦ 7♣  →  valid set (3♦ substitutes 7♦)
```

### Sequences

Example:

```text
5♠ 6♠ 7♠
```

### Sequences with Joker

Example (if joker rank is 3):

```text
5♠ 3♥ 7♠  →  valid sequence (3♥ substitutes 6♠)
```

### Near Sequences

Example:

```text
5♠ 6♠
```

### Near Sets

Example:

```text
9♣ 9♦
```

---

# 6.4 Dead Card Detection

AI identifies:

* isolated cards,
* low probability cards,
* high-risk cards.

---

# 6.5 Recommendation Engine

## Inputs

* hand cards
* discard pile
* visible melds
* latest draw
* joker rank (wildcard identifier)

## Outputs

* best discard
* strongest combo
* risky cards
* potential future melds

## Joker Handling in Recommendations

* Joker cards should almost never be recommended for discard (extremely high flexibility)
* Joker cards boost comboPotential and flexibility scores significantly
* Near-melds involving joker cards have higher completion probability

---

# 6.6 Probability Engine

AI estimates:

* remaining useful cards,
* completion probability,
* dead card risk.

---

# 7. Recommendation Logic

---

# 7.1 Heuristic Formula

Initial MVP heuristic:

```text
Card Score =
(comboPotential × 40)
+ (completionChance × 30)
+ (flexibility × 20)
- (deadRisk × 25)
- (highPointPenalty × 10)
```

---

# 7.2 Recommendation Priorities

Priority order:

1. Preserve completed melds
2. Preserve high-probability near melds
3. Remove dead high cards
4. Remove low synergy cards
5. Minimize future penalty

---

# 8. System Architecture

---

# 8.1 Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Backend

* Node.js
* TypeScript

## State Management

* Zustand

---

# 8.2 Architecture

```text
Frontend UI
    ↓
Recommendation API
    ↓
Analysis Engine
    ├── Meld Detector
    ├── Probability Engine
    ├── Heuristic Evaluator
    └── Recommendation Engine
```

---

# 9. Core Engine Modules

---

# 9.1 Meld Detector

## Responsibilities

* detect sets
* detect sequences
* detect overlaps
* detect near combinations

---

# 9.2 Combination Solver

## Responsibilities

Find:

```text
optimal meld allocation
```

Important:
One card may belong to multiple combinations.

---

# 9.3 Probability Tracker

Tracks:

* visible cards
* discarded cards
* remaining possible cards
* joker indicator card (removed from available pool)

---

# 9.4 Recommendation Engine

Returns:

```ts
type Recommendation = {
  discard: Card
  reasons: string[]
  strongestCombos: Combo[]
  riskyCards: Card[]
}
```

## Joker Scoring Rules

* Cards matching jokerRank receive maximum flexibility score
* Joker cards are never recommended for discard unless hand is entirely jokers
* Heuristic evaluator treats joker cards as having comboPotential = 1.0

---

# 10. UI Requirements

---

# 10.1 Main Screen

## Sections

### Hand Cards

Visual hand area.

### Discard Pile

Ordered list.

### Visible Melds

Grouped cards.

### Recommendation Panel

Shows:

* discard suggestion,
* explanation,
* combo ranking.

---

# 10.2 Interaction

## Card Input

* tap to add
* tap to remove

---

# 10.3 Recommendation Display

Example:

```text
Recommended Discard:
K♥

Reason:
- isolated high card
- low sequence probability
- high penalty risk
```

---

# 11. Non-Functional Requirements

---

# Performance

* recommendation under 200ms

---

# Reliability

* deterministic recommendations

---

# Scalability

* modular engine architecture

---

# Maintainability

* isolated logic modules
* pure function engine design

---

# 12. Constraints

---

# Technical Constraints

* no machine learning in MVP
* no external AI APIs required
* offline-capable logic preferred

---

# Complexity Constraints

Avoid:

* deep search trees
* Monte Carlo simulation
* RL systems

---

# 13. Suggested Folder Structure

```text
src/
 ├── app/
 ├── components/
 ├── engine/
 │    ├── cards/
 │    ├── melds/
 │    ├── probability/
 │    ├── heuristics/
 │    ├── recommendation/
 │    └── solver/
 ├── lib/
 ├── store/
 └── types/
```

---

# 14. Algorithmic Notes

---

# Recommended MVP Algorithms

## Meld Detection

* DFS
* recursive grouping

---

## Combination Optimization

* backtracking
* heuristic scoring

---

## Probability Tracking

* frequency counting
* remaining card estimation

---

# 15. Future Expansion (Post-MVP)

---

# Planned Features

* camera scanning
* OCR card detection
* Monte Carlo simulation
* multiplayer sync
* opponent modeling
* AI adaptive strategy
* mobile app
* online PvP assistant

---

# 16. MVP Success Criteria

MVP considered successful if:

* AI consistently recommends sensible discards
* combination detection accurate >90%
* response time <200ms
* users can complete analysis within 10 seconds

---

# 17. Recommended Development Order

---

# Phase 1

* card system (including joker mechanism)
* UI hand input
* game setup flow (player count, initial discard, joker determination)
* meld detector (including joker wildcard handling)

---

# Phase 2

* heuristic engine
* discard recommendation

---

# Phase 3

* probability tracker
* explanation system

---

# Phase 4

* UX polish
* performance optimization

---

# 18. Important Engineering Principles

---

# DO

* Use pure functions
* Keep engine framework-independent
* Separate UI from game logic
* Prefer deterministic heuristics

---

# DO NOT

* Use LLMs for core recommendation logic
* Start with machine learning
* Couple engine to frontend
* Over-engineer search systems

---

# 19. Final Technical Recommendation

For MVP:

* prioritize explainable recommendations,
* deterministic logic,
* fast response,
* clean architecture.

The strength of this product is:

## “strategic explainability”

not artificial intelligence hype.
