import type { DialogueTree, DialogueCharacter } from '../../engine/dialogueEngine'
import { PRNG } from '../../engine/prng'

// === DEAL NEGOTIATION (SELLER) ===
export const dealNegotiationTree: DialogueTree = {
  id: 'deal_negotiation',
  triggerContext: 'deal_won',
  startNodeId: 'seller_open',
  nodes: {
    seller_open: {
      id: 'seller_open',
      speakerId: 'seller',
      text: (state) => `I appreciate ${state.fund.name} showing interest in my company. I've spent ${Math.round(Math.random() * 15 + 10)} years building this business. I need to know my team will be taken care of.`,
      expression: 'cautious',
      responses: [
        { text: 'We plan to invest in growth and keep the team intact.', nextNodeId: 'seller_reassured', consequenceHint: 'cooperative' },
        { text: 'We\'ll make the operational changes necessary to maximize value.', nextNodeId: 'seller_worried', consequenceHint: 'aggressive' },
        { text: 'Let\'s focus on the financial terms first.', nextNodeId: 'seller_transactional', consequenceHint: 'financial' },
      ],
    },
    seller_reassured: {
      id: 'seller_reassured',
      speakerId: 'seller',
      text: 'That\'s good to hear. My employees are like family. If you can put that commitment in writing, I\'m comfortable moving forward.',
      expression: 'pleased',
      responses: [
        { text: 'Absolutely. We\'ll include retention commitments in the agreement.', nextNodeId: null, consequenceHint: 'cooperative' },
        { text: 'We\'ll do our best, but business conditions change.', nextNodeId: null, consequenceHint: 'neutral' },
      ],
    },
    seller_worried: {
      id: 'seller_worried',
      speakerId: 'seller',
      text: 'I\'ve heard that before from other firms. My people are nervous about what "operational changes" means. I need specific commitments.',
      expression: 'reluctant',
      responses: [
        { text: 'Fair point. We\'ll work with your management team, not against them.', nextNodeId: null, consequenceHint: 'cooperative' },
        { text: 'The business needs to be competitive. Changes are inevitable.', nextNodeId: null, consequenceHint: 'aggressive' },
      ],
    },
    seller_transactional: {
      id: 'seller_transactional',
      speakerId: 'seller',
      text: 'Sure. But I should tell you — if I don\'t feel good about the buyer, I\'ll walk away. Money isn\'t everything to me.',
      expression: 'skeptical',
      responses: [
        { text: 'I understand. Let me tell you about our approach to partnerships.', nextNodeId: null, consequenceHint: 'cooperative' },
        { text: 'Understood. Here\'s our offer — take it or leave it.', nextNodeId: null, consequenceHint: 'aggressive' },
      ],
    },
  },
}

// === LP ANNUAL MEETING ===
export const lpMeetingTree: DialogueTree = {
  id: 'lp_meeting',
  triggerContext: 'lp_report',
  startNodeId: 'lp_open',
  nodes: {
    lp_open: {
      id: 'lp_open',
      speakerId: 'lp',
      text: (state) => state.fund.lpTrustScore > 60
        ? `Thank you for the update on ${state.fund.name}. The returns look ${(state.fund.netMoic ?? 0) > 1.5 ? 'promising' : 'like they need some work'}. Walk us through the portfolio.`
        : `We have concerns about ${state.fund.name}'s performance. Our investment committee has questions.`,
      expression: 'neutral',
      responses: [
        { text: 'Let me walk you through each company and our value creation plans.', nextNodeId: 'lp_response', consequenceHint: 'cooperative' },
        { text: 'The portfolio is tracking well. We expect significant upside from here.', nextNodeId: 'lp_skeptical', consequenceHint: 'neutral' },
      ],
    },
    lp_response: {
      id: 'lp_response',
      speakerId: 'lp',
      text: 'We appreciate the transparency. Keep us informed on the underperformers — we\'d rather hear it from you than discover it ourselves.',
      expression: 'interested',
      responses: [
        { text: 'Agreed. You\'ll always get the full picture from us.', nextNodeId: null, consequenceHint: 'cooperative' },
      ],
    },
    lp_skeptical: {
      id: 'lp_skeptical',
      speakerId: 'lp',
      text: 'We\'ve heard "significant upside" from a lot of GPs. What specifically is driving that conviction? And what about the companies you didn\'t mention?',
      expression: 'skeptical',
      responses: [
        { text: 'You\'re right — let me be more specific about our challenges and plans.', nextNodeId: null, consequenceHint: 'cooperative' },
        { text: 'We stand behind our portfolio. The numbers will speak for themselves.', nextNodeId: null, consequenceHint: 'aggressive' },
      ],
    },
  },
}

