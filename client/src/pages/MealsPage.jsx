import { useState, useMemo } from 'react'
import { Plus, Search, Filter, UtensilsCrossed } from 'lucide-react'
import MealCard from '../components/MealCard'
import AddMealModal from '../components/AddMealModal'
import { Button, EmptyState, SectionHeader, Badge } from '../components/ui'
import { toDateStr, formatDateLong } from '../lib/utils'
import { dummyMeals } from '../lib/dummyData'

const MEAL_TYPES = ['all', 'breakfast', 'lunch', 'dinner', 'snack']

export default function MealsPage() {
  const [meals, setMeals] = useState(dummyMeals)
  const [showAdd, setShowAdd] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return meals.filter((m) => {
      if (typeFilter !== 'all' && m.mealType !== typeFilter) return false
      if (dateFilter && m.date !== dateFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return m.items.some((it) => it.name.toLowerCase().includes(q))
      }
      return true
    })
  }, [meals, typeFilter, dateFilter, search])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach((m) => {
      if (!map[m.date]) map[m.date] = []
      map[m.date].push(m)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const handleAdd = (meal) => setMeals((p) => [meal, ...p])
  const handleDelete = (id) => setMeals((p) => p.filter((m) => m._id !== id))

  const todayTotal = meals
    .filter((m) => m.date === toDateStr())
    .reduce((acc, m) => acc + m.totals.calories, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <SectionHeader
        title="Meal Log"
        subtitle={`${meals.length} meals tracked · ${Math.round(todayTotal).toLocaleString()} kcal today`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Log Meal
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food items…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-surface border border-border focus:border-accent outline-none transition-all"
          />
        </div>

        {/* Date */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-surface border border-border focus:border-accent outline-none transition-all"
        />

        {/* Meal type */}
        <div className="flex gap-1.5 flex-wrap">
          {MEAL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                typeFilter === t
                  ? 'bg-accent text-background'
                  : 'bg-surface-elevated text-muted-foreground border border-border hover:border-accent/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Meal groups by date */}
      {grouped.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meals found"
          description="Try adjusting your filters or log a new meal."
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Log Meal</Button>}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(([date, dayMeals]) => {
            const dayTotal = dayMeals.reduce((acc, m) => acc + m.totals.calories, 0)
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-foreground">{formatDateLong(date)}</p>
                    {date === toDateStr() && (
                      <Badge variant="accent">Today</Badge>
                    )}
                  </div>
                  <span className="mono text-xs text-muted-foreground">
                    {dayTotal.toLocaleString()} kcal
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {dayMeals.map((m) => (
                    <MealCard key={m._id} meal={m} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddMealModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </div>
  )
}
