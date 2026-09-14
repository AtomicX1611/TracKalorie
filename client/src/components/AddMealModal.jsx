import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, Button, Input, Select } from './ui'
import { toDateStr } from '../lib/utils'

const EMPTY_ITEM = {
  name: '', calories: '', quantity: { amount: '', unit: 'g' },
  macros: { proteinG: '', carbG: '', fatG: '' },
}

export default function AddMealModal({ open, onClose, onAdd }) {
  const [submitting, setSubmitting] = useState(false)

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      mealType: 'breakfast',
      date: toDateStr(),
      items: [{ ...EMPTY_ITEM }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      // Coerce string numbers to actual numbers
      const meal = {
        _id: `m_${Date.now()}`,
        mealType: data.mealType,
        date: data.date,
        source: 'manual',
        items: data.items.map((item) => ({
          name: item.name,
          calories: Number(item.calories),
          quantity: { amount: Number(item.quantity.amount), unit: item.quantity.unit },
          macros: {
            proteinG: Number(item.macros.proteinG),
            carbG: Number(item.macros.carbG),
            fatG: Number(item.macros.fatG),
          },
        })),
      }
      // Compute totals
      meal.totals = meal.items.reduce(
        (acc, it) => ({
          calories: acc.calories + it.calories,
          proteinG: acc.proteinG + it.macros.proteinG,
          carbG: acc.carbG + it.macros.carbG,
          fatG: acc.fatG + it.macros.fatG,
        }),
        { calories: 0, proteinG: 0, carbG: 0, fatG: 0 }
      )
      await onAdd?.(meal)
      reset()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log a Meal" width="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Meal meta */}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Meal type" {...register('mealType', { required: true })}>
            {['breakfast','lunch','dinner','snack'].map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </Select>
          <Input
            label="Date"
            type="date"
            {...register('date', { required: true })}
          />
        </div>

        {/* Food items */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Food Items</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ ...EMPTY_ITEM })}
            >
              <Plus className="w-3.5 h-3.5" /> Add item
            </Button>
          </div>

          {fields.map((field, i) => (
            <div key={field.id} className="card p-4 flex flex-col gap-3 relative">
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input
                    label="Food name"
                    placeholder="e.g. Grilled chicken"
                    {...register(`items.${i}.name`, { required: 'Required' })}
                    error={errors.items?.[i]?.name?.message}
                  />
                </div>
                <Input
                  label="Calories"
                  type="number"
                  min="0"
                  placeholder="350"
                  {...register(`items.${i}.calories`, { required: 'Required', min: 0 })}
                  error={errors.items?.[i]?.calories?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  min="0"
                  placeholder="100"
                  {...register(`items.${i}.quantity.amount`, { min: 0 })}
                />
                <Select label="Unit" {...register(`items.${i}.quantity.unit`)}>
                  {['g','ml','oz','cup','tbsp','tsp','piece','bar','serving'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Protein (g)"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="25"
                  {...register(`items.${i}.macros.proteinG`, { min: 0 })}
                />
                <Input
                  label="Carbs (g)"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="40"
                  {...register(`items.${i}.macros.carbG`, { min: 0 })}
                />
                <Input
                  label="Fat (g)"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="10"
                  {...register(`items.${i}.macros.fatG`, { min: 0 })}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>Log Meal</Button>
        </div>
      </form>
    </Modal>
  )
}
