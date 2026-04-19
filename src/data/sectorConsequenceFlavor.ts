import type { PortfolioCompany } from '../types/company'
import type { Sector } from '../types/game'

const BACKLASH_SUBJECTS: Record<Sector, string[]> = {
  Healthcare: [
    'patients are complaining about shorter visits and harder scheduling',
    'local dentists and former clinicians are talking openly about churn',
    'community Facebook groups keep posting before-and-after service horror stories',
  ],
  BusinessServices: [
    'workers are talking about thinner crews and worse shift coverage',
    'customers are noticing that the service contract still says premium while the experience says cheapest bidder',
    'municipal clients are asking why response times suddenly feel outsourced to vibes',
  ],
  Consumer: [
    'customers are posting side-by-side price hikes and smaller portions',
    'the comments are full of regulars saying the brand no longer feels local',
    'reviews now read like field reports from a cost-engineering exercise',
  ],
  Technology: [
    'customers are filing tickets about slower support and shakier releases',
    'user communities are asking why the roadmap became a pricing page',
    'power users have started counting the things that broke after the latest efficiency push',
  ],
  Industrial: [
    'plant workers are talking about deferred maintenance and thin staffing',
    'buyers are asking why lead times are slipping while prices are not',
    'local officials are hearing more complaints about safety, noise, and missed commitments',
  ],
}

const LAYOFF_PRESS_QUOTES: Record<Sector, string[]> = {
  Healthcare: [
    '"Private equity cuts staff at neighborhood care provider as wait times rise."',
    '"Beloved clinic chain trims front-desk and hygienist support after ownership shake-up."',
  ],
  BusinessServices: [
    '"Service workers cut as PE-backed operator promises streamlined delivery model."',
    '"Regional staffing platform sheds recruiters while calling it a productivity reset."',
  ],
  Consumer: [
    '"Restaurant chain cuts hours and staff while menu prices move the other direction."',
    '"Local favorite now runs leaner staffing model, customers say leaner is underselling it."',
  ],
  Technology: [
    '"Software firm lays off support and implementation teams after sponsor-led efficiency drive."',
    '"PE-backed SaaS company cuts customer success headcount and calls it AI enablement."',
  ],
  Industrial: [
    '"Manufacturer reduces plant headcount during margin improvement program."',
    '"Factory workers cut as owners promise world-class operational discipline."',
  ],
}

const QUALITY_CRISIS_TEXT: Record<Sector, string[]> = {
  Healthcare: [
    'Patient complaints spiked after staffing cuts and workflow changes. Referrals are slowing and clinicians are furious.',
    'Care quality slipped across multiple locations. Reviews mention rushed appointments and overbooked calendars.',
  ],
  BusinessServices: [
    'Service quality deteriorated in the field. Customers are escalating missed coverage, sloppy execution, and contract frustration.',
    'Execution faltered after a lean staffing push. The business is now eating service credits and reputational damage.',
  ],
  Consumer: [
    'Online reviews cratered after price hikes met worse in-store experience. The brand is getting memed in public.',
    'Customers are describing the product as more expensive, smaller, and somehow sadder.',
  ],
  Technology: [
    'Support queues blew out and product stability slipped. Customers are openly discussing churn.',
    'The latest release turned your efficiency story into an uptime problem.',
  ],
  Industrial: [
    'Quality escapes reached customers and procurement teams are asking pointed questions.',
    'A production shortcut became a visible defect problem. The phone is ringing for the wrong reasons.',
  ],
}

const REGULATORY_TEXT: Record<Sector, string[]> = {
  Healthcare: [
    'State regulators opened inquiries into billing, staffing, and patient-care protocols.',
    'The company is now explaining its care model to people with subpoena power.',
  ],
  BusinessServices: [
    'Labor and contract-compliance questions are now formal instead of rumor-shaped.',
    'Regulators are asking whether the new operating model still matches what clients were sold.',
  ],
  Consumer: [
    'Local authorities are looking into labor, pricing, and consumer complaints.',
    'The company is learning that consumer backlash sometimes graduates into official interest.',
  ],
  Technology: [
    'Data-handling and customer-commitment questions have turned into an actual compliance issue.',
    'The regulator read the SLA, then read the outage history, then scheduled a meeting.',
  ],
  Industrial: [
    'Plant safety and environmental compliance are now front-page management issues.',
    'Inspectors would like to discuss maintenance decisions that used to live quietly in the model.',
  ],
}

