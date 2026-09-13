import { useState } from 'react'
import { Plus, TrendingUp, Flame } from 'lucide-react'
import CalorieRing from '../components/CalorieRing'
import MacroBars from '../components/MacroBars'
import MealCard from '../components/MealCard'
import AddMealModal from '../components/AddMealModal'
import { Button, Card, SectionHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { toDateStr, formatDate } from '../lib/utils'
import {
  dummyGoal, dummyMeals, dummyTodayTotals, dummyWeeklyTrend,
} from '../lib/dummyData'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function DashboardPage() {
  const { user } = useAuth()
  const [meals, setMeals] = useState(dummyMeals)
  const [showAdd, setShowAdd] = useState(false)

  const todayTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totals.calories,
      proteinG: acc.proteinG + m.totals.proteinG,
      carbG: acc.carbG + m.totals.carbG,
      fatG: acc.fatG + m.totals.fatG,
    }),
    { calories: 0, proteinG: 0, carbG: 0, fatG: 0 }
  )

  const handleAddMeal = (meal) => {
    setMeals((prev) => [meal, ...prev])
  }

  const handleDelete = (id) => setMeals((prev) => prev.filter((m) => m._id !== id))

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const trendData = dummyWeeklyTrend.map((d) => ({
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

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Calories Eaten', value: todayTotals.calories, unit: 'kcal', color: '#7CFFB2' },
          { label: 'Remaining', value: Math.max(dummyGoal.dailyCalorieTarget - todayTotals.calories, 0), unit: 'kcal', color: '#60A5FA' },
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
          <CalorieRing consumed={todayTotals.calories} target={dummyGoal.dailyCalorieTarget} />
          <div className="w-full">
            <MacroBars totals={todayTotals} goal={dummyGoal} />
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
            {meals.length === 0 ? (
              <div className="card flex flex-col items-center py-10 gap-2">
                <Flame className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No meals logged today</p>
                <Button size="sm" onClick={() => setShowAdd(true)}>Log your first meal</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {meals.slice(0, 3).map((m) => (
                  <MealCard key={m._id} meal={m} onDelete={handleDelete} />
                ))}
                {meals.length > 3 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{meals.length - 3} more — <a href="/meals" className="text-accent hover:underline">view all</a>
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
