import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Card, SectionHeader, Select } from '../components/ui'
import { formatDate, MACRO_COLORS, toDateStr } from '../lib/utils'
import { goalsApi, nutritionApi } from '../api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ComposedChart, Line, LineChart, Cell, PieChart, Pie, Legend,
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
  vitaminD_mcg: 15,
  vitaminE_mg: 15,
  vitaminK_mcg: 120,
  thiamin_mg: 1.2,
  riboflavin_mg: 1.3,
  niacin_mg: 16,
  vitaminB6_mg: 1.3,
  vitaminB12_mcg: 2.4,
  folate_mcg: 400,
  calcium_mg: 1000,
  iron_mg: 18,
  magnesium_mg: 400,
  potassium_mg: 4700,
  zinc_mg: 11,
  selenium_mcg: 55,
  sodium_mg: 2300,
  fiber_g: 30,
  sugar_g: 50,
}

const MICRO_LABELS = {
  vitaminA_mcg: 'Vitamin A',
  vitaminC_mg: 'Vitamin C',
  vitaminD_mcg: 'Vitamin D',
  vitaminE_mg: 'Vitamin E',
  vitaminK_mcg: 'Vitamin K',
  thiamin_mg: 'Thiamin (B1)',
  riboflavin_mg: 'Riboflavin (B2)',
  niacin_mg: 'Niacin (B3)',
  vitaminB6_mg: 'Vitamin B6',
  vitaminB12_mcg: 'Vitamin B12',
  folate_mcg: 'Folate (B9)',
  calcium_mg: 'Calcium',
  iron_mg: 'Iron',
  magnesium_mg: 'Magnesium',
  potassium_mg: 'Potassium',
  zinc_mg: 'Zinc',
  selenium_mcg: 'Selenium',
  sodium_mg: 'Sodium',
  fiber_g: 'Fiber',
  sugar_g: 'Sugar',
}

const MICRO_UNITS = {
  vitaminA_mcg: 'mcg', vitaminC_mg: 'mg', vitaminD_mcg: 'mcg', vitaminE_mg: 'mg',
  vitaminK_mcg: 'mcg', thiamin_mg: 'mg', riboflavin_mg: 'mg', niacin_mg: 'mg',
  vitaminB6_mg: 'mg', vitaminB12_mcg: 'mcg', folate_mcg: 'mcg', calcium_mg: 'mg',
  iron_mg: 'mg', magnesium_mg: 'mg', potassium_mg: 'mg', zinc_mg: 'mg',
  selenium_mcg: 'mcg', sodium_mg: 'mg', fiber_g: 'g', sugar_g: 'g',
}

export default function ReportsPage() {
  const [tab, setTab] = useState('trend')
  const [weeklyTrend, setWeeklyTrend] = useState([])
  const [goalVsActual, setGoalVsActual] = useState([])
  const [macros, setMacros] = useState([])
  const [micros, setMicros] = useState([])
  const [selectedMicro, setSelectedMicro] = useState('vitaminC_mg')
  const [goal, setGoal] = useState({ dailyCalorieTarget: 0, proteinTargetG: 0, carbTargetG: 0, fatTargetG: 0 })
  const [includeMissingDays, setIncludeMissingDays] = useState(true)
  const [reportRange, setReportRange] = useState({ from: '', to: '' })
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

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
  }, [refreshKey])

  // ── Live sync: re-fetch when the AI chat writes meal or goal data ────────
  useEffect(() => {
    const REPORTS_TRIGGERS = ['log_meal', 'delete_meal', 'set_goal']
    const handler = (e) => {
      const actions = e.detail?.actions ?? []
      if (actions.some((a) => REPORTS_TRIGGERS.includes(a))) {
        setRefreshKey((k) => k + 1)
      }
    }
    window.addEventListener('trackalorie:data-changed', handler)
    return () => window.removeEventListener('trackalorie:data-changed', handler)
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
  const selectedMicroTarget = MICROS_DAILY_TARGETS[selectedMicro]
  const selectedMicroUnit = MICRO_UNITS[selectedMicro]
  const microChartData = microDays.map((day) => ({
    day: formatDate(day.day),
    value: Number(day[selectedMicro] ?? 0),
    target: selectedMicroTarget,
  }))
  const microAverage = microChartData.length
    ? microChartData.reduce((total, day) => total + day.value, 0) / microChartData.length
    : 0
  const microAveragePct = selectedMicroTarget > 0
    ? Math.round((microAverage / selectedMicroTarget) * 100)
    : 0

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
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">7-Day Micronutrient Trend</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Select one nutrient to inspect daily consumption without a long list.
              </p>
            </div>
            <Select
              label="Nutrient"
              value={selectedMicro}
              onChange={(event) => setSelectedMicro(event.target.value)}
              className="sm:w-56"
            >
              {Object.entries(MICRO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={microChartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  {...TT_STYLE}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)} ${selectedMicroUnit}`,
                    name === 'value' ? MICRO_LABELS[selectedMicro] : 'Daily target',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#7CFFB2"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#7CFFB2' }}
                  activeDot={{ r: 6 }}
                  name="value"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={false}
                  name="target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="border border-border rounded-lg p-4 text-center">
              <p className="mono text-2xl font-bold text-accent">{microAverage.toFixed(1)} {selectedMicroUnit}</p>
              <p className="text-xs text-muted-foreground">7-day daily average</p>
            </div>
            <div className="border border-border rounded-lg p-4 text-center">
              <p className="mono text-2xl font-bold text-accent">{microAveragePct}%</p>
              <p className="text-xs text-muted-foreground">Average of {selectedMicroTarget} {selectedMicroUnit} target</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60 mt-5">
            * Daily targets are general reference values. The dashed line shows the selected nutrient&apos;s daily target.
          </p>
        </Card>
      )}
    </div>
  )
}
