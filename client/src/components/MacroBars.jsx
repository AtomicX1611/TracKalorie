import { ProgressBar } from './ui'
import { pct, fmt } from '../lib/utils'

const MACROS = [
  { key: 'proteinG', targetKey: 'proteinTargetG', label: 'Protein', color: '#7CFFB2', unit: 'g' },
  { key: 'carbG',    targetKey: 'carbTargetG',    label: 'Carbs',   color: '#60A5FA', unit: 'g' },
  { key: 'fatG',     targetKey: 'fatTargetG',     label: 'Fat',     color: '#F59E0B', unit: 'g' },
]

export default function MacroBars({ totals, goal }) {
  return (
    <div className="flex flex-col gap-4">
      {MACROS.map(({ key, targetKey, label, color, unit }) => {
        const val = totals?.[key] ?? 0
        const target = goal?.[targetKey] ?? 0
        const p = pct(val, target)
        const over = val > target && target > 0

        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <span className="mono text-xs text-foreground">
                <span style={{ color: over ? '#EF4444' : color }}>{fmt(val)}</span>
                <span className="text-muted-foreground"> / {fmt(target)}{unit}</span>
              </span>
            </div>
            <ProgressBar value={val} max={target} color={color} />
            <p className="text-xs text-muted-foreground/70">{p}% of daily target</p>
          </div>
        )
      })}
    </div>
  )
}
