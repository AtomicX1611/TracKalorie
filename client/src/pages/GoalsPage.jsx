import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Target, Plus, CheckCircle2, Clock } from 'lucide-react'
import { Button, Card, SectionHeader, Badge, Input } from '../components/ui'
import { apiErrorMessage, formatDateLong, fmt } from '../lib/utils'
import { goalsApi } from '../api'

const EMPTY_GOAL = {
  dailyCalorieTarget: 0,
  proteinTargetG: 0,
  carbTargetG: 0,
  fatTargetG: 0,
}

function GoalForm({ onSave, initialGoal }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      dailyCalorieTarget: initialGoal.dailyCalorieTarget,
      proteinTargetG: initialGoal.proteinTargetG,
      carbTargetG: initialGoal.carbTargetG,
      fatTargetG: initialGoal.fatTargetG,
      weightGoalKg: '',
    },
  })

  useEffect(() => {
    reset({
      dailyCalorieTarget: initialGoal.dailyCalorieTarget,
      proteinTargetG: initialGoal.proteinTargetG,
      carbTargetG: initialGoal.carbTargetG,
      fatTargetG: initialGoal.fatTargetG,
      weightGoalKg: initialGoal.weightGoalKg ?? '',
    })
  }, [initialGoal, reset])

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Daily Calorie Target (kcal)"
            type="number"
            min="0"
            max="10000"
            {...register('dailyCalorieTarget', { required: 'Required', min: { value: 1, message: 'Must be greater than zero' } })}
            error={errors.dailyCalorieTarget?.message}
          />
        </div>
        <Input
          label="Protein Target (g)"
          type="number"
          min="0"
          {...register('proteinTargetG', { required: 'Required', min: { value: 0.01, message: 'Must be greater than zero' } })}
          error={errors.proteinTargetG?.message}
        />
        <Input
          label="Carb Target (g)"
          type="number"
          min="0"
          {...register('carbTargetG', { required: 'Required', min: { value: 0.01, message: 'Must be greater than zero' } })}
          error={errors.carbTargetG?.message}
        />
        <Input
          label="Fat Target (g)"
          type="number"
          min="0"
          {...register('fatTargetG', { min: 0 })}
          error={errors.fatTargetG?.message}
        />
        <Input
          label="Weight Goal (kg, optional)"
          type="number"
          min="0"
          step="0.1"
          {...register('weightGoalKg', { min: 0 })}
        />
      </div>
      <div className="flex justify-end pt-2 border-t border-border">
        <Button type="submit">
          <CheckCircle2 className="w-4 h-4" /> Save New Goal
        </Button>
      </div>
    </form>
  )
}

export default function GoalsPage() {
  const [goal, setGoal] = useState(EMPTY_GOAL)
  const [history, setHistory] = useState([])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setError(null)
    Promise.all([goalsApi.getCurrent(), goalsApi.getHistory({ limit: 100 })])
      .then(([currentGoal, historyResult]) => {
        if (currentGoal) setGoal(currentGoal)
        setHistory(historyResult.data ?? [])
      })
      .catch((err) => {
        setHistory([])
        setError(err?.response?.data?.error?.message ?? 'Unable to load goals.')
      })
  }, [refreshKey])

  // ── Live sync: re-fetch when the AI chat sets a new goal ───────────────
  useEffect(() => {
    const handler = (e) => {
      const actions = e.detail?.actions ?? []
      if (actions.includes('set_goal')) {
        setRefreshKey((k) => k + 1)
        // Also show the saved banner briefly so user knows it's reflected
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    }
    window.addEventListener('trackalorie:data-changed', handler)
    return () => window.removeEventListener('trackalorie:data-changed', handler)
  }, [])

  const handleSave = async (data) => {
    try {
      setError(null)
      const newGoal = await goalsApi.create(
        Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' || v === undefined ? undefined : Number(v)]))
      )
      setHistory((h) => [newGoal, ...h])
      setGoal(newGoal)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to save this goal.'))
    }
  }

  const fatTargetG = goal.fatTargetG ?? 0
  const macroCalories = goal.proteinTargetG * 4 + goal.carbTargetG * 4 + fatTargetG * 9
  const macroCaloriesForDisplay = macroCalories || 1

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <SectionHeader
        title="Nutrition Goals"
        subtitle="Effective-dated — changes don't overwrite history"
        action={<Target className="w-5 h-5 text-accent" />}
      />

      {error && <p className="mb-5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

      {saved && (
        <div className="mb-5 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent">
          <CheckCircle2 className="w-4 h-4" />
          New goal saved and effective immediately.
        </div>
      )}

      {/* Current goal summary */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Current Goal</h3>
          <Badge variant="accent">Active</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Calories', value: goal.dailyCalorieTarget, unit: 'kcal/day', color: '#7CFFB2' },
            { label: 'Protein',  value: goal.proteinTargetG,    unit: 'g/day',    color: '#7CFFB2' },
            { label: 'Carbs',    value: goal.carbTargetG,       unit: 'g/day',    color: '#60A5FA' },
            { label: 'Fat',      value: goal.fatTargetG ?? 0,   unit: 'g/day',    color: '#F59E0B' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="card p-3 text-center">
              <p className="mono text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              <p className="text-xs text-muted-foreground/60">{unit}</p>
            </div>
          ))}
        </div>

        {/* Macro distribution */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Macro calorie distribution</p>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {[
              { label: 'Protein', g: goal.proteinTargetG, cal: goal.proteinTargetG * 4, color: '#7CFFB2' },
              { label: 'Carbs',   g: goal.carbTargetG,   cal: goal.carbTargetG * 4,   color: '#60A5FA' },
              { label: 'Fat',     g: fatTargetG,          cal: fatTargetG * 9,          color: '#F59E0B' },
            ].map(({ label, cal, color }) => (
              <div
                key={label}
                style={{ flex: cal / macroCaloriesForDisplay, background: color }}
                title={`${label}: ${Math.round((cal / macroCaloriesForDisplay) * 100)}%`}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            {[
              { label: 'Protein', cal: goal.proteinTargetG * 4, color: '#7CFFB2' },
              { label: 'Carbs',   cal: goal.carbTargetG * 4,   color: '#60A5FA' },
              { label: 'Fat',     cal: fatTargetG * 9,          color: '#F59E0B' },
            ].map(({ label, cal, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs text-muted-foreground">
                  {label} <span className="mono" style={{ color }}>{Math.round((cal / macroCaloriesForDisplay) * 100)}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Set new goal */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Set New Goal</h3>
          <span className="text-xs text-muted-foreground">(previous goals are preserved)</span>
        </div>
        <GoalForm onSave={handleSave} initialGoal={goal} />
      </Card>

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Goal History</h3>
        </div>
        <div className="flex flex-col gap-2">
          {history.map((g, i) => (
            <div key={g._id} className="card flex items-center justify-between px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground mono">{g.dailyCalorieTarget} kcal/day</p>
                  {i === 0 && <Badge variant="accent">Current</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fmt(g.proteinTargetG)}P · {fmt(g.carbTargetG)}C · {fmt(g.fatTargetG ?? 0)}F
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                From {formatDateLong(g.effectiveFrom)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