// === COVENANT BREACH (LAWYER) ===
export const covenantBreachTree: DialogueTree = {
  id: 'covenant_breach',
  triggerContext: 'covenant_breach',
  startNodeId: 'lawyer_open',
  nodes: {
    lawyer_open: {
      id: 'lawyer_open',
      speakerId: 'lawyer',
      text: (_, ctx) => `We have a situation. ${ctx.companyName ?? 'The company'} has breached its maintenance covenant. The lenders are calling an emergency meeting. We need to decide on a course of action.`,
      expression: 'alarmed',
      responses: [
        { text: 'Can we negotiate a waiver?', nextNodeId: 'lawyer_waiver', consequenceHint: 'financial' },
        { text: 'What would an equity cure look like?', nextNodeId: 'lawyer_cure', consequenceHint: 'financial' },
        { text: 'What are our restructuring options?', nextNodeId: 'lawyer_restructuring', consequenceHint: 'neutral' },
      ],
    },
    lawyer_waiver: {
      id: 'lawyer_waiver',
      speakerId: 'lawyer',
      text: 'We can try. It\'ll cost about $750K in legal and advisory fees. I\'d say... 60-70% chance they grant a temporary waiver. But if EBITDA doesn\'t recover, we\'ll be right back here.',
      expression: 'calculating',
      responses: [
        { text: 'Go ahead with the waiver negotiation.', nextNodeId: null, consequenceHint: 'financial' },
        { text: 'Let me think about other options.', nextNodeId: 'lawyer_open', consequenceHint: 'neutral' },
      ],
    },
    lawyer_cure: {
      id: 'lawyer_cure',
      speakerId: 'lawyer',
      text: 'An equity cure means injecting cash from the fund to pay down debt until coverage ratios are back in compliance. It\'s clean and keeps the lenders happy, but it costs real money from your fund.',
      expression: 'measured',
      responses: [
        { text: 'Do it. We\'ll inject the equity.', nextNodeId: null, consequenceHint: 'financial' },
        { text: 'How much exactly would we need to inject?', nextNodeId: null, consequenceHint: 'neutral' },
      ],
    },
    lawyer_restructuring: {
      id: 'lawyer_restructuring',
      speakerId: 'lawyer',
      text: 'Forced restructuring means the lenders take partial control. Your equity gets written down 20-40%, but the company survives. It\'s not pretty, but it\'s better than a total loss.',
      expression: 'alarmed',
      responses: [
        { text: 'Proceed with restructuring. Cut our losses.', nextNodeId: null, consequenceHint: 'aggressive' },
        { text: 'Is a write-off cleaner at this point?', nextNodeId: null, consequenceHint: 'aggressive' },
      ],
    },
  },
}

