# PE Simulator

PE Simulator is a strategy game about running a leveraged buyout fund.

The target is not "finance flavor." The target is a game that can do three jobs at once:

- Teach a finance student how a simplified middle-market PE fund actually works.
- Make finance-internet people laugh because the details are uncomfortably recognizable.
- Let PE skeptics understand the incentives, euphemisms, and damage without flattening the system into a cartoon.

## Creative Direction

### High Concept

Run Fund I at a private equity firm. Source deals, assign your team, pay for diligence, survive auctions, structure the debt stack, manage portfolio companies, choose exits, and explain the results back to LPs.

The fantasy is not "be rich." The fantasy is "operate the machine."

### Audience Test

The game is on target if all three statements feel true:

- A college student finishes a run and can explain what an LBO is, why leverage matters, what covenants do, and how PE funds make money.
- A finance poster recognizes the satire around banker processes, consultant decks, dividend recaps, continuation vehicles, adjusted EBITDA, and partnership politics.
- A skeptical outsider can say, "I understand why these people do this, and I also understand why everyone else gets mad."

### Experience Pillars

1. Accurate enough to teach.
   Simplify, but do not lie. The player should come away with a working mental model of sourcing, diligence, bidding, structuring, operations, exits, carry, and LP management.
2. Funny because it is true.
   The satire should come from recognizable industry behavior, not generic "rich people bad" jokes.
3. Human consequences stay on screen.
   If the player improves a metric by hurting employees, customers, or long-term resilience, the game should make that legible.
4. The player is an antihero, not a superhero.
   You are not fixing capitalism. You are navigating incentives inside it.

## Core Game Loop

1. Source fragmented, cash-flow businesses.
2. Allocate scarce team bandwidth.
3. Spend money on diligence to reduce uncertainty.
4. Bid in competitive auctions.
5. Build a capital stack that can carry the deal.
6. Improve, strip, merge, or over-financialize the portfolio company.
7. Exit through a strategic, sponsor, IPO, continuation, or write-off path.
8. Translate the quarter into an LP-safe narrative.

## What "Studio-Grade" Means Here

For this project, "studio-grade" does not mean photorealism. It means the game feels authored and complete:

- Clear point of view.
- Distinct visual identity.
- Strong onboarding and phase framing.
- Clean information design for dense finance systems.
- Deep enough simulation to support repeated runs.
- Enough authored events, dialogue, and consequences that the world feels inhabited.
- Consistent tone between the spreadsheet layer and the human layer.

## Production Priorities

### 1. Vertical Slice Quality

- Make the current loop feel polished from menu to quarter close.
- Improve the onboarding, phase framing, and feedback language.
- Make every major decision readable in both finance terms and human terms.

### 2. Systems Depth

- Strengthen fund math, debt behavior, and exit logic.
- Add clearer consequences for customer pain, labor pressure, and reputational blowback.
- Expand team politics, fundraising, and LP relationship systems.

### 3. Content Density

- More sectors, more company archetypes, more event chains.
- More dialogue with bankers, lenders, consultants, founders, journalists, LPs, and employees.
- More post-exit outcomes that track what kind of owner the player became.

### 4. Presentation

- Sharper UI hierarchy and a stronger art direction.
- Better motion, sound, map feedback, and character presentation.
- Tutorials and glossaries that teach without breaking tone.

## Current Stack

- React 19
- TypeScript
- Vite
- Zustand
- Tailwind CSS v4
- Pixi.js

## Development

Install and run:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Near-Term Roadmap

- Replace prototype surfaces with authored onboarding and phase briefings.
- Improve the main menu so it sells the premise immediately.
- Keep sharpening the PE sim while making the satire more legible in-play, not just in flavor text.
