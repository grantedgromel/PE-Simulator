export type EventCategory = 'Macro' | 'Sector' | 'Company' | 'LP' | 'Team' | 'Satirical'

export interface GameEvent {
  id: string
  category: EventCategory
  title: string
  description: string
  quarter: number
  year: number
  impact: Record<string, number>
  resolved: boolean
}
