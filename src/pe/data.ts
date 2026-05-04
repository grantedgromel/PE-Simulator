// PE Simulator design data — fund name generator, deals, team, advisors, portfolio
// Ported verbatim from the design bundle (pe-simulator/project/data.jsx).

export type ArchetypeId = 'SOURCING' | 'DEAL_TEAM' | 'OPERATING'

export interface Archetype {
  id: ArchetypeId
  label: string
  color: string
  sigil: string
  traitKeys: string[]
  traitTips: Record<string, string>
}

export interface Person {
  id: string
  name: string
  initials: string
  art: string
  archetype: ArchetypeId
  title: string
  cost: number
  sector: string
  traits: Record<string, number>
  quirk: string
  flavor: string
  tenure: string
}

export interface Deal {
  id: string
  name: string
  art: string
  sector: string
  ebitda: number
  multiple: number
  revenue: number
  banker: string
  process: string
  heat: number
  story: string
}

export interface Advisor {
  id: string
  name: string
  cost: number
  accuracy: number
  weeks: number
  finding: string
}

export interface PortfolioCompany {
  id: string
  name: string
  art: string
  sector: string
  acquired: string
  entryMultiple: number
  entryEbitda: number
  currentEbitda: number
  revenue: number
  leverage: number
  hold: number
  satisfaction: number
  layoffs: number
  lawsuits: number
  color: string
  levers: { priceIncrease: number; mgmtTurnover: number; addOns: number; capexCut: number }
}

// ── Fund name generator ──────────────────────────────────────────────
const FUND_PREFIXES = [
  'Meridian', 'Keystone', 'Ironhold', 'Granite', 'Larkspur', 'Summit',
  'Blackfern', 'Harbor', 'Cascadia', 'Stoneridge', 'Covenant', 'Sentinel',
  'Ashford', 'Copperline', 'Whitfield', 'Mercer', 'Pinnacle', 'Drayton',
  'Beacon', 'Foundry', 'Wolverine', 'Thornton', 'Halcyon', 'Oakmont',
]
const FUND_MIDDLES = [
  'Ridge', 'Hollow', 'Creek', 'Point', 'Grove', 'Cove', 'Reach', 'Lane',
  'Bridge', 'Field', 'Bay', 'Hill', 'Park', 'Park', 'Peak', 'Cross',
]
const FUND_SUFFIXES = [
  'Capital Partners', 'Equity Partners', 'Holdings', 'Capital',
  'Management', 'Advisors', 'Capital Group', 'Partners', 'Ventures',
]

export function generateFundName(): string {
  const p = FUND_PREFIXES[Math.floor(Math.random() * FUND_PREFIXES.length)]
  const m = Math.random() > 0.4 ? ' ' + FUND_MIDDLES[Math.floor(Math.random() * FUND_MIDDLES.length)] : ''
  const s = FUND_SUFFIXES[Math.floor(Math.random() * FUND_SUFFIXES.length)]
  return `${p}${m} ${s}`
}

