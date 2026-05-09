// Business / company icons — Phosphor Icons (MIT), tree-shakeable.
import { COMPANY_ICONS } from './companyIcons'

interface CompanyIconProps {
  art: string | undefined
  size: number
}

export function CompanyIcon({ art, size }: CompanyIconProps) {
  if (!art) return null
  const Icon = COMPANY_ICONS[art]
  if (!Icon) return null
  return <Icon size={size * 0.7} weight="fill" color="#1A1833" />
}