const CUSTOMER_LOSS_TEXT: Record<Sector, string[]> = {
  Healthcare: [
    'A large referral source stopped sending patients after service levels slipped.',
    'An insurer and several physicians decided this operator was no longer worth defending.',
  ],
  BusinessServices: [
    'A major contract client walked after deciding lower service quality was not actually a feature.',
    'A key account churned and took several reference calls with it.',
  ],
  Consumer: [
    'Regulars voted with their feet. The company is discovering the downside of teaching customers to compare receipts.',
    'Traffic fell off after the latest pricing move. Loyalty turned out to be conditional.',
  ],
  Technology: [
    'A flagship customer churned after too many support tickets became apology calls.',
    'The account that everyone said was sticky has become an ex-customer.',
  ],
  Industrial: [
    'A major buyer shifted volume to another supplier after quality and delivery issues compounded.',
    'The customer did not renew because procurement finally got tired of operational surprises.',
  ],
}

const EMPLOYEE_EXODUS_TEXT: Record<Sector, string[]> = {
  Healthcare: [
    'Nurses, hygienists, and office leads started leaving in clusters. Patients noticed immediately.',
    'Clinical staff turnover is now the kind of metric people talk about in parking lots.',
  ],
  BusinessServices: [
    'Field supervisors and recruiters left faster than management could rewrite the org chart.',
    'The company pushed productivity hard enough that the people who make the service real walked.',
  ],
  Consumer: [
    'Store-level managers and experienced crew members started quitting in waves.',
    'The labor model finally met the fact that hospitality is still a people business.',
  ],
  Technology: [
    'Senior engineers and customer-success leads took the recruiter calls.',
    'The people who knew how the product actually works have updated LinkedIn first and documentation second.',
  ],
  Industrial: [
    'Shift leads and maintenance talent are leaving, which is the expensive kind of attrition.',
    'The plant lost people who knew which machine noises matter.',
  ],
}

const HEALTHY_FATES: Record<Sector, string[]> = {
  Healthcare: [
    '{name} kept expanding locations and patient volume under new ownership without visibly breaking the care model.',
    '{name} became a rare clinic platform people referenced without immediately rolling their eyes.',
  ],
  BusinessServices: [
    '{name} kept winning contracts because the service actually held together after your exit.',
    '{name} scaled into a broader regional platform and customers mostly noticed better execution, not just better margins.',
  ],
  Consumer: [
    '{name} grew into new neighborhoods without losing the parts customers originally liked.',
    '{name} managed the rare trick of becoming more efficient without feeling spiritually focus-grouped.',
  ],
  Technology: [
    '{name} kept shipping product and support stayed credible, which made the next owner look smart.',
    '{name} expanded ARR without turning every customer conversation into a renegotiation fight.',
  ],
  Industrial: [
    '{name} added capacity and kept quality intact, which buyers and line workers both noticed.',
    '{name} grew into a stronger platform because the plant stayed disciplined in the boring, useful way.',
  ],
}

const MIXED_FATES: Record<Sector, string[]> = {
  Healthcare: [
    '{name} survived under new ownership, though patients and former staff still talk about the PE years like weather damage.',
    '{name} kept operating with mixed outcomes: better systems, thinner staffing, and a reputation that never fully reset.',
  ],
  BusinessServices: [
    '{name} kept the contracts but lost some of the goodwill that made the contracts easy to renew in the first place.',
    '{name} still exists, though customers describe it as more optimized and less reliable.',
  ],
  Consumer: [
    '{name} survived, but customers kept comparing the current brand to the one they remember from before the model got involved.',
    '{name} found a new owner who liked the EBITDA more than the online reviews.',
  ],
  Technology: [
    '{name} continued operating, though customers now treat support promises like genre fiction.',
    '{name} remained sellable, but every diligence session drifted toward churn, fatigue, and roadmap trust.',
  ],
  Industrial: [
    '{name} kept running, though procurement teams still remember the stretch where quality felt optional.',
    '{name} stabilized after the sale, but operators spent real time undoing earlier shortcuts.',
  ],
}

