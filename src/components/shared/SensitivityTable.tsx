import type { SensitivityCell } from '../../engine/structuringEngine'
import { formatMultiple, formatPercent } from '../../utils/formatters'

interface SensitivityTableProps {
  table: SensitivityCell[][]
}

function getMoicColor(moic: number): string {
  if (moic < 1.0) return 'bg-terminal-red/30 text-terminal-red'
  if (moic < 1.5) return 'bg-terminal-red/15 text-terminal-red'
  if (moic < 2.0) return 'bg-terminal-amber/15 text-terminal-amber'
  if (moic < 3.0) return 'bg-terminal-green/15 text-terminal-green'
  return 'bg-terminal-green/30 text-terminal-green'
}

export function SensitivityTable({ table }: SensitivityTableProps) {
  if (table.length === 0) return null

  const exitMultiples = table[0].map((c) => c.exitMultiple)
  const holdYears = table.map((row) => row[0].holdYears)

  return (
    <div>
      <h4 className="text-xs font-mono text-terminal-muted uppercase mb-2">
        Returns Sensitivity (MOIC / IRR)
      </h4>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr>
            <th className="text-left text-terminal-muted p-1">Hold \\ Exit</th>
            {exitMultiples.map((m) => (
              <th key={m} className="text-center text-terminal-muted p-1">
                {formatMultiple(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.map((row, rowIdx) => (
            <tr key={holdYears[rowIdx]}>
              <td className="text-terminal-muted p-1">Year {holdYears[rowIdx]}</td>
              {row.map((cell) => (
                <td
                  key={`${cell.holdYears}-${cell.exitMultiple}`}
                  className={`text-center p-1 rounded ${getMoicColor(cell.moic)}`}
                >
                  <div>{formatMultiple(cell.moic)}</div>
                  <div className="text-[10px] opacity-70">{formatPercent(cell.irr)}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
