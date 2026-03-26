import { PRNG } from './prng'

export interface PortraitConfig {
  faceShape: number
  skinTone: string
  hairStyle: number
  hairColor: string
  eyeShape: number
  clothing: number
  hasGlasses: boolean
  accessory: number
}

const SKIN_TONES = ['#f5d0a9', '#d4a574', '#c68642', '#8d5524', '#5c3317', '#f3c9a0', '#e6b98a', '#b07540']
const HAIR_COLORS = ['#2c1810', '#4a3728', '#8b7355', '#c4a777', '#d4a017', '#8b4513', '#1a1a1a', '#8e8e8e']

export function generatePortraitConfig(seed: number): PortraitConfig {
  const prng = new PRNG(seed)
  return {
    faceShape: prng.nextInt(0, 3),
    skinTone: prng.pick(SKIN_TONES),
    hairStyle: prng.nextInt(0, 9),
    hairColor: prng.pick(HAIR_COLORS),
    eyeShape: prng.nextInt(0, 4),
    clothing: prng.nextInt(0, 5),
    hasGlasses: prng.chance(0.3),
    accessory: prng.nextInt(0, 3),
  }
}

/**
 * Generate SVG string for a character portrait.
 * Uses the Bloomberg terminal palette (green/amber/white on dark).
 */
