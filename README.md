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

1. Accurate enough to teach. Simplify, but do not lie.
2. Funny because it is true. Satire from recognizable industry behavior.
3. Human consequences stay on screen.
4. The player is an antihero, not a superhero.

## Core Game Loop

1. Source fragmented, cash-flow businesses.
2. Allocate scarce team bandwidth.
3. Spend money on diligence to reduce uncertainty.
4. Bid in competitive auctions.
5. Build a capital stack that can carry the deal.
6. Improve, strip, merge, or over-financialize the portfolio company.
7. Exit through a strategic, sponsor, IPO, continuation, or write-off path.
8. Translate the quarter into an LP-safe narrative.

## Stack

- React 19 + TypeScript
- Vite 8
- DiceBear (open-peeps style) — character portraits
- Phosphor Icons — business / product icons
- Plain CSS for the arcade design system (no Tailwind, no UI framework)

## Project layout

```
src/
├── App.tsx           # mounts <PEApp />
├── main.tsx          # React entry
├── index.css         # arcade design system + global tokens
└── pe/
    ├── PEApp.tsx        # title screen → in-game routing
    ├── data.ts          # deals, team, advisors, portfolio, fund-name generator
    ├── ui.tsx           # Panel, BigBtn, Stat, Meter, Tag, HeatDots
    ├── cards.tsx        # PortraitTile, PersonCard, CompanyCard
    ├── portraits.tsx    # DiceBear open-peeps wrapper
    ├── portraitData.ts  # per-character portrait tweaks
    ├── companyArt.tsx   # Phosphor icon wrapper
    ├── companyIcons.ts  # company art-key → icon map
    ├── TitleScreen.tsx  # fund name generator + RAISE THE FUND
    ├── HUD.tsx          # sticky brand / stats / nav
    ├── Dashboard.tsx    # HQ — portfolio grid, quarter clock, actions, LP sentiment
    ├── Pipeline.tsx     # DEALS — sector filters, CIM detail
    ├── Diligence.tsx    # DD — team allocation, advisor toggles, IC confidence
    ├── Auction.tsx      # BID — sealed-bid console, results
    ├── CapStack.tsx     # STACK — sources & uses, LBO model, returns
    ├── CompanyView.tsx  # value-creation levers + human consequences + exits
    └── Roster.tsx       # filterable card deck (people + portfolio)
```

## Development

```bash
npm install
npm run dev       # http://localhost:5173
```

Production build:

```bash
npm run build     # tsc -b && vite build
npm run preview
```

Lint:

```bash
npm run lint
```

## Credits

- **Open Peeps** by Pablo Stanley — CC0 hand-drawn character art (rendered via DiceBear).
- **Phosphor Icons** by Tobias Fried — MIT-licensed product icons.
