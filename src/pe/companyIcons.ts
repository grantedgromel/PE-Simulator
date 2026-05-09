// Company `art` key -> Phosphor icon component. Kept separate from the React
// wrapper component so the component module is fast-refresh-clean.
import type { ComponentType } from 'react'
import {
  Bug,
  Car,
  Factory,
  Fan,
  FileText,
  GraduationCap,
  HouseLine,
  TestTube,
  Toolbox,
  Tooth,
  WashingMachine,
} from '@phosphor-icons/react'

export type IconComponent = ComponentType<{
  size?: number
  weight?: 'fill' | 'duotone' | 'regular'
  color?: string
}>

export const COMPANY_ICONS: Record<string, IconComponent> = {
  // Starting portfolio
  pc1_autoglass: Car,
  pc2_seniorliving: HouseLine,
  pc3_industrial: Factory,
  // Deal pool
  d1_hvac: Fan,
  d2_dental: Tooth,
  d3_plastics: Toolbox,
  d4_tutoring: GraduationCap,
  d5_specchem: TestTube,
  d6_laundromat: WashingMachine,
  d7_billing: FileText,
  d8_pest: Bug,
}

export function hasCompanyIcon(art: string | undefined): boolean {
  return !!art && art in COMPANY_ICONS
}
