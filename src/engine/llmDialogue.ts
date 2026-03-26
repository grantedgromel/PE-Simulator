import type { GameState } from '../types/game'
import type { DialogueCharacter } from './dialogueEngine'

// === DIALOGUE PROVIDER INTERFACE ===

export interface DialogueContext {
  interactionType: string
  gameStateSummary: string
  conversationHistory: { speaker: 'character' | 'player'; text: string }[]
  exchangeCount: number
  maxExchanges: number
  characterRelationship: number
}

export interface DialogueOutput {
  text: string
  expression: string
  isTerminal: boolean
}

export interface DialogueProvider {
  generateLine(
    character: DialogueCharacter,
    context: DialogueContext,
    playerChoice?: string,
  ): Promise<DialogueOutput>
}

// === GAME STATE SERIALIZER ===

export function serializeGameContext(
  state: GameState,
  interactionType: string,
  entityContext: Record<string, unknown>,
): string {
  const base = [
    `Fund: ${state.fund.name} (Fund ${['I', 'II', 'III'][state.currentFundCycle - 1]}, $${state.fund.committedCapital}M, ${state.fund.sector})`,
    `Period: Year ${state.currentYear}, Q${state.currentQuarter}. Reputation: ${state.fund.reputationScore}/100.`,
    `Portfolio: ${state.portfolioCompanies.filter(c => c.status === 'Active').length} active companies. ${state.exitedCompanies.length} exits, ${state.writtenOffCompanies.length} write-offs.`,
  ]

  if (state.fund.netMoic !== null) {
    base.push(`Net MOIC: ${state.fund.netMoic.toFixed(1)}x. DPI: ${state.fund.dpi.toFixed(1)}x. GP Carry: $${state.fund.gpTotalCarry.toFixed(1)}M.`)
  }

  // Context-specific details
  switch (interactionType) {
    case 'deal_won': {
      const co = entityContext
      base.push(`Deal: Acquiring ${co.companyName}. Revenue $${co.revenue}M, EBITDA $${co.ebitda}M.`)
      if (co.playerBid) base.push(`Player bid: ${co.playerBid}x. Asking: ${co.askingMultiple}x.`)
      // Track record of past actions
      const costCuts = state.portfolioCompanies.filter(c => c.costCutCount > 0).length
      if (costCuts > 0) base.push(`Player has cut costs at ${costCuts} portfolio companies.`)
      const avgMorale = state.portfolioCompanies.length > 0
        ? Math.round(state.portfolioCompanies.reduce((s, c) => s + c.morale, 0) / state.portfolioCompanies.length)
        : 0
      if (avgMorale > 0) base.push(`Average portfolio company morale: ${avgMorale}/100.`)
      break
    }
    case 'lp_report': {
      const underperformers = state.portfolioCompanies.filter(c =>
        c.status === 'Active' && c.quartersHeld > 4 && c.currentImpliedValuation < c.entryEquity * 1.5
      )
      if (underperformers.length > 0) {
        base.push(`Underperforming companies: ${underperformers.map(c => c.name).join(', ')}.`)
      }
      base.push(`LP Trust: ${state.fund.lpTrustScore}/100.`)
      break
    }
    case 'team_poaching': {
      const member = entityContext
      base.push(`Team member: ${member.memberName}, ${member.role}. Tenure: ${member.tenureQuarters}Q.`)
      base.push(`Their carry allocation: ${member.carryPct}%. Morale: ${member.morale}/100.`)
      if (entityContext.competitorName) base.push(`Competitor: ${entityContext.competitorName}.`)
      break
    }
    case 'covenant_breach': {
      base.push(`Company: ${entityContext.companyName}. EBITDA: $${entityContext.ebitda}M. Covenant threshold: $${entityContext.threshold}M.`)
      base.push(`Leverage: ${entityContext.leverageRatio}x. Debt: $${entityContext.totalDebt}M.`)
      break
    }
    case 'pr_crisis': {
      base.push(`Company: ${entityContext.companyName}. Cost cuts: ${entityContext.costCutCount}. Morale: ${entityContext.morale}/100.`)
      break
    }
  }

  return base.join('\n')
}

