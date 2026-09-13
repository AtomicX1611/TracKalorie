import { useState } from 'react'
import { ChevronDown, ChevronRight, Zap, Drumstick, Wheat, Droplets } from 'lucide-react'
import { Badge } from './ui'
import { formatDateLong, fmt } from '../lib/utils'

const MEAL_TYPE_COLORS = {
  breakfast: 'text-yellow-400',
  lunch:     'text-accent',
  dinner:    'text-blue-400',
  snack:     'text-purple-400',
}

const SOURCE_BADGE = {
  manual:    { label: 'Manual',   variant: 'default' },
  ai_label:  { label: 'AI Label', variant: 'ai' },
  ai_plate:  { label: 'AI Plate', variant: 'ai' },
  import:    { label: 'Import',   variant: 'default' },
}

export default function MealCard({ meal, onDelete }) {
  const [open, setOpen] = useState(false)
  const src = SOURCE_BADGE[meal.source] ?? SOURCE_BADGE.manual

  return (
    <div className="card-elevated overflow-hidden transition-all">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Meal type dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${MEAL_TYPE_COLORS[meal.mealType]?.replace('text-', 'bg-')}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium capitalize ${MEAL_TYPE_COLORS[meal.mealType]}`}>
              {meal.mealType}
            </span>
            <Badge variant={src.variant}>{src.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {meal.items.length} item{meal.items.length !== 1 ? 's' : ''} · {formatDateLong(meal.date)}
          </p>
        </div>

        {/* Totals */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="mono text-sm font-semibold text-foreground">{meal.totals.calories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div className="hidden sm:flex gap-3 text-xs text-muted-foreground mono">
            <span className="text-accent">{fmt(meal.totals.proteinG)}P</span>
            <span className="text-blue-400">{fmt(meal.totals.carbG)}C</span>
            <span className="text-warning">{fmt(meal.totals.fatG)}F</span>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded items */}
      {open && (
        <div className="border-t border-border">
          <div className="divide-y divide-border">
            {meal.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface/30">
                <div>
                  <p className="text-sm text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity.amount} {item.quantity.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mono text-sm text-foreground">{item.calories} kcal</p>
                  <p className="mono text-xs text-muted-foreground">
                    {fmt(item.macros.proteinG)}P · {fmt(item.macros.carbG)}C · {fmt(item.macros.fatG)}F
                  </p>
                </div>
              </div>
            ))}
          </div>
          {onDelete && (
            <div className="px-4 py-3 flex justify-end border-t border-border">
              <button
                onClick={() => onDelete(meal._id)}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                Delete meal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
