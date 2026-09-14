import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, UtensilsCrossed } from 'lucide-react'
import MealCard from '../components/MealCard'
import AddMealModal from '../components/AddMealModal'
import { Button, EmptyState, SectionHeader, Badge } from '../components/ui'
import { toDateStr, formatDateLong, mealDateKey } from '../lib/utils'
import { mealsApi } from '../api'

const MEAL_TYPES = ['all', 'breakfast', 'lunch', 'dinner', 'snack']

export default function MealsPage() {
  const [meals, setMeals] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [search, setSearch] = useState('')
  const [nextCursor, setNextCursor] = useState(null)
  const [editingMeal, setEditingMeal] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const today = new Date()
    const fromDate = new Date(today)
    fromDate.setDate(today.getDate() - 30)
    const toDate = new Date(today)
    toDate.setDate(today.getDate() + 30)
    const params = dateFilter
      ? { from: dateFilter, to: dateFilter, mealType: typeFilter === 'all' ? undefined : typeFilter, limit: 100 }
      : { from: toDateStr(fromDate), to: toDateStr(toDate), mealType: typeFilter === 'all' ? undefined : typeFilter, limit: 100 }

    setError(null)
    mealsApi.list(params)
      .then((result) => {
        setMeals(result.data ?? [])
        setNextCursor(result.pagination?.nextCursor ?? null)
      })
      .catch((err) => {
        setMeals([])
        setNextCursor(null)
        setError(err?.response?.data?.error?.message ?? 'Unable to load meals.')
      })
  }, [dateFilter, typeFilter])

  const filtered = useMemo(() => {
    return meals.filter((m) => {
      if (typeFilter !== 'all' && m.mealType !== typeFilter) return false
      if (dateFilter && mealDateKey(m.date) !== dateFilter) return false
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
      const date = mealDateKey(m.date)
      if (!map[date]) map[date] = []
      map[date].push(m)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const handleAdd = async (meal) => {
    const createdMeal = await mealsApi.create(meal)
    setMeals((p) => [createdMeal, ...p])
  }

  const handleUpdate = async (id, data) => {
    const updatedMeal = await mealsApi.update(id, data)
    setMeals((p) => p.map((item) => item._id === id ? updatedMeal : item))
    setEditingMeal(null)
  }

  const handleDelete = async (id) => {
    try {
      await mealsApi.remove(id)
      setMeals((p) => p.filter((m) => m._id !== id))
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Unable to delete this meal.')
    }
  }

  const loadMore = async () => {
    if (!nextCursor) return
    try {
      const today = new Date()
      const fromDate = new Date(today)
      fromDate.setDate(today.getDate() - 30)
      const toDate = new Date(today)
      toDate.setDate(today.getDate() + 30)
      const result = await mealsApi.list({
        from: dateFilter || toDateStr(fromDate),
        to: dateFilter || toDateStr(toDate),
        mealType: typeFilter === 'all' ? undefined : typeFilter,
        cursor: nextCursor,
        limit: 100,
      })
      setMeals((p) => [...p, ...(result.data ?? [])])
      setNextCursor(result.pagination?.nextCursor ?? null)
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Unable to load more meals.')
    }
  }

  const todayTotal = meals
    .filter((m) => mealDateKey(m.date) === toDateStr())
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

      {error && <p className="mb-5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

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
                    <MealCard key={m._id} meal={m} onDelete={handleDelete} onEdit={setEditingMeal} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {nextCursor && <Button variant="secondary" className="mt-6 w-full" onClick={loadMore}>Load more meals</Button>}

      <AddMealModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      <AddMealModal open={Boolean(editingMeal)} meal={editingMeal} onClose={() => setEditingMeal(null)} onUpdate={handleUpdate} />
    </div>
  )
}