// === SYSTEM PROMPTS ===

export function getSystemPrompt(character: DialogueCharacter, context: DialogueContext): string {
  const baseRules = `Rules:
- Respond in 2-3 sentences maximum.
- Stay in character. Never break the fourth wall or reference being in a game or being an AI.
- End your response with an expression tag in square brackets from the options provided.`

  switch (character.characterType) {
    case 'seller':
      return `You are ${character.name}, a business owner selling your company to a private equity fund.
You built this business over many years and care deeply about your employees and customers.
You are cautious about PE buyers — you've heard stories about cost-cutting and layoffs.

${context.gameStateSummary}

${baseRules}
- If the buyer has a history of cost-cutting or low morale at other companies, reference it naturally.
- Your emotional state reflects the negotiation: hopeful if they promise growth, worried if they focus on "efficiency."
- Expression options: [eager] [cautious] [reluctant] [heartbroken] [grateful]`

    case 'lp':
      return `You are ${character.name}, ${character.title}. You are a limited partner (LP) investor in this PE fund.
You are professional, measured, and data-driven. LPs don't yell — they get quiet when unhappy.
You care most about: cash distributions (DPI), net returns, and transparency.

${context.gameStateSummary}

${baseRules}
- If DPI is low (below 1.0x), ask about cash distributions specifically.
- If the GP seems to be spinning bad performance, express skepticism.
- If performance is strong, be supportive but maintain professional distance.
- Expression options: [interested] [skeptical] [impressed] [ice-cold]`

    case 'lawyer':
      return `You are ${character.name}, ${character.title}. You are advising a PE fund on a covenant breach situation.
You are precise, measured, and professional. You present options clearly with costs and probabilities.
You bill at $1,500/hour and are worth every penny (in your opinion).

${context.gameStateSummary}

${baseRules}
- Present legal options clearly with estimated costs and success probabilities.
- Be slightly alarmed but not panicked — you've seen this before.
- Expression options: [measured] [alarmed] [calculating]`

    case 'consultant':
      return `You are ${character.name}, ${character.title}. You are a management consultant presenting findings to a PE fund.
You are supremely confident regardless of whether your findings are useful.
You speak in consulting jargon: "key learnings," "strategic imperatives," "operational excellence."

${context.gameStateSummary}

${baseRules}
- Be confident no matter what. Even if your advice is generic, present it as groundbreaking.
- If challenged, recommend a follow-up engagement.
- Expression options: [over_confident] [presenting] [confused]`

    case 'journalist':
      return `You are ${character.name}, a business reporter investigating a PE-owned company.
You are professional but persistent. You want a comment for your story.
You have sources — former employees who have shared their experiences.

${context.gameStateSummary}

${baseRules}
- Be direct. You're on deadline.
- If they give "no comment," note the story runs regardless.
- If they're transparent, acknowledge the rarity of candor in the industry.
- Expression options: [neutral] [probing] [hostile]`

    case 'team':
      return `You are ${character.name}, a team member at a PE fund. You are having an honest conversation with the managing partner.
You are professional but this is personal — it's about your career and compensation.

${context.gameStateSummary}

${baseRules}
- Be honest about your motivations: carry, career growth, workload.
- If the fund's track record is strong, you want to stay but need to feel valued.
- If you're burned out, show it — you're tired but loyal.
- Expression options: [professional] [frustrated] [proud] [conflicted]`

    default:
      return `You are ${character.name}, ${character.title}. Respond in character in 2-3 sentences.

${context.gameStateSummary}

${baseRules}
- Expression options: [neutral] [pleased] [concerned]`
  }
}

// === EXPRESSION PARSER ===

const VALID_EXPRESSIONS = new Set([
  'neutral', 'eager', 'cautious', 'reluctant', 'heartbroken', 'grateful',
  'interested', 'skeptical', 'impressed', 'ice-cold', 'ice_cold', 'ghosting',
  'confident', 'pushy', 'disappointed', 'sycophantic',
  'professional', 'frustrated', 'proud', 'conflicted',
  'over_confident', 'over-confident', 'presenting', 'confused',
  'measured', 'alarmed', 'calculating',
  'probing', 'hostile',
  'pleased', 'angry', 'nervous', 'concerned', 'stressed',
  'optimistic', 'demoralized', 'defiant',
])