// ── Deal pipeline ──────────────────────────────────────────────────
export const DEAL_POOL: Deal[] = [
  { id: 'd1', name: 'Patriot HVAC Roll-up', art: 'd1_hvac', sector: 'HVAC Services', ebitda: 14.2, multiple: 7.5, revenue: 92, banker: 'Goldman', process: 'Broad auction', heat: 4, story: '8-location HVAC platform across the Sunbelt. Founder retiring. Recurring maintenance revenue 62%.' },
  { id: 'd2', name: 'Meadowbrook Dental', art: 'd2_dental', sector: 'Healthcare', ebitda: 8.1, multiple: 9.2, revenue: 41, banker: 'Houlihan', process: 'Limited auction', heat: 5, story: '32-office DSO. Management wants rollover. Medicaid exposure is 18%.' },
  { id: 'd3', name: 'Cornerstone Plastics', art: 'd3_plastics', sector: 'Industrial', ebitda: 22.5, multiple: 6.1, revenue: 180, banker: 'Harris Williams', process: 'Proprietary', heat: 2, story: 'Injection molding, 3 plants. Cyclical. One customer is 38% of revenue.' },
  { id: 'd4', name: 'BrightPath Tutoring', art: 'd4_tutoring', sector: 'Consumer / Services', ebitda: 5.8, multiple: 11.0, revenue: 38, banker: 'Raymond James', process: 'Broad auction', heat: 5, story: 'K-8 tutoring chain. Post-pandemic surge. Teacher turnover 41%.' },
  { id: 'd5', name: 'Northstar Specialty Chem', art: 'd5_specchem', sector: 'Industrial', ebitda: 31.0, multiple: 8.0, revenue: 210, banker: 'Lazard', process: 'Broad auction', heat: 3, story: "Niche coatings. EBITDA includes $4M of 'non-recurring' adjustments." },
  { id: 'd6', name: 'Riverside Laundromats', art: 'd6_laundromat', sector: 'Consumer / Services', ebitda: 3.2, multiple: 5.8, revenue: 12, banker: 'No advisor', process: 'Proprietary', heat: 1, story: '14 cash-flow laundromats. Owner is 72. Real estate is included.' },
  { id: 'd7', name: 'Helix Billing Services', art: 'd7_billing', sector: 'Healthcare', ebitda: 11.4, multiple: 10.5, revenue: 54, banker: 'Jefferies', process: 'Limited auction', heat: 4, story: 'Medical billing SaaS-ish. Labor costs offshored to Manila last year.' },
  { id: 'd8', name: 'Cascade Pest Control', art: 'd8_pest', sector: 'HVAC Services', ebitda: 6.9, multiple: 8.2, revenue: 31, banker: 'Piper Sandler', process: 'Broad auction', heat: 3, story: 'PNW regional pest control. Routes, contracts, trucks. Classic.' },
]

// ── Archetypes ──────────────────────────────────────────────────────
export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  SOURCING: {
    id: 'SOURCING', label: 'Sourcing',
    color: '#FF7A3C',
    sigil: '◆',
    traitKeys: ['ROLODEX', 'CHARM', 'INSTINCT', 'HUSTLE', 'PATIENCE'],
    traitTips: {
      ROLODEX: 'Quality of contacts — bankers, founders, intermediaries',
      CHARM: 'Ability to win trust in a first meeting',
      INSTINCT: 'Nose for a mispriced asset',
      HUSTLE: 'Raw deal volume — calls, dinners, travel',
      PATIENCE: 'Willingness to cultivate a deal for years',
    },
  },
  DEAL_TEAM: {
    id: 'DEAL_TEAM', label: 'Deal Team',
    color: '#FF3DA5',
    sigil: '▲',
    traitKeys: ['MODELING', 'DILIGENCE', 'NEGOTIATION', 'STAMINA', 'JUDGMENT'],
    traitTips: {
      MODELING: 'Speed and accuracy in LBO models',
      DILIGENCE: 'Catches issues in QoE, contracts, customer data',
      NEGOTIATION: 'Purchase price, working capital peg, reps & warranties',
      STAMINA: 'Handles sprint weeks without burning out the room',
      JUDGMENT: 'Knows when to walk away',
    },
  },
  OPERATING: {
    id: 'OPERATING', label: 'Operating Partner',
    color: '#C9FF3C',
    sigil: '●',
    traitKeys: ['LEADERSHIP', 'COST_DISCIPLINE', 'GROWTH_PLAYBOOK', 'TECHNICAL', 'EMPATHY'],
    traitTips: {
      LEADERSHIP: 'Rallies management teams, replaces CEOs cleanly',
      COST_DISCIPLINE: 'Finds and cuts fat — SG&A, headcount, real estate',
      GROWTH_PLAYBOOK: 'Pricing, sales ops, M&A integration',
      TECHNICAL: 'Operations / supply chain / systems expertise',
      EMPATHY: 'Keeps employees engaged through change',
    },
  },
}