// === TEAM POACHING ===
export const teamPoachingTree: DialogueTree = {
  id: 'team_poaching',
  triggerContext: 'team_poaching',
  startNodeId: 'member_open',
  nodes: {
    member_open: {
      id: 'member_open',
      speakerId: 'team_member',
      text: (_, ctx) => `I need to talk to you about something. I've received an offer from ${ctx.competitorName ?? 'another firm'}. I don't want to leave, but the economics are compelling.`,
      expression: 'conflicted',
      responses: [
        { text: 'What would it take for you to stay?', nextNodeId: 'member_terms', consequenceHint: 'financial' },
        { text: 'I appreciate you telling me. We can match their offer.', nextNodeId: 'member_grateful', consequenceHint: 'cooperative' },
        { text: 'If you want to leave, I won\'t stand in your way.', nextNodeId: 'member_departure', consequenceHint: 'neutral' },
      ],
    },
    member_terms: {
      id: 'member_terms',
      speakerId: 'team_member',
      text: 'Honestly, it\'s about the carry. If my allocation reflected my contribution more, I\'d have no reason to look elsewhere.',
      expression: 'professional',
      responses: [
        { text: 'Let\'s increase your carry by 3 points. You\'ve earned it.', nextNodeId: null, consequenceHint: 'financial' },
        { text: 'I hear you, but our allocation is fair. Think about what you\'d be giving up.', nextNodeId: null, consequenceHint: 'neutral' },
      ],
    },
    member_grateful: {
      id: 'member_grateful',
      speakerId: 'team_member',
      text: 'That means a lot. I\'d rather build something here than start over somewhere else.',
      expression: 'pleased',
      responses: [
        { text: 'Good. Let\'s formalize the new terms.', nextNodeId: null, consequenceHint: 'cooperative' },
      ],
    },
    member_departure: {
      id: 'member_departure',
      speakerId: 'team_member',
      text: 'I understand. I\'ll stay through the end of the quarter to transition my responsibilities.',
      expression: 'concerned',
      responses: [
        { text: 'I appreciate the professionalism. Good luck.', nextNodeId: null, consequenceHint: 'neutral' },
      ],
    },
  },
}

// === CONSULTANT ===
export const consultantTree: DialogueTree = {
  id: 'consultant_report',
  triggerContext: 'consultant_engagement',
  startNodeId: 'consultant_open',
  nodes: {
    consultant_open: {
      id: 'consultant_open',
      speakerId: 'consultant',
      text: (_, ctx) => ctx.outcome === 'helpful'
        ? 'We\'ve completed our engagement and identified several actionable efficiency opportunities. Let me walk you through the key findings.'
        : ctx.outcome === 'obvious'
          ? 'After extensive analysis, our recommendation is to continue focusing on operational excellence and customer satisfaction. Here\'s our 200-page report.'
          : 'We spent six weeks embedded with the management team. Unfortunately, the organization is more complex than initially scoped. We recommend a follow-up engagement.',
      expression: 'over_confident',
      responses: [
        { text: 'Thank you for the thorough work.', nextNodeId: null, consequenceHint: 'neutral' },
        { text: 'Is that it? We paid $2M for this?', nextNodeId: 'consultant_defensive', consequenceHint: 'aggressive' },
      ],
    },
    consultant_defensive: {
      id: 'consultant_defensive',
      speakerId: 'consultant',
      text: 'Our methodology is industry-leading. The insights in this report represent best-in-class thinking. I\'d be happy to schedule a follow-up session to discuss implementation.',
      expression: 'over_confident',
      responses: [
        { text: 'That won\'t be necessary. Thank you.', nextNodeId: null, consequenceHint: 'neutral' },
      ],
    },
  },
}

