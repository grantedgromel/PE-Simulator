export const LOADING_TIPS = [
  'EBITDA is just a number until someone pays you for it.',
  "If you're not levered, are you even trying?",
  'Synergies are always 18 months away.',
  'The best time to exit was last quarter. The second best time is before the next recession.',
  "Your portfolio company's Glassdoor rating is not a KPI. Unless it is.",
  'A dividend recap a day keeps the J-curve at bay.',
  'Operational excellence: noun. The art of doing more with fewer people.',
  'Every great platform started as a single overpriced acquisition.',
  "Management rollover: when the CEO bets on themselves, with your money.",
  "If the bankers are calling you, the deal is probably picked over.",
  "Remember: you're not firing anyone. You're 'right-sizing the organization.'",
  'Due diligence: the art of finding problems you\'ll ignore anyway.',
  "Your LP's patience is inversely proportional to their commitment size.",
  'The consultant\'s deck has 200 slides. Slide 1 and slide 200 say the same thing.',
  'A good operating partner is worth their weight in carry points.',
  "In PE, 'aligned incentives' means everyone makes money, but not equally.",
  'The only thing worse than losing a deal is winning it at the wrong price.',
  'Continuation vehicles: when you can\'t sell it, buy it from yourself.',
  "Your portfolio company CEO's LinkedIn bio now says 'PE-backed growth leader.'",
  "The placement agent's job is to make your fund sound like the fund you wish you had.",
  'Fundraising tip: DPI talks, TVPI walks.',
  'The associate just built a 47-tab Excel model. Nobody will open tabs 3 through 46.',
]

export const LP_SPIN_PHRASES = [
  'The company is navigating near-term headwinds while positioning for long-term value creation.',
  'We view the current performance as transitional and expect inflection in the coming quarters.',
  'Management is executing on a comprehensive operational improvement plan.',
  'The asset represents a compelling risk-adjusted opportunity at current marks.',
  'We are actively exploring strategic alternatives to maximize value for all stakeholders.',
]

export const CONSULTANT_FLAVOR = [
  'Key finding: "There is significant opportunity to optimize the cost structure." (You already knew this.)',
  'The 200-page report recommends "leveraging core competencies for sustainable growth." Fee: $2.4M.',
  'Consultants identified that the company should "focus on its customers." Revolutionary.',
  'After 8 weeks of interviews, the consultants recommended exactly what you told them in the kickoff meeting.',
]

export const BANKER_FLAVOR = [
  '"This is a truly proprietary opportunity." (It is not.)',
  '"We\'re running a very limited process." (They called everyone.)',
  '"The seller is highly motivated." (They\'ve been trying to sell for two years.)',
  '"EBITDA is inflecting." (It went up once.)',
]

export const POST_EXIT_FATES_EXPANDED = {
  healthy: [
    '{name} continued to grow under new ownership. Expanded to new markets.',
    '{name} was acquired by a Fortune 500 company and integrated into their platform.',
    '{name}\'s revenue doubled within three years of your exit. The new owners are grateful.',
    '{name}\'s employees organized a "farewell PE" party. Attendance was enthusiastic.',
  ],
  stripMined: [
    '{name} filed for Chapter 11 protection 18 months after your exit. {employees} employees affected.',
    '{name} closed {pct}% of locations under new management. Former employees blamed cost cuts.',
    '{name}\'s former CEO wrote a LinkedIn post titled "What I Learned From Being Acquired by PE." It has 47,000 likes.',
    '{name} was acquired for parts. The brand no longer exists.',
    'Three former employees of {name} left Glassdoor reviews. Average: 1.4 stars.',
    '{name}\'s founder used their proceeds to open a small bakery. They seem happy.',
  ],
  neutral: [
    '{name} was rolled into a 47-location platform. No one remembers the original name.',
    '{name} continued operating with mixed results under new ownership.',
    '{name} was featured in a PE case study at HBS. The protagonist is not the hero.',
    '{name}\'s new PE owners immediately hired the same consultant you used. Results were similar.',
    '{name}\'s former employees started a competing business. It\'s doing well.',
  ],
  writtenOff: [
    '{name} was liquidated. Assets were sold to satisfy creditors. {employees} employees were let go.',
    '{name} closed permanently. The building is now a CVS.',
  ],
}

export const LEGACY_STATEMENTS: Record<string, string> = {
  'S-S': 'You proved that exceptional returns and responsible stewardship aren\'t mutually exclusive. Your LPs are wealthy and your portfolio companies are thriving.',
  'S-A': 'Outstanding returns with businesses that mostly survived the experience. Your LPs will be back.',
  'S-B': 'Exceptional returns, but the businesses paid a price. Your LPs don\'t ask about morale.',
  'S-F': 'Your LPs are delighted. Your portfolio companies\' former employees are not. You built a fortune on a trail of "operational efficiency."',
  'A-S': 'Strong returns with genuine value creation. The rare GP who left things better than they found them.',
  'A-A': 'Strong, sustainable returns with businesses that survived the experience. Not flashy, but your LPs and employees would both take your call.',
  'B-B': 'Solid mid-market returns. The businesses are fine. Nobody will write a case study about you, and that\'s probably fine.',
  'C-C': 'Mediocre returns, mediocre impact. The PE equivalent of a participation trophy.',
  'D-F': 'Poor returns AND the businesses collapsed. The worst of both worlds.',
  'F-F': 'You lost money and the businesses collapsed. Consider a career in consulting.',
}

export function getLegacyStatement(returnGrade: string, humanGrade: string): string {
  const key = `${returnGrade}-${humanGrade}`
  return LEGACY_STATEMENTS[key] ?? LEGACY_STATEMENTS[`${returnGrade}-C`] ?? 'Your PE career is complete. The results speak for themselves.'
}

export function getRandomTip(): string {
  return LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]
}