// ── Team ────────────────────────────────────────────────────────────
export const TEAM: Person[] = [
  { id: 's1', name: 'Arthur Holloway', initials: 'AH', art: 's1', archetype: 'SOURCING', title: 'Senior Partner · Origination', cost: 6.5, sector: 'Industrials', traits: { ROLODEX: 5, CHARM: 4, INSTINCT: 5, HUSTLE: 2, PATIENCE: 5 }, quirk: 'Refuses to fly commercial', flavor: 'Knows every Midwestern founder over 60. Will not return a call from anyone under 40.', tenure: '12Y' },
  { id: 's2', name: 'Vanessa Ortiz', initials: 'VO', art: 's2', archetype: 'SOURCING', title: 'Principal · Healthcare Sourcing', cost: 4.5, sector: 'Healthcare', traits: { ROLODEX: 4, CHARM: 5, INSTINCT: 3, HUSTLE: 5, PATIENCE: 3 }, quirk: 'Always closes over dinner', flavor: 'Can turn a cold intro into a term sheet in eleven weeks.', tenure: '6Y' },
  { id: 's3', name: 'Theo Kowalski', initials: 'TK', art: 's3', archetype: 'SOURCING', title: 'VP · Proprietary Deal Flow', cost: 2.8, sector: 'Consumer', traits: { ROLODEX: 3, CHARM: 3, INSTINCT: 4, HUSTLE: 5, PATIENCE: 2 }, quirk: 'Sends 400 LinkedIn messages a week', flavor: 'No process is too small. No cold call too cold.', tenure: '3Y' },

  { id: 'd1', name: 'Rachel Chen', initials: 'RC', art: 'd1', archetype: 'DEAL_TEAM', title: 'Partner · Investment Committee', cost: 8.0, sector: 'Healthcare', traits: { MODELING: 3, DILIGENCE: 5, NEGOTIATION: 5, STAMINA: 3, JUDGMENT: 5 }, quirk: 'Kills 70% of deals she diligences', flavor: 'Will spot the one-time EBITDA adjustment on page 94 of the CIM.', tenure: '15Y' },
  { id: 'd2', name: 'David Kwon', initials: 'DK', art: 'd2', archetype: 'DEAL_TEAM', title: 'Principal · Execution', cost: 5.0, sector: 'Industrial', traits: { MODELING: 5, DILIGENCE: 4, NEGOTIATION: 3, STAMINA: 4, JUDGMENT: 3 }, quirk: 'Builds the model himself. Every time.', flavor: 'Fastest return-waterfall in the firm. Sometimes too fast.', tenure: '8Y' },
  { id: 'd3', name: 'Priya Raman', initials: 'PR', art: 'd3', archetype: 'DEAL_TEAM', title: 'VP · Execution', cost: 3.0, sector: 'HVAC Services', traits: { MODELING: 4, DILIGENCE: 4, NEGOTIATION: 3, STAMINA: 5, JUDGMENT: 4 }, quirk: 'Has not had a vacation since 2022', flavor: 'Runs the process. All of them. At the same time.', tenure: '5Y' },
  { id: 'd4', name: 'Jamie Fox', initials: 'JF', art: 'd4', archetype: 'DEAL_TEAM', title: 'Associate', cost: 1.5, sector: 'Generalist', traits: { MODELING: 4, DILIGENCE: 2, NEGOTIATION: 1, STAMINA: 5, JUDGMENT: 2 }, quirk: 'Still thinks the hours are fine', flavor: 'Will redo the model six times by Sunday if asked.', tenure: '1Y' },

  { id: 'o1', name: 'Gus Delacroix', initials: 'GD', art: 'o1', archetype: 'OPERATING', title: 'Operating Partner · CEO-in-Residence', cost: 5.5, sector: 'Industrial', traits: { LEADERSHIP: 5, COST_DISCIPLINE: 5, GROWTH_PLAYBOOK: 3, TECHNICAL: 4, EMPATHY: 1 }, quirk: "Known as 'The Landlord'", flavor: 'Three CEO seats in five years. Two of them were forced out.', tenure: '9Y' },
  { id: 'o2', name: 'Marisol Brand', initials: 'MB', art: 'o2', archetype: 'OPERATING', title: 'Operating Partner · Growth', cost: 4.2, sector: 'Consumer', traits: { LEADERSHIP: 4, COST_DISCIPLINE: 2, GROWTH_PLAYBOOK: 5, TECHNICAL: 3, EMPATHY: 4 }, quirk: 'Always pitches a rebrand', flavor: 'Took a 40-location chain to 180 before the LPs got nervous.', tenure: '6Y' },
  { id: 'o3', name: 'Huang Wei', initials: 'HW', art: 'o3', archetype: 'OPERATING', title: 'Operating Partner · Supply Chain', cost: 3.8, sector: 'Industrial', traits: { LEADERSHIP: 3, COST_DISCIPLINE: 4, GROWTH_PLAYBOOK: 2, TECHNICAL: 5, EMPATHY: 3 }, quirk: 'Carries a stopwatch onto plant floors', flavor: 'Can redesign a warehouse in a morning. Can break a union by lunch.', tenure: '7Y' },
]