// === JOURNALIST ===
export const journalistTree: DialogueTree = {
  id: 'journalist_crisis',
  triggerContext: 'pr_crisis',
  startNodeId: 'journalist_open',
  nodes: {
    journalist_open: {
      id: 'journalist_open',
      speakerId: 'journalist',
      text: (_, ctx) => `I'm writing a story about ${ctx.companyName ?? 'one of your portfolio companies'}. We've received reports about significant layoffs and deteriorating working conditions. Would you like to comment?`,
      expression: 'neutral',
      responses: [
        { text: 'No comment.', nextNodeId: 'journalist_nocomment', consequenceHint: 'neutral' },
        { text: 'We can provide a prepared statement.', nextNodeId: 'journalist_statement', consequenceHint: 'cooperative' },
        { text: 'Let me be transparent about what happened and why.', nextNodeId: 'journalist_transparent', consequenceHint: 'cooperative' },
      ],
    },
    journalist_nocomment: {
      id: 'journalist_nocomment',
      speakerId: 'journalist',
      text: '"No comment" it is. The story runs tomorrow with or without your side.',
      expression: 'probing',
      responses: [
        { text: 'That\'s our position.', nextNodeId: null, consequenceHint: 'neutral' },
      ],
    },
    journalist_statement: {
      id: 'journalist_statement',
      speakerId: 'journalist',
      text: 'We\'ll include your statement. Though I should mention — we have former employees willing to go on record.',
      expression: 'probing',
      responses: [
        { text: 'Our statement stands. Thank you.', nextNodeId: null, consequenceHint: 'neutral' },
      ],
    },
    journalist_transparent: {
      id: 'journalist_transparent',
      speakerId: 'journalist',
      text: 'I appreciate the candor. That\'s rare in this industry. The story will be tougher with the details, but at least both sides are represented.',
      expression: 'neutral',
      responses: [
        { text: 'That\'s all I can ask for.', nextNodeId: null, consequenceHint: 'cooperative' },
      ],
    },
  },
}

// === GENERATE CHARACTER FOR CONTEXT ===
export function generateCharacterForContext(
  context: string,
  prng: PRNG,
  additionalInfo?: Record<string, unknown>,
): DialogueCharacter {
  switch (context) {
    case 'deal_won':
      return {
        id: `npc-seller-${prng.nextInt(1000, 9999)}`,
        name: additionalInfo?.sellerName as string ?? 'The Seller',
        title: 'Business Owner',
        expression: 'cautious',
        portraitSeed: prng.nextInt(0, 99999),
        characterType: 'seller',
      }
    case 'lp_report':
      return {
        id: `npc-lp-${prng.nextInt(1000, 9999)}`,
        name: 'Margaret Chen',
        title: 'CIO, State Pension Fund',
        expression: 'neutral',
        portraitSeed: prng.nextInt(0, 99999),
        characterType: 'lp',
      }
    case 'covenant_breach':
      return {
        id: `npc-lawyer-${prng.nextInt(1000, 9999)}`,
        name: 'David Morrison',
        title: 'Partner, Kirkwell & Associates',
        expression: 'alarmed',
        portraitSeed: prng.nextInt(0, 99999),
        characterType: 'lawyer',
      }
    case 'consultant_engagement':
      return {
        id: `npc-consultant-${prng.nextInt(1000, 9999)}`,
        name: 'Ryan Kowalski',
        title: 'Senior Partner, Strategic Solutions Group',
        expression: 'over_confident',
        portraitSeed: prng.nextInt(0, 99999),
        characterType: 'consultant',
      }
    case 'pr_crisis':
      return {
        id: `npc-journalist-${prng.nextInt(1000, 9999)}`,
        name: 'Sarah Williams',
        title: 'Business Reporter',
        expression: 'neutral',
        portraitSeed: prng.nextInt(0, 99999),
        characterType: 'journalist',
      }
    default:
      return {
        id: `npc-generic-${prng.nextInt(1000, 9999)}`,
        name: 'Unknown',
        title: '',
        expression: 'neutral',
        portraitSeed: prng.nextInt(0, 99999),
        characterType: 'banker',
      }
  }
}

export function getDialogueTree(context: string): DialogueTree | null {
  switch (context) {
    case 'deal_won': return dealNegotiationTree
    case 'lp_report': return lpMeetingTree
    case 'covenant_breach': return covenantBreachTree
    case 'team_poaching': return teamPoachingTree
    case 'consultant_engagement': return consultantTree
    case 'pr_crisis': return journalistTree
    default: return null
  }
}
