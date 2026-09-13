import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Target, Plus, CheckCircle2, Clock } from 'lucide-react'
import { Button, Card, SectionHeader, Badge, Input } from '../components/ui'
import { formatDateLong, fmt } from '../lib/utils'
import { dummyGoal, dummyGoalHistory } from '../lib/dummyData'

function GoalForm({ onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      dailyCalorieTarget: dummyGoal.dailyCalorieTarget,
      proteinTargetG: dummyGoal.proteinTargetG,
      carbTargetG: dummyGoal.carbTargetG,
      fatTargetG: dummyGoal.fatTargetG,
      weightGoalKg: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Daily Calorie Target (kcal)"
            type="number"
            min="0"
            max="10000"
            {...register('dailyCalorieTarget', { required: 'Required', min: 0 })}
            error={errors.dailyCalorieTarget?.message}
          />
        </div>
        <Input
          label="Protein Target (g)"
          type="number"
          min="0"
          {...register('proteinTargetG', { required: 'Required', min: 0 })}
          error={errors.proteinTargetG?.message}
        />
        <Input
          label="Carb Target (g)"
          type="number"
          min="0"
          {...register('carbTargetG', { required: 'Required', min: 0 })}
          error={errors.carbTargetG?.message}
        />
        <Input
          label="Fat Target (g)"
          type="number"
          min="0"
          {...register('fatTargetG', { required: 'Required', min: 0 })}
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
  const [goal, setGoal] = useState(dummyGoal)
  const [history, setHistory] = useState(dummyGoalHistory)
  const [saved, setSaved] = useState(false)

  const handleSave = (data) => {
    const newGoal = {
      _id: `g_${Date.now()}`,
      ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : Number(v)])),
      effectiveFrom: new Date().toISOString().split('T')[0],
    }
    setHistory((h) => [newGoal, ...h])
    setGoal(newGoal)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const macroCalories = goal.proteinTargetG * 4 + goal.carbTargetG * 4 + goal.fatTargetG * 9

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <SectionHeader
        title="Nutrition Goals"
        subtitle="Effective-dated — changes don't overwrite history"
        action={<Target className="w-5 h-5 text-accent" />}
      />

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
            { label: 'Fat',      value: goal.fatTargetG,        unit: 'g/day',    color: '#F59E0B' },
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
              { label: 'Fat',     g: goal.fatTargetG,    cal: goal.fatTargetG * 9,    color: '#F59E0B' },
            ].map(({ label, cal, color }) => (
              <div
                key={label}
                style={{ flex: cal / macroCalories, background: color }}
                title={`${label}: ${Math.round((cal / macroCalories) * 100)}%`}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            {[
              { label: 'Protein', cal: goal.proteinTargetG * 4, color: '#7CFFB2' },
              { label: 'Carbs',   cal: goal.carbTargetG * 4,   color: '#60A5FA' },
              { label: 'Fat',     cal: goal.fatTargetG * 9,    color: '#F59E0B' },
            ].map(({ label, cal, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs text-muted-foreground">
                  {label} <span className="mono" style={{ color }}>{Math.round((cal / macroCalories) * 100)}%</span>
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
        <GoalForm onSave={handleSave} />
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
                  {fmt(g.proteinTargetG)}P · {fmt(g.carbTargetG)}C · {fmt(g.fatTargetG)}F
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