export const ADVISORS: Advisor[] = [
  { id: 'a1', name: 'Big Four QoE', cost: 0.85, accuracy: 88, weeks: 3, finding: 'EBITDA Quality' },
  { id: 'a2', name: 'Bain Commercial DD', cost: 1.2, accuracy: 92, weeks: 4, finding: 'Market & Customers' },
  { id: 'a3', name: 'Tier-2 Legal DD', cost: 0.35, accuracy: 70, weeks: 2, finding: 'Legal & Reg' },
  { id: 'a4', name: 'Kirkland Legal DD', cost: 0.9, accuracy: 95, weeks: 3, finding: 'Legal & Reg' },
  { id: 'a5', name: 'IT / Cyber DD', cost: 0.25, accuracy: 75, weeks: 2, finding: 'Tech Risk' },
  { id: 'a6', name: 'Environmental (Phase I)', cost: 0.15, accuracy: 80, weeks: 1, finding: 'Env Liability' },
]

export const STARTING_PORTFOLIO: PortfolioCompany[] = [
  { id: 'pc1', name: 'Dominion Auto Glass', art: 'pc1_autoglass', sector: 'Consumer / Services', acquired: "Q2 '24", entryMultiple: 8.5, entryEbitda: 12.0, currentEbitda: 14.8, revenue: 78, leverage: 5.2, hold: 7, satisfaction: 62, layoffs: 180, lawsuits: 1, color: '#FF7A3C', levers: { priceIncrease: 18, mgmtTurnover: 2, addOns: 3, capexCut: 12 } },
  { id: 'pc2', name: 'Willow Senior Living', art: 'pc2_seniorliving', sector: 'Healthcare', acquired: "Q4 '23", entryMultiple: 10.2, entryEbitda: 6.5, currentEbitda: 7.1, revenue: 44, leverage: 6.8, hold: 9, satisfaction: 41, layoffs: 95, lawsuits: 3, color: '#FF3DA5', levers: { priceIncrease: 24, mgmtTurnover: 4, addOns: 1, capexCut: 28 } },
  { id: 'pc3', name: 'Talon Industrial Supply', art: 'pc3_industrial', sector: 'Industrial', acquired: "Q1 '25", entryMultiple: 6.8, entryEbitda: 18.2, currentEbitda: 19.0, revenue: 140, leverage: 4.9, hold: 3, satisfaction: 71, layoffs: 40, lawsuits: 0, color: '#8BE04E', levers: { priceIncrease: 6, mgmtTurnover: 1, addOns: 0, capexCut: 5 } },
]

// ── Helpers ────────────────────────────────────────────────────────
export const fmtMoney = (m: number): string => {
  if (Math.abs(m) >= 1000) return `$${(m / 1000).toFixed(1)}B`
  if (Math.abs(m) >= 1) return `$${m.toFixed(1)}M`
  return `$${(m * 1000).toFixed(0)}K`
}

// ── Fund state shape ─────────────────────────────────────────────────
export interface FundState {
  name: string
  vintage: string
  committed: number
  cash: number
  quarterNum: number
  quarter: string
  portfolio: PortfolioCompany[]
}

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
export function quarterLabel(n: number, vintage: string): string {
  const yearOffset = Math.floor((n - 1) / 4)
  const q = QUARTERS[(n - 1) % 4]
  const vy = parseInt(vintage, 10) + yearOffset
  return `${q} '${String(vy).slice(-2)}`
}

export function makeInitialFund(name: string, vintage: string): FundState {
  return {
    name,
    vintage,
    committed: 400,
    cash: 18.4,
    quarterNum: 5, // Y2 Q1
    quarter: quarterLabel(5, vintage),
    portfolio: STARTING_PORTFOLIO.map((p) => ({ ...p, levers: { ...p.levers } })),
  }
}
