// SVG donut ring showing calorie progress.
// Uses a single circle stroke-dasharray trick — no external charting library needed.

const SIZE = 160
const STROKE = 10
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

export default function CalorieRing({ consumed, target }) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0
  const over = consumed > target && target > 0
  const offset = CIRC * (1 - pct)

  const color = over ? '#EF4444' : pct > 0.9 ? '#F59E0B' : '#7CFFB2'
  const remaining = target - consumed

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Track */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#26262A" strokeWidth={STROKE} />
          {/* Progress */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="mono font-bold text-2xl text-foreground accent-glow">
            {Math.round(consumed).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">kcal eaten</span>
        </div>
      </div>

      {/* Target info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {over
            ? <span className="text-destructive font-medium">{Math.abs(remaining)} kcal over</span>
            : <><span className="text-accent font-medium mono">{remaining.toLocaleString()}</span> kcal left</>
          }
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">of {target.toLocaleString()} goal</p>
      </div>
    </div>
  )
}
