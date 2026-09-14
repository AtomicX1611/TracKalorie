import { useEffect, useState } from 'react'
import { Plus, TrendingUp, Flame } from 'lucide-react'
import CalorieRing from '../components/CalorieRing'
import MacroBars from '../components/MacroBars'
import MealCard from '../components/MealCard'
import AddMealModal from '../components/AddMealModal'
import { Button, Card, SectionHeader } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { toDateStr, formatDate, mealDateKey } from '../lib/utils'
import { mealsApi, goalsApi, nutritionApi } from '../api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function DashboardPage() {
  const { user } = useAuth()
  const [meals, setMeals] = useState([])
  const [goal, setGoal] = useState({ dailyCalorieTarget: 0, proteinTargetG: 0, carbTargetG: 0, fatTargetG: 0 })
  const [weeklyTrend, setWeeklyTrend] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
    const today = new Date()
    const fromDate = new Date(today)
    fromDate.setDate(today.getDate() - 6)
    const from = toDateStr(fromDate)
    const to = toDateStr(today)

    Promise.all([
      mealsApi.list({ from: to, to, limit: 100 }),
      goalsApi.getCurrent(),
      nutritionApi.weeklyTrend({ from, to }),
    ]).then(([mealResult, currentGoal, trend]) => {
      setMeals(mealResult.data ?? [])
      setGoal(currentGoal ?? { dailyCalorieTarget: 0, proteinTargetG: 0, carbTargetG: 0, fatTargetG: 0 })
      setWeeklyTrend(trend ?? [])
    }).catch(() => {
      setMeals([])
      setWeeklyTrend([])
      setError('Unable to load dashboard data. Please try again.')
    })
  }, [refreshKey])

  const todayTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totals.calories,
      proteinG: acc.proteinG + m.totals.proteinG,
      carbG: acc.carbG + m.totals.carbG,
      fatG: acc.fatG + m.totals.fatG,
    }),
    { calories: 0, proteinG: 0, carbG: 0, fatG: 0 }
  )
  const todayMeals = meals.filter((m) => mealDateKey(m.date) === toDateStr())

  const handleAddMeal = async (meal) => {
    await mealsApi.create(meal)
    setRefreshKey((key) => key + 1)
  }

  const handleDelete = async (id) => {
    try {
      await mealsApi.remove(id)
      setRefreshKey((key) => key + 1)
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Unable to delete this meal.')
    }
  }

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const trendData = weeklyTrend.map((d) => ({
    ...d,
    day: formatDate(d.day),
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          {greet()}, <span className="text-accent">{user?.email?.split('@')[0] ?? 'there'}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{formatDate(toDateStr())} · Here's your nutrition snapshot</p>
      </div>
      {error && <p className="mb-5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Calories Eaten', value: todayTotals.calories, unit: 'kcal', color: '#7CFFB2' },
          { label: 'Remaining', value: Math.max(goal.dailyCalorieTarget - todayTotals.calories, 0), unit: 'kcal', color: '#60A5FA' },
          { label: 'Protein', value: Math.round(todayTotals.proteinG), unit: 'g', color: '#7CFFB2' },
          { label: 'Meals Logged', value: meals.length, unit: 'today', color: '#F59E0B' },
        ].map(({ label, value, unit, color }) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="mono text-2xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Calorie ring + macros */}
        <Card className="p-6 flex flex-col items-center gap-6">
          <div className="w-full">
            <SectionHeader title="Today's Intake" subtitle="Calorie goal progress" />
          </div>
          <CalorieRing consumed={todayTotals.calories} target={goal.dailyCalorieTarget} />
          <div className="w-full">
            <MacroBars totals={todayTotals} goal={goal} />
          </div>
        </Card>

        {/* Right: Mini trend chart + today's meals */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* 7-day trend */}
          <Card className="p-5">
            <SectionHeader
              title="7-Day Calorie Trend"
              subtitle="Daily intake vs target"
              action={<TrendingUp className="w-4 h-4 text-accent" />}
            />
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7CFFB2" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7CFFB2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1B1B1E', border: '1px solid #26262A', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#E4E4E7' }}
                    itemStyle={{ color: '#7CFFB2' }}
                  />
                  {/* Goal reference line */}
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="#7CFFB2"
                    strokeWidth={2}
                    fill="url(#calGrad)"
                    dot={{ r: 3, fill: '#7CFFB2' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Today's meals */}
          <div>
            <SectionHeader
              title="Today's Meals"
              action={
                <Button size="sm" onClick={() => setShowAdd(true)}>
                  <Plus className="w-3.5 h-3.5" /> Log meal
                </Button>
              }
            />
            {todayMeals.length === 0 ? (
              <div className="card flex flex-col items-center py-10 gap-2">
                <Flame className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No meals logged today</p>
                <Button size="sm" onClick={() => setShowAdd(true)}>Log your first meal</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {todayMeals.slice(0, 3).map((m) => (
                  <MealCard key={m._id} meal={m} onDelete={handleDelete} />
                ))}
                {todayMeals.length > 3 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{todayMeals.length - 3} more — <a href="/meals" className="text-accent hover:underline">view all</a>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddMealModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAddMeal} />
    </div>
  )
}