const STRIPMINED_FATES: Record<Sector, string[]> = {
  Healthcare: [
    '{name} became shorthand for what happens when a care network gets run like a debt instrument.',
    'Former staff from {name} still swap stories about the years when every staffing decision felt sponsor-approved.',
  ],
  BusinessServices: [
    '{name} kept the spreadsheets tidy and the field operations miserable right up until customers had enough.',
    '{name} is now used in sales pitches by competitors as a warning rather than a comp.',
  ],
  Consumer: [
    '{name} turned into a case study in how to trade loyalty for margin one smaller portion at a time.',
    '{name} lost the room with customers long before the quarterly numbers admitted it.',
  ],
  Technology: [
    '{name} extracted more cash from the customer base than trust could realistically support.',
    '{name} became one of those B2B tools users describe with the phrase "it got private-equitied."',
  ],
  Industrial: [
    '{name} spent too long pretending deferred maintenance was a capital-allocation strategy.',
    '{name} proved that plant-level shortcuts can absolutely flow through to enterprise value, just not in the direction you wanted.',
  ],
}

const POSITIVE_PULSES: Record<Sector, string[]> = {
  Healthcare: [
    'Patients are still referring friends and clinicians have not fully lost faith in the operating model.',
    'The practice still feels local enough that people tolerate the back-office standardization.',
  ],
  BusinessServices: [
    'Customers still believe the crews showing up understand the work, not just the margin plan.',
    'The service holds together in the field, which buys you more forgiveness than the deck ever could.',
  ],
  Consumer: [
    'Customers still feel like the brand is worth choosing, not merely extracting from.',
    'The business still has regulars, not just transactions.',
  ],
  Technology: [
    'Users still trust the product and support org enough to forgive a few finance-shaped decisions.',
    'The roadmap remains credible enough that customers keep renewing before complaining.',
  ],
  Industrial: [
    'Operators still trust the plant and buyers still trust the quality line.',
    'The business still feels run by people who know what a bad shortcut costs.',
  ],
}

function pickByHash(items: string[], hash: number): string {
  return items[Math.abs(hash) % items.length]
}

export function getLayoffPressQuote(company: PortfolioCompany, hash: number): string {
  return pickByHash(LAYOFF_PRESS_QUOTES[company.sector], hash)
}

export function getMainStreetBacklashDescription(company: PortfolioCompany, hash: number): string {
  const subject = pickByHash(BACKLASH_SUBJECTS[company.sector], hash)
  return `${company.name} is drawing concentrated blowback: ${subject}. The ownership story is now part of the brand.`
}

export function getQualityCrisisDescription(company: PortfolioCompany, hash: number): string {
  return `${company.name}: ${pickByHash(QUALITY_CRISIS_TEXT[company.sector], hash)}`
}

export function getRegulatoryActionDescription(company: PortfolioCompany, hash: number): string {
  return `${company.name}: ${pickByHash(REGULATORY_TEXT[company.sector], hash)}`
}

export function getCustomerLossDescription(company: PortfolioCompany, hash: number): string {
  return `${company.name}: ${pickByHash(CUSTOMER_LOSS_TEXT[company.sector], hash)}`
}

export function getEmployeeExodusDescription(company: PortfolioCompany, hash: number): string {
  return `${company.name}: ${pickByHash(EMPLOYEE_EXODUS_TEXT[company.sector], hash)}`
}

export function getSectorPostExitFate(
  company: PortfolioCompany,
  outcome: 'healthy' | 'mixed' | 'stripMined',
  hash: number,
): string {
  const templates =
    outcome === 'healthy'
      ? HEALTHY_FATES[company.sector]
      : outcome === 'stripMined'
        ? STRIPMINED_FATES[company.sector]
        : MIXED_FATES[company.sector]

  return pickByHash(templates, hash).replace('{name}', company.name)
}

export function getCommunityPulseLine(company: PortfolioCompany, hash: number): string {
  if (company.communityTrust >= 60 && company.consequenceLedger.growthInvestments > 0) {
    return pickByHash(POSITIVE_PULSES[company.sector], hash)
  }

  if (
    company.communityTrust < 45
    || company.consequenceLedger.layoffs > 0
    || company.consequenceLedger.priceHikes > 0
    || company.consequenceLedger.dividendRecaps > 0
  ) {
    return pickByHash(BACKLASH_SUBJECTS[company.sector], hash)
  }

  return pickByHash(POSITIVE_PULSES[company.sector], hash)
}
