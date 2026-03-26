import type { Sector } from '../types/game'
import { PRNG } from './prng'

const FUND_COLORS = [
  'Crimson', 'Azure', 'Slate', 'Obsidian', 'Ivory', 'Sterling', 'Iron',
  'Cobalt', 'Onyx', 'Amber', 'Verdant', 'Cerulean', 'Sable', 'Platinum',
  'Granite', 'Indigo', 'Copper', 'Silver', 'Carbon', 'Titanium',
] as const

const FUND_GEO_FEATURES = [
  'Ridge', 'Canyon', 'Harbor', 'Peak', 'Creek', 'Bluff', 'Shore',
  'Summit', 'Crest', 'Point', 'Mesa', 'Brook', 'Vale', 'Cliff',
  'Bay', 'Hollow', 'Glen', 'Arch', 'Gate', 'Terrace',
] as const

const FUND_SUFFIXES = [
  'Capital', 'Partners', 'Advisors', 'Investments', 'Group',
  'Equity', 'Management', 'Holdings',
] as const

const COMPANY_NAMES: Record<Sector, { prefixes: string[]; cores: string[]; suffixes: string[] }> = {
  Healthcare: {
    prefixes: ['Sunny', 'Bright', 'Premier', 'Comfort', 'Family', 'Golden', 'Horizon', 'Pinnacle', 'Radiant', 'Evergreen'],
    cores: ['Dental', 'Dermatology', 'Veterinary', 'Orthopedic', 'Vision', 'Wellness', 'Medical', 'Therapy', 'Urgent Care', 'Pediatric'],
    suffixes: ['Group', 'Associates', 'Partners', 'Care', 'Center', 'Clinics', 'Health', 'Services'],
  },
  BusinessServices: {
    prefixes: ['Apex', 'Summit', 'National', 'Allied', 'Precision', 'Continental', 'Prime', 'Integrated', 'Patriot', 'Vanguard'],
    cores: ['Staffing', 'Waste', 'Facilities', 'Logistics', 'Janitorial', 'Security', 'Payroll', 'Compliance', 'Fleet', 'Maintenance'],
    suffixes: ['Solutions', 'Services', 'Corp', 'Group', 'Systems', 'Management', 'Enterprises', 'Inc'],
  },
  Consumer: {
    prefixes: ['Fresh', 'Urban', 'Craft', 'Heritage', 'Local', 'Golden', 'True', 'Blue', 'Home', 'Modern'],
    cores: ['Kitchen', 'Fitness', 'Goods', 'Market', 'Grill', 'Bakery', 'Juice', 'Coffee', 'Burrito', 'Bowl'],
    suffixes: ['Co', 'House', 'Collective', 'Brand', 'Works', 'Company', 'Labs', 'Studio'],
  },
  Technology: {
    prefixes: ['Cloud', 'Data', 'Vertex', 'Logic', 'Net', 'Cyber', 'Pixel', 'Code', 'Bit', 'Sync'],
    cores: ['Point', 'Stack', 'Ware', 'Path', 'Bridge', 'Hub', 'Flow', 'Link', 'Base', 'Core'],
    suffixes: ['Systems', 'Tech', 'Software', 'IO', 'Labs', 'Digital', 'Platform', 'AI'],
  },
  Industrial: {
    prefixes: ['Sterling', 'Forge', 'Atlas', 'Pacific', 'Continental', 'Eagle', 'Titan', 'Anchor', 'Iron', 'Summit'],
    cores: ['Coatings', 'Packaging', 'Materials', 'Products', 'Components', 'Fasteners', 'Plastics', 'Metals', 'Chemicals', 'Adhesives'],
    suffixes: ['Inc', 'Corp', 'LLC', 'Industries', 'Manufacturing', 'Group', 'Enterprises', 'Works'],
  },
}

