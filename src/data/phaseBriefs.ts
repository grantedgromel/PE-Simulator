export interface PhaseBriefContent {
  eyebrow: string
  title: string
  description: string
  financeLens: string
  satireLens: string
  playerGoal: string
}

export const PHASE_BRIEFS: Record<
  'sourcing' | 'teamAssignment' | 'diligence' | 'structuring' | 'operations' | 'exits' | 'endOfQuarter',
  PhaseBriefContent
> = {
  sourcing: {
    eyebrow: 'Sourcing',
    title: 'Cut the funnel fast.',
    description: 'Shortlist only the few worth burning time on.',
    financeLens: 'Attention',
    satireLens: 'Banker Spin',
    playerGoal: 'Best Deals',
  },
  teamAssignment: {
    eyebrow: 'Team Assignment',
    title: 'Spend partner time like cash.',
    description: 'Coverage is scarce. Bad staffing is a real penalty now.',
    financeLens: 'Bandwidth',
    satireLens: 'Sleep Debt',
    playerGoal: 'Cover Risk',
  },
  diligence: {
    eyebrow: 'Diligence',
    title: 'Buy certainty, not theater.',
    description: 'Better staff gets you sharper reads for less spend.',
    financeLens: 'Asymmetry',
    satireLens: 'Manageable Risk',
    playerGoal: 'Bid Smart',
  },
  structuring: {
    eyebrow: 'Structuring',
    title: 'Turn price into leverage math.',
    description: 'More debt lifts returns until it breaks the asset.',
    financeLens: 'Leverage',
    satireLens: 'Covenants',
    playerGoal: 'Close Clean',
  },
  operations: {
    eyebrow: 'Operations',
    title: 'You have limited moves. Use them.',
    description: 'Execution budget and operator coverage now gate the quarter.',
    financeLens: 'Execution',
    satireLens: 'Synergy',
    playerGoal: 'Value Up',
  },
  exits: {
    eyebrow: 'Exits',
    title: 'Marks do not pay LPs.',
    description: 'Pick the route that clears cash, not just vibes.',
    financeLens: 'Realizations',
    satireLens: 'Pass The Parcel',
    playerGoal: 'DPI',
  },
  endOfQuarter: {
    eyebrow: 'Quarter Close',
    title: 'Read the board. Then read the room.',
    description: 'Events, marks, and pressure should be legible at a glance.',
    financeLens: 'Marks',
    satireLens: 'Narrative',
    playerGoal: 'Next Turn',
  },
}
