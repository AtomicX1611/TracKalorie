import { useEffect, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, Button, Input, Select } from './ui'
import { apiErrorMessage, toDateStr } from '../lib/utils'

const MICRONUTRIENT_OPTIONS = [
  { key: 'vitaminA_mcg', label: 'Vitamin A', unit: 'mcg' },
  { key: 'vitaminC_mg', label: 'Vitamin C', unit: 'mg' },
  { key: 'vitaminD_mcg', label: 'Vitamin D', unit: 'mcg' },
  { key: 'vitaminE_mg', label: 'Vitamin E', unit: 'mg' },
  { key: 'vitaminK_mcg', label: 'Vitamin K', unit: 'mcg' },
  { key: 'thiamin_mg', label: 'Thiamin (B1)', unit: 'mg' },
  { key: 'riboflavin_mg', label: 'Riboflavin (B2)', unit: 'mg' },
  { key: 'niacin_mg', label: 'Niacin (B3)', unit: 'mg' },
  { key: 'vitaminB6_mg', label: 'Vitamin B6', unit: 'mg' },
  { key: 'vitaminB12_mcg', label: 'Vitamin B12', unit: 'mcg' },
  { key: 'folate_mcg', label: 'Folate (B9)', unit: 'mcg' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'iron_mg', label: 'Iron', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
  { key: 'selenium_mcg', label: 'Selenium', unit: 'mcg' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  { key: 'fiber_g', label: 'Fiber', unit: 'g' },
  { key: 'sugar_g', label: 'Sugar', unit: 'g' },
]

const MICRONUTRIENT_BY_KEY = Object.fromEntries(
  MICRONUTRIENT_OPTIONS.map((nutrient) => [nutrient.key, nutrient])
)

const createEmptyItem = () => ({
  name: '', calories: '', quantity: { amount: '', unit: 'g' },
  macros: { proteinG: '', carbG: '', fatG: '' },
  micros: [{ nutrient: 'vitaminA_mcg', value: '' }],
})

function micronutrientEntries(micros = {}) {
  const entries = Object.entries(micros)
    .filter(([key, value]) => MICRONUTRIENT_BY_KEY[key] && value !== null && value !== undefined)
    .map(([nutrient, value]) => ({ nutrient, value }))
  return entries.length > 0 ? entries : [{ nutrient: 'vitaminA_mcg', value: '' }]
}

function MicronutrientFields({ itemIndex, control, register }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `items.${itemIndex}.micros`,
  })
  const micronutrientRows = useWatch({
    control,
    name: `items.${itemIndex}.micros`,
  }) ?? []

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Micronutrients</p>
          <p className="text-xs text-muted-foreground">Optional values per food item</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ nutrient: 'vitaminA_mcg', value: '' })}
        >
          <Plus className="w-3.5 h-3.5" /> Add nutrient
        </Button>
      </div>

      {fields.map((field, micronutrientIndex) => {
        const selectedKey = micronutrientRows[micronutrientIndex]?.nutrient ?? field.nutrient ?? 'vitaminA_mcg'
        const selected = MICRONUTRIENT_BY_KEY[selectedKey] ?? MICRONUTRIENT_OPTIONS[0]
        const usedByOtherRows = fields
          .map((_otherField, otherIndex) => micronutrientRows[otherIndex]?.nutrient)
          .filter((_nutrient, otherIndex) => otherIndex !== micronutrientIndex)

        return (
          <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_6rem_auto] gap-2 items-end">
            <Select label={micronutrientIndex === 0 ? 'Nutrient' : undefined} {...register(`items.${itemIndex}.micros.${micronutrientIndex}.nutrient`)}>
              {MICRONUTRIENT_OPTIONS.map((nutrient) => (
                <option
                  key={nutrient.key}
                  value={nutrient.key}
                  disabled={usedByOtherRows.includes(nutrient.key)}
                >
                  {nutrient.label}
                </option>
              ))}
            </Select>
            <Input
              label={micronutrientIndex === 0 ? `Value (${selected.unit})` : selected.unit}
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              {...register(`items.${itemIndex}.micros.${micronutrientIndex}.value`, { min: 0 })}
            />
            <button
              type="button"
              onClick={() => remove(micronutrientIndex)}
              disabled={fields.length === 1}
              className="mb-2 p-2 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Remove micronutrient"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default function AddMealModal({ open, onClose, onAdd, meal = null, onUpdate = null }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      mealType: 'breakfast',
      date: toDateStr(),
      items: [createEmptyItem()],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (!open) return
    setError(null)
    reset(meal ? {
      mealType: meal.mealType,
      date: meal.date.split('T')[0],
      items: meal.items.map((item) => ({
        name: item.name,
        calories: item.calories,
        quantity: item.quantity,
        macros: item.macros,
          micros: micronutrientEntries(item.micros),
      })),
    } : {
      mealType: 'breakfast',
      date: toDateStr(),
      items: [createEmptyItem()],
    })
  }, [open, meal, reset])

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      // Coerce string numbers to actual numbers
      const mealData = {
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
              ...(item.macros.fatG === '' || item.macros.fatG == null ? {} : { fatG: Number(item.macros.fatG) }),
          },
          micros: Object.fromEntries(
            (item.micros ?? [])
              .filter((micronutrient) => micronutrient.nutrient && micronutrient.value !== '')
              .map((micronutrient) => [micronutrient.nutrient, Number(micronutrient.value)])
          ),
        })),
      }
      // Compute totals
      if (meal && onUpdate) await onUpdate(meal._id, mealData)
      else await onAdd?.(mealData)
      reset()
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to save this meal. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={meal ? 'Edit Meal' : 'Log a Meal'} width="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
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
              onClick={() => append(createEmptyItem())}
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
                  {...register(`items.${i}.calories`, { required: 'Required', min: { value: 1, message: 'Must be greater than zero' } })}
                  error={errors.items?.[i]?.calories?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  min="0"
                  placeholder="100"
                  {...register(`items.${i}.quantity.amount`, { required: 'Required', min: { value: 0.01, message: 'Must be greater than zero' } })}
                  error={errors.items?.[i]?.quantity?.amount?.message}
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
                  {...register(`items.${i}.macros.proteinG`, { required: 'Required', min: { value: 0.01, message: 'Must be greater than zero' } })}
                  error={errors.items?.[i]?.macros?.proteinG?.message}
                />
                <Input
                  label="Carbs (g)"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="40"
                  {...register(`items.${i}.macros.carbG`, { required: 'Required', min: { value: 0.01, message: 'Must be greater than zero' } })}
                  error={errors.items?.[i]?.macros?.carbG?.message}
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

              <MicronutrientFields itemIndex={i} control={control} register={register} />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{meal ? 'Save Changes' : 'Log Meal'}</Button>
        </div>
      </form>
    </Modal>
  )
}