export function renderPortraitSVG(
  config: PortraitConfig,
  expression: string,
  characterType: string,
): string {
  const size = 128
  const cx = size / 2
  const cy = size / 2

  // Face dimensions by shape
  const faceW = [48, 44, 42, 50][config.faceShape]
  const faceH = [56, 60, 54, 52][config.faceShape]

  // Expression-specific elements
  const eyeY = cy - 8
  const mouthY = cy + 14
  let eyeL = '', eyeR = '', mouth = '', brows = ''

  switch (expression) {
    case 'angry':
    case 'hostile':
      eyeL = `<ellipse cx="${cx - 12}" cy="${eyeY}" rx="4" ry="3" fill="#00ff88"/>`
      eyeR = `<ellipse cx="${cx + 12}" cy="${eyeY}" rx="4" ry="3" fill="#00ff88"/>`
      mouth = `<path d="M${cx - 10} ${mouthY + 2} Q${cx} ${mouthY - 4} ${cx + 10} ${mouthY + 2}" stroke="#00ff88" fill="none" stroke-width="1.5"/>`
      brows = `<line x1="${cx - 18}" y1="${eyeY - 9}" x2="${cx - 7}" y2="${eyeY - 7}" stroke="#00ff88" stroke-width="1.5"/><line x1="${cx + 7}" y1="${eyeY - 7}" x2="${cx + 18}" y2="${eyeY - 9}" stroke="#00ff88" stroke-width="1.5"/>`
      break
    case 'pleased':
    case 'grateful':
    case 'satisfied':
    case 'proud':
      eyeL = `<ellipse cx="${cx - 12}" cy="${eyeY}" rx="4" ry="3.5" fill="#00ff88"/>`
      eyeR = `<ellipse cx="${cx + 12}" cy="${eyeY}" rx="4" ry="3.5" fill="#00ff88"/>`
      mouth = `<path d="M${cx - 10} ${mouthY} Q${cx} ${mouthY + 6} ${cx + 10} ${mouthY}" stroke="#00ff88" fill="none" stroke-width="1.5"/>`
      brows = `<line x1="${cx - 17}" y1="${eyeY - 8}" x2="${cx - 7}" y2="${eyeY - 9}" stroke="#00ff88" stroke-width="1"/><line x1="${cx + 7}" y1="${eyeY - 9}" x2="${cx + 17}" y2="${eyeY - 8}" stroke="#00ff88" stroke-width="1"/>`
      break
    case 'nervous':
    case 'concerned':
    case 'stressed':
    case 'overwhelmed':
      eyeL = `<ellipse cx="${cx - 12}" cy="${eyeY}" rx="5" ry="4" fill="#00ff88"/>`
      eyeR = `<ellipse cx="${cx + 12}" cy="${eyeY}" rx="5" ry="4" fill="#00ff88"/>`
      mouth = `<path d="M${cx - 8} ${mouthY + 1} Q${cx} ${mouthY - 2} ${cx + 8} ${mouthY + 1}" stroke="#ffb700" fill="none" stroke-width="1.5"/>`
      brows = `<line x1="${cx - 16}" y1="${eyeY - 10}" x2="${cx - 8}" y2="${eyeY - 7}" stroke="#ffb700" stroke-width="1.5"/><line x1="${cx + 8}" y1="${eyeY - 7}" x2="${cx + 16}" y2="${eyeY - 10}" stroke="#ffb700" stroke-width="1.5"/>`
      break
    case 'skeptical':
    case 'calculating':
    case 'probing':
      eyeL = `<ellipse cx="${cx - 12}" cy="${eyeY}" rx="4" ry="2.5" fill="#00ff88"/>`
      eyeR = `<ellipse cx="${cx + 12}" cy="${eyeY}" rx="5" ry="3.5" fill="#00ff88"/>`
      mouth = `<line x1="${cx - 8}" y1="${mouthY}" x2="${cx + 8}" y2="${mouthY}" stroke="#00ff88" stroke-width="1.5"/>`
      brows = `<line x1="${cx - 17}" y1="${eyeY - 7}" x2="${cx - 7}" y2="${eyeY - 9}" stroke="#00ff88" stroke-width="1.5"/><line x1="${cx + 7}" y1="${eyeY - 8}" x2="${cx + 17}" y2="${eyeY - 10}" stroke="#00ff88" stroke-width="1.5"/>`
      break
    default: // neutral
      eyeL = `<ellipse cx="${cx - 12}" cy="${eyeY}" rx="4" ry="3" fill="#00ff88"/>`
      eyeR = `<ellipse cx="${cx + 12}" cy="${eyeY}" rx="4" ry="3" fill="#00ff88"/>`
      mouth = `<line x1="${cx - 8}" y1="${mouthY}" x2="${cx + 8}" y2="${mouthY}" stroke="#00ff88" stroke-width="1.5"/>`
      brows = `<line x1="${cx - 16}" y1="${eyeY - 8}" x2="${cx - 7}" y2="${eyeY - 8}" stroke="#00ff88" stroke-width="1"/><line x1="${cx + 7}" y1="${eyeY - 8}" x2="${cx + 16}" y2="${eyeY - 8}" stroke="#00ff88" stroke-width="1"/>`
  }

  // Hair (simplified - just a shape on top)
  const hairY = cy - faceH / 2 - 4
  const hair = config.hairStyle < 8
    ? `<ellipse cx="${cx}" cy="${hairY}" rx="${faceW / 2 + 2}" ry="12" fill="#00ff88" opacity="0.3"/>`
    : '' // bald

  // Glasses
  const glasses = config.hasGlasses
    ? `<circle cx="${cx - 12}" cy="${eyeY}" r="7" stroke="#ffb700" fill="none" stroke-width="1"/><circle cx="${cx + 12}" cy="${eyeY}" r="7" stroke="#ffb700" fill="none" stroke-width="1"/><line x1="${cx - 5}" y1="${eyeY}" x2="${cx + 5}" y2="${eyeY}" stroke="#ffb700" stroke-width="0.5"/>`
    : ''

  // Clothing indicator at bottom
  const clothingColor = characterType === 'consultant' ? '#ffb700' : characterType === 'lawyer' ? '#6b6b7b' : '#1e1e2e'
  const clothing = `<rect x="${cx - 30}" y="${cy + 28}" width="60" height="20" rx="4" fill="${clothingColor}" opacity="0.5"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#0a0a0f" rx="8"/>
    ${clothing}
    <ellipse cx="${cx}" cy="${cy}" rx="${faceW / 2}" ry="${faceH / 2}" fill="none" stroke="#00ff88" stroke-width="1.5" opacity="0.6"/>
    ${hair}
    ${brows}
    ${eyeL}${eyeR}
    ${mouth}
    ${glasses}
  </svg>`
}