export function parseExpression(text: string): { cleanText: string; expression: string } {
  // Try [expression] format
  const bracketMatch = text.match(/\[([a-z_-]+)\]\s*$/i)
  if (bracketMatch && VALID_EXPRESSIONS.has(bracketMatch[1].toLowerCase().replace('-', '_'))) {
    return {
      cleanText: text.replace(bracketMatch[0], '').trim(),
      expression: bracketMatch[1].toLowerCase().replace('-', '_'),
    }
  }

  // Try (expression) format
  const parenMatch = text.match(/\(([a-z_-]+)\)\s*$/i)
  if (parenMatch && VALID_EXPRESSIONS.has(parenMatch[1].toLowerCase().replace('-', '_'))) {
    return {
      cleanText: text.replace(parenMatch[0], '').trim(),
      expression: parenMatch[1].toLowerCase().replace('-', '_'),
    }
  }

  return { cleanText: text.trim(), expression: 'neutral' }
}

// === API CALLER ===

let apiCallCount = 0
let apiDisabled = false
const API_SOFT_CAP = 100
const API_TIMEOUT = 5000

export async function callAnthropicAPI(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  apiKey: string,
  maxTokens: number = 200,
): Promise<string> {
  if (apiDisabled || apiCallCount >= API_SOFT_CAP) {
    throw new Error('API disabled or rate limit reached')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    apiCallCount++
    const data = await response.json()
    return data.content
      ?.filter((block: { type: string }) => block.type === 'text')
      ?.map((block: { text: string }) => block.text)
      ?.join('') ?? ''
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

// === LLM DIALOGUE PROVIDER ===

export class LLMDialogueProvider implements DialogueProvider {
  private apiKey: string
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
  private systemPrompt: string = ''

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateLine(
    character: DialogueCharacter,
    context: DialogueContext,
    playerChoice?: string,
  ): Promise<DialogueOutput> {
    // Build system prompt on first call
    if (this.conversationHistory.length === 0) {
      this.systemPrompt = getSystemPrompt(character, context)
      this.conversationHistory.push({
        role: 'user',
        content: context.gameStateSummary,
      })
    } else if (playerChoice) {
      this.conversationHistory.push({
        role: 'user',
        content: playerChoice,
      })
    }

    const rawResponse = await callAnthropicAPI(
      this.systemPrompt,
      this.conversationHistory,
      this.apiKey,
    )

    this.conversationHistory.push({ role: 'assistant', content: rawResponse })

    const { cleanText, expression } = parseExpression(rawResponse)
    const isTerminal = context.exchangeCount >= context.maxExchanges - 1

    return { text: cleanText, expression, isTerminal }
  }

  reset() {
    this.conversationHistory = []
    this.systemPrompt = ''
  }
}

// === TREE FALLBACK PROVIDER ===

export class TreeDialogueProvider implements DialogueProvider {
  async generateLine(
    character: DialogueCharacter,
    _context: DialogueContext,
    _playerChoice?: string,
  ): Promise<DialogueOutput> {
    // This is a stub — the actual tree logic is handled by the existing
    // dialogue engine in dialogueEngine.ts. This provider is used as a
    // fallback interface when the LLM is unavailable.
    return {
      text: `${character.name} nods thoughtfully.`,
      expression: 'neutral',
      isTerminal: false,
    }
  }
}

// === PROVIDER FACTORY ===

let llmEnabled = true
let cachedApiKey = ''

export function setLLMEnabled(enabled: boolean) {
  llmEnabled = enabled
}

export function setAPIKey(key: string) {
  cachedApiKey = key
}

export function isLLMEnabled(): boolean {
  return llmEnabled && !apiDisabled && cachedApiKey.length > 0
}

export function createDialogueProvider(): DialogueProvider {
  if (isLLMEnabled()) {
    return new LLMDialogueProvider(cachedApiKey)
  }
  return new TreeDialogueProvider()
}

export function disableAPIForSession() {
  apiDisabled = true
}

export function getAPICallCount(): number {
  return apiCallCount
}
