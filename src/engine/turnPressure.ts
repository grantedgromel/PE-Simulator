import type { PortfolioCompany, ValueCreationAction } from '../types/company'
import type { TeamMember } from '../types/team'

export const ACTION_COMMAND_COSTS: Record<ValueCreationAction, number> = {
  CostCutting: 1,
  RevenueEnhancement: 1,
  OrganicInvestment: 2,
  AddOnAcquisition: 3,
  DividendRecap: 2,
  ManagementUpgrade: 2,
  ConsultantEngagement: 1,
  DoNothing: 0,
}

const OPERATOR_REQUIRED_ACTIONS = new Set<ValueCreationAction>([
  'OrganicInvestment',
  'AddOnAcquisition',
  'ManagementUpgrade',
])

export function getSourcingCapacity(teamMembers: TeamMember[]): number {
  const activeMembers = teamMembers.filter((member) => member.status === 'Active')
  const principalSlots = activeMembers.filter((member) => member.role === 'Principal').length * 2
  const vpSlots = activeMembers.filter((member) => member.role === 'VP').length
  const associateSlots = Math.floor(
    activeMembers.filter((member) => member.role === 'Associate').length / 2,
  )

  return Math.max(1, principalSlots + vpSlots + associateSlots)
}

export function getStaffedPortfolioCompanyIds(
  teamMembers: TeamMember[],
  portfolioCompanies: PortfolioCompany[],
): Set<string> {
  const activeCompanyIds = new Set(
    portfolioCompanies
      .filter((company) => company.status === 'Active')
      .map((company) => company.id),
  )

  return new Set(
    teamMembers
      .filter((member) => member.status === 'Active' && member.role === 'OperatingPartner')
      .flatMap((member) => member.currentAssignments)
      .filter((assignmentId) => activeCompanyIds.has(assignmentId)),
  )
}

export function hasOperatingPartnerCoverage(
  companyId: string,
  teamMembers: TeamMember[],
  portfolioCompanies: PortfolioCompany[],
): boolean {
  return getStaffedPortfolioCompanyIds(teamMembers, portfolioCompanies).has(companyId)
}

export function getOperationsExecutionBudget(
  teamMembers: TeamMember[],
  portfolioCompanies: PortfolioCompany[],
): number {
  const staffedCompanies = getStaffedPortfolioCompanyIds(teamMembers, portfolioCompanies)
  return 2 + staffedCompanies.size
}

export function getOperationsExecutionSpent(
  portfolioCompanies: PortfolioCompany[],
  quarter: number,
): number {
  return portfolioCompanies.reduce((sum, company) => (
    sum + company.actionsTaken
      .filter((record) => record.quarter === quarter)
      .reduce((companySum, record) => companySum + (record.commandCost ?? ACTION_COMMAND_COSTS[record.action]), 0)
  ), 0)
}

export function getRemainingOperationsExecution(
  teamMembers: TeamMember[],
  portfolioCompanies: PortfolioCompany[],
  quarter: number,
): number {
  return getOperationsExecutionBudget(teamMembers, portfolioCompanies)
    - getOperationsExecutionSpent(portfolioCompanies, quarter)
}

export function getOperationBlockReason(
  company: PortfolioCompany,
  action: ValueCreationAction,
  teamMembers: TeamMember[],
  portfolioCompanies: PortfolioCompany[],
  quarter: number,
): string | null {
  const actionTakenThisQuarter = company.actionsTaken.some((record) => record.quarter === quarter)
  if (actionTakenThisQuarter) {
    return 'Already acted this quarter'
  }

  if (
    OPERATOR_REQUIRED_ACTIONS.has(action)
    && !hasOperatingPartnerCoverage(company.id, teamMembers, portfolioCompanies)
  ) {
    return 'Assign an operating partner'
  }

  const remainingExecution = getRemainingOperationsExecution(teamMembers, portfolioCompanies, quarter)
  const actionCost = ACTION_COMMAND_COSTS[action]
  if (actionCost > remainingExecution) {
    return 'Not enough execution budget'
  }

  return null
}