const SUB_SECTORS: Record<Sector, string[]> = {
  Healthcare: ['Dental Practices', 'Dermatology Clinics', 'Veterinary Clinics', 'Orthopedic Centers', 'Vision Care', 'Urgent Care', 'Physical Therapy', 'Behavioral Health'],
  BusinessServices: ['Staffing & Recruiting', 'Waste Management', 'Facilities Services', 'Fleet Management', 'Compliance Services', 'Security Services', 'Janitorial Services', 'Landscaping'],
  Consumer: ['Fast-Casual Restaurants', 'Fitness & Wellness', 'Specialty Retail', 'Coffee & Beverage', 'Pet Services', 'Home Services', 'Beauty & Personal Care', 'Food & Beverage'],
  Technology: ['Vertical SaaS', 'IT Managed Services', 'Cybersecurity', 'Data Analytics', 'ERP Solutions', 'FinTech', 'HealthTech', 'EdTech'],
  Industrial: ['Specialty Chemicals', 'Packaging', 'Building Products', 'Precision Components', 'Metal Fabrication', 'Plastics & Composites', 'Industrial Distribution', 'Environmental Services'],
}

const DESCRIPTIONS: Record<Sector, string[]> = {
  Healthcare: [
    'Multi-location practice with strong patient retention and growing referral network.',
    'Regional provider with loyal patient base and experienced clinical staff.',
    'Established practice group with consistent same-store growth and expansion opportunities.',
    'High-acuity provider with favorable payer mix and strong physician relationships.',
    'Community-focused practice with multiple locations and de novo expansion runway.',
  ],
  BusinessServices: [
    'Asset-light service provider with long-term contracts and high switching costs.',
    'Regional leader with strong customer relationships and recurring revenue base.',
    'Specialized services provider with fragmented competitor landscape and consolidation opportunity.',
    'Route-based business with predictable cash flows and geographic density advantages.',
    'Diversified service platform with cross-sell opportunities and embedded customer base.',
  ],
  Consumer: [
    'Cult-following brand with strong unit economics and whitespace for expansion.',
    'Multi-unit operator with proven concept and franchise development pipeline.',
    'Differentiated consumer concept with loyal customer base and growing brand awareness.',
    'Emerging brand with strong same-store sales growth and attractive store-level margins.',
    'Regional chain with expansion-ready concept and strong digital presence.',
  ],
  Technology: [
    'Vertical SaaS platform with high retention, sticky workflows, and expansion revenue.',
    'Mission-critical software with 95%+ gross retention and growing ARR.',
    'Managed service provider with long-term contracts and embedded customer relationships.',
    'B2B software platform with strong NRR and large addressable market.',
    'Cloud-native platform with product-led growth and improving unit economics.',
  ],
  Industrial: [
    'Niche manufacturer with proprietary formulations and long-standing customer relationships.',
    'Specialty producer with high barriers to entry and mission-critical applications.',
    'Regional manufacturer with capacity expansion opportunity and favorable input cost trends.',
    'Diversified industrial platform with aftermarket services and recurring revenue streams.',
    'Precision components supplier with sole-source customer positions and technical moats.',
  ],
}

export function generateFundName(prng: PRNG): string {
  const color = prng.pick(FUND_COLORS)
  const geo = prng.pick(FUND_GEO_FEATURES)
  const suffix = prng.pick(FUND_SUFFIXES)
  return `${color} ${geo} ${suffix}`
}

export function generateCompanyName(prng: PRNG, sector: Sector): string {
  const names = COMPANY_NAMES[sector]
  const prefix = prng.pick(names.prefixes)
  const core = prng.pick(names.cores)
  const suffix = prng.pick(names.suffixes)
  return `${prefix} ${core} ${suffix}`
}

export function getRandomSubSector(prng: PRNG, sector: Sector): string {
  return prng.pick(SUB_SECTORS[sector])
}

export function getRandomDescription(prng: PRNG, sector: Sector): string {
  return prng.pick(DESCRIPTIONS[sector])
}
