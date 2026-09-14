import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Card, SectionHeader, Badge } from '../components/ui'
import { formatDate, MACRO_COLORS, toDateStr } from '../lib/utils'
import { goalsApi, nutritionApi } from '../api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ComposedChart, Line, Cell, PieChart, Pie, Legend,
  CartesianGrid,
} from 'recharts'

// Custom tooltip styles
const TT_STYLE = {
  contentStyle: { background: '#1B1B1E', border: '1px solid #26262A', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#E4E4E7', fontWeight: 600 },
  itemStyle: { color: '#8B8B93' },
}

const MICROS_DAILY_TARGETS = {
  vitaminA_mcg: 900,
  vitaminC_mg: 90,
  calcium_mg: 1000,
  iron_mg: 18,
  sodium_mg: 2300,
  fiber_g: 30,
  sugar_g: 50,
}

const MICRO_LABELS = {
  vitaminA_mcg: 'Vitamin A',
  vitaminC_mg: 'Vitamin C',
  calcium_mg: 'Calcium',
  iron_mg: 'Iron',
  sodium_mg: 'Sodium',
  fiber_g: 'Fiber',
  sugar_g: 'Sugar',
}

export default function ReportsPage() {
  const [tab, setTab] = useState('trend')
  const [weeklyTrend, setWeeklyTrend] = useState([])
  const [goalVsActual, setGoalVsActual] = useState([])
  const [macros, setMacros] = useState([])
  const [micros, setMicros] = useState([])
  const [goal, setGoal] = useState({ dailyCalorieTarget: 0, proteinTargetG: 0, carbTargetG: 0, fatTargetG: 0 })
  const [includeMissingDays, setIncludeMissingDays] = useState(true)
  const [reportRange, setReportRange] = useState({ from: '', to: '' })
  const [error, setError] = useState(null)

  useEffect(() => {
    const today = new Date()
    const fromDate = new Date(today)
    fromDate.setDate(today.getDate() - 6)
    const from = toDateStr(fromDate)
    const to = toDateStr(today)
    setReportRange({ from, to })
    setError(null)

    Promise.all([
      nutritionApi.weeklyTrend({ from, to }),
      nutritionApi.macros({ from, to, granularity: 'day' }),
      nutritionApi.goalVsActual({ from, to }),
      nutritionApi.micros({ from, to }),
      goalsApi.getCurrent(),
    ]).then(([trend, macroData, goalData, microData, currentGoal]) => {
      setWeeklyTrend(trend ?? [])
      setMacros(macroData ?? [])
      setGoalVsActual(goalData ?? [])
      setMicros(microData ?? [])
      setGoal(currentGoal ?? { dailyCalorieTarget: 0, proteinTargetG: 0, carbTargetG: 0, fatTargetG: 0 })
    }).catch((err) => {
      setWeeklyTrend([])
      setMacros([])
      setGoalVsActual([])
      setMicros([])
      setError(err?.response?.data?.error?.message ?? 'Unable to load reports.')
    })
  }, [])

  const rangeDays = []
  if (reportRange.from && reportRange.to) {
    const cursor = new Date(`${reportRange.from}T12:00:00`)
    const end = new Date(`${reportRange.to}T12:00:00`)
    while (cursor <= end) {
      rangeDays.push(toDateStr(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  const fillDailyData = (data, dateKey = 'day') => {
    const byDay = new Map(data.map((item) => [item[dateKey], item]))
    if (!includeMissingDays) return data
    return rangeDays.map((day) => byDay.get(day) ?? {
      [dateKey]: day,
      calories: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    })
  }

  const trendData = fillDailyData(weeklyTrend).map((d) => ({ ...d, day: formatDate(d.day) }))
  const gvaData = goalVsActual.filter((d) => d.goal).map((d) => ({
    day: formatDate(d.day),
    actual: d.actual.calories,
    goal: d.goal.dailyCalorieTarget,
  }))

  const macroChartData = fillDailyData(macros, 'period').map((d) => ({
    day: formatDate(d.period),
    Protein: Math.round(d.proteinG * 4),
    Carbs:   Math.round(d.carbG * 4),
    Fat:     Math.round(d.fatG * 9),
  }))

  const pieData = [
    { name: 'Protein', value: Math.round(goal.proteinTargetG * 4), color: MACRO_COLORS.protein },
    { name: 'Carbs',   value: Math.round(goal.carbTargetG * 4),   color: MACRO_COLORS.carb },
    { name: 'Fat',     value: Math.round(goal.fatTargetG * 9),    color: MACRO_COLORS.fat },
  ]

  const microDays = includeMissingDays
    ? rangeDays.map((day) => micros.find((item) => item.day === day) ?? { day })
    : micros
  const microsData = microDays.flatMap((day) => Object.entries(MICRO_LABELS).map(([key, label]) => ({
    name: `${label} · ${formatDate(day.day)}`,
    value: day[key] ?? 0,
    target: MICROS_DAILY_TARGETS[key],
    pct: Math.round(((day[key] ?? 0) / MICROS_DAILY_TARGETS[key]) * 100),
  })))

  const TABS = [
    { id: 'trend',  label: 'Calorie Trend' },
    { id: 'macros', label: 'Macros' },
    { id: 'goals',  label: 'Goal vs Actual' },
    { id: 'micros', label: 'Micronutrients' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <SectionHeader
        title="Nutrition Reports"
        subtitle={reportRange.from ? `7-day window · ${formatDate(reportRange.from)} – ${formatDate(reportRange.to)}` : 'Loading report range…'}
        action={<BarChart3 className="w-5 h-5 text-accent" />}
      />

      {error && <p className="mb-5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

      <label className="flex items-center gap-2 mb-6 text-xs text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={includeMissingDays} onChange={(e) => setIncludeMissingDays(e.target.checked)} />
        Show days without meals as zero totals
      </label>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-surface p-1 rounded-lg w-fit border border-border">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === id
                ? 'bg-accent text-background shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Calorie Trend ──────────────────────────────────────────────────── */}
      {tab === 'trend' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Daily Calorie Intake (7 days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7CFFB2" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7CFFB2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip {...TT_STYLE} />
                  <Area type="monotone" dataKey="calories" stroke="#7CFFB2" strokeWidth={2} fill="url(#cg)" name="Calories (kcal)" dot={{ r: 4, fill: '#7CFFB2' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '7-day Avg', value: trendData.length ? Math.round(trendData.reduce((a, d) => a + d.calories, 0) / trendData.length) : 0, unit: 'kcal/day' },
              { label: 'Peak Day', value: trendData.length ? Math.max(...trendData.map((d) => d.calories)) : 0, unit: 'kcal' },
              { label: 'Days On Track', value: gvaData.filter((d) => Math.abs(d.actual - d.goal) < 200).length, unit: `/ ${gvaData.length}` },
            ].map(({ label, value, unit }) => (
              <Card key={label} className="p-4 text-center">
                <p className="mono text-2xl font-bold text-accent">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xs text-muted-foreground/60">{unit}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Macros ─────────────────────────────────────────────────────────── */}
      {tab === 'macros' && (
        <div className="grid lg:grid-cols-2 gap-5 animate-fade-in">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Daily Macro Calories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macroChartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip {...TT_STYLE} />
                  <Bar dataKey="Protein" stackId="a" fill={MACRO_COLORS.protein} radius={[0,0,0,0]} />
                  <Bar dataKey="Carbs"   stackId="a" fill={MACRO_COLORS.carb}    radius={[0,0,0,0]} />
                  <Bar dataKey="Fat"     stackId="a" fill={MACRO_COLORS.fat}     radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Target Macro Split</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1B1B1E', border: '1px solid #26262A', borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#8B8B93' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ── Goal vs Actual ──────────────────────────────────────────────────── */}
      {tab === 'goals' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          {!goalVsActual.some((day) => day.goal) && !goal.dailyCalorieTarget ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Create a nutrition goal to compare your intake against a target.
            </Card>
          ) : (
          <>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Actual vs Goal Calories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={gvaData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip {...TT_STYLE} />
                  <Bar dataKey="actual" fill="#7CFFB2" opacity={0.8} radius={[4,4,0,0]} name="Actual (kcal)" />
                  <Line type="monotone" dataKey="goal" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Goal (kcal)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Days Under Goal</p>
              <p className="mono text-2xl font-bold text-accent">
                {gvaData.filter((d) => d.actual <= d.goal).length}
                <span className="text-sm text-muted-foreground"> / {gvaData.length}</span>
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Deficit / Surplus</p>
              <p className="mono text-2xl font-bold text-accent">
                {Math.round(
                  gvaData.length ? gvaData.reduce((acc, d) => acc + (d.goal - d.actual), 0) / gvaData.length : 0
                ).toLocaleString()}
                <span className="text-sm text-muted-foreground"> kcal/day</span>
              </p>
            </Card>
          </div>
          </>
          )}
        </div>
      )}

      {/* ── Micronutrients ─────────────────────────────────────────────────── */}
      {tab === 'micros' && (
        <Card className="p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-5">7-Day Micronutrient Summary</h3>
          <div className="flex flex-col gap-4">
            {microsData.map(({ name, value, target, pct }) => {
              const over = pct > 100
              const color = over ? '#EF4444' : pct > 70 ? '#7CFFB2' : '#F59E0B'
              return (
                <div key={name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{name}</span>
                    <div className="flex items-center gap-3">
                      <span className="mono text-xs text-muted-foreground">
                        {value} / {target}
                      </span>
                      <Badge variant={over ? 'danger' : pct > 70 ? 'accent' : 'warning'}>
                        {pct}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground/60 mt-5">
            * Daily targets based on general guidelines (NIH). Values are 7-day totals.
          </p>
        </Card>
      )}
    </div>
  )
}
