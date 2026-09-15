import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  DownloadCloud,
} from 'lucide-react'
import { Modal, Button } from './ui'
import { importsApi } from '../api'
import { toDateStr } from '../lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const VALID_UNITS = ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'bar', 'serving']

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  RESULT: 'result',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(val, min = 0, max = Infinity) {
  const n = parseFloat(val)
  if (isNaN(n)) return 0
  return Math.max(min, Math.min(max, n))
}

function rowIsComplete(row) {
  return (
    row.name?.trim() &&
    row.calories !== null && row.calories !== '' && !isNaN(Number(row.calories)) &&
    row.protein_g !== null && row.protein_g !== '' && !isNaN(Number(row.protein_g)) &&
    row.carbs_g !== null && row.carbs_g !== '' && !isNaN(Number(row.carbs_g)) &&
    row.fat_g !== null && row.fat_g !== '' && !isNaN(Number(row.fat_g))
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Single editable row in the preview table */
function PreviewRow({ row, index, included, onToggle, onEdit, defaultDate, defaultMealType }) {
  const [expanded, setExpanded] = useState(false)
  const complete = rowIsComplete(row)
  const hasWarnings = row._warnings?.length > 0
  const hasErrors = !row._valid || !complete

  const effectiveDate = row.date || defaultDate
  const effectiveMealType = row.meal_type || defaultMealType

  const baseRowClass = hasErrors
    ? 'bg-destructive/5 border border-destructive/20'
    : hasWarnings
    ? 'bg-warning/5 border border-warning/20'
    : 'bg-surface border border-border'

  return (
    <div
      className={`rounded-lg transition-all duration-200 ${baseRowClass} ${
        !included ? 'opacity-40' : ''
      }`}
    >
      {/* Row header */}
      <div className="flex items-center gap-2 p-3">
        {/* Toggle checkbox */}
        <button
          type="button"
          onClick={() => onToggle(index)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
            included
              ? 'bg-accent border-accent'
              : 'bg-transparent border-border hover:border-muted-foreground'
          }`}
          aria-label={included ? 'Exclude row' : 'Include row'}
        >
          {included && (
            <svg viewBox="0 0 10 10" className="w-full h-full p-0.5">
              <polyline
                points="1.5,5 4,7.5 8.5,2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-background"
              />
            </svg>
          )}
        </button>

        {/* Row number */}
        <span className="text-xs text-muted-foreground font-mono w-6 flex-shrink-0">
          {index + 1}
        </span>

        {/* Status icon */}
        <span className="flex-shrink-0">
          {hasErrors ? (
            <XCircle className="w-4 h-4 text-destructive" />
          ) : hasWarnings ? (
            <AlertTriangle className="w-4 h-4 text-warning" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-accent" />
          )}
        </span>

        {/* Name (editable inline) */}
        <input
          value={row.name ?? ''}
          onChange={(e) => onEdit(index, 'name', e.target.value)}
          placeholder="Food name (required)"
          className={`flex-1 bg-transparent text-sm text-foreground outline-none border-b border-transparent focus:border-accent transition-colors min-w-0 ${
            !row.name?.trim() ? 'placeholder:text-destructive' : ''
          }`}
        />

        {/* Quick macro summary */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
          <span>{row.calories ?? '—'} kcal</span>
          <span className="text-accent">{row.protein_g ?? '—'}P</span>
          <span className="text-blue-400">{row.carbs_g ?? '—'}C</span>
          <span className="text-yellow-400">{row.fat_g ?? '—'}F</span>
        </div>

        {/* Date + mealtype pills */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-muted-foreground border border-border">
            {effectiveDate}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-muted-foreground border border-border capitalize">
            {effectiveMealType}
          </span>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Expand row"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Error / warning messages */}
      {included && (hasErrors || hasWarnings) && (
        <div className="px-3 pb-2 flex flex-col gap-1">
          {hasErrors && !complete && (
            <p className="text-xs text-destructive">
              ⚠ Required fields missing: fill in all macro values below to enable this row for import.
            </p>
          )}
          {row._errors?.map((e, i) => (
            <p key={i} className="text-xs text-destructive">{e}</p>
          ))}
          {row._warnings?.map((w, i) => (
            <p key={i} className="text-xs text-warning">{w}</p>
          ))}
        </div>
      )}

      {/* Expanded edit fields */}
      {expanded && (
        <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 border-t border-border/50 pt-3">
          {/* Calories */}
          <FieldInput
            label="Calories"
            required
            value={row.calories ?? ''}
            onChange={(v) => onEdit(index, 'calories', v === '' ? '' : clamp(parseFloat(v), 0, 10000))}
          />
          {/* Protein */}
          <FieldInput
            label="Protein (g)"
            required
            value={row.protein_g ?? ''}
            onChange={(v) => onEdit(index, 'protein_g', v === '' ? '' : clamp(parseFloat(v), 0, 1000))}
          />
          {/* Carbs */}
          <FieldInput
            label="Carbs (g)"
            required
            value={row.carbs_g ?? ''}
            onChange={(v) => onEdit(index, 'carbs_g', v === '' ? '' : clamp(parseFloat(v), 0, 2000))}
          />
          {/* Fat */}
          <FieldInput
            label="Fat (g)"
            required
            value={row.fat_g ?? ''}
            onChange={(v) => onEdit(index, 'fat_g', v === '' ? '' : clamp(parseFloat(v), 0, 1000))}
          />
          {/* Date (overrides default) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Date</label>
            <input
              type="date"
              value={row.date ?? ''}
              onChange={(e) => onEdit(index, 'date', e.target.value || null)}
              placeholder={defaultDate}
              className="w-full px-2 py-1.5 rounded-md text-xs bg-surface border border-border focus:border-accent outline-none transition-all"
            />
            {!row.date && (
              <p className="text-xs text-muted-foreground/60">Using default: {defaultDate}</p>
            )}
          </div>
          {/* Meal type (overrides default) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Meal type</label>
            <select
              value={row.meal_type ?? ''}
              onChange={(e) => onEdit(index, 'meal_type', e.target.value || null)}
              className="w-full px-2 py-1.5 rounded-md text-xs bg-surface border border-border focus:border-accent outline-none transition-all capitalize"
            >
              <option value="">Use default ({defaultMealType})</option>
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
          {/* Quantity */}
          <FieldInput
            label="Qty amount"
            type="number"
            value={row.quantity_amount ?? ''}
            onChange={(v) => onEdit(index, 'quantity_amount', v === '' ? null : clamp(parseFloat(v), 0))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">Qty unit</label>
            <select
              value={row.quantity_unit ?? 'serving'}
              onChange={(e) => onEdit(index, 'quantity_unit', e.target.value)}
              className="w-full px-2 py-1.5 rounded-md text-xs bg-surface border border-border focus:border-accent outline-none transition-all"
            >
              {VALID_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function FieldInput({ label, value, onChange, required, type = 'number' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 'any' : undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`w-full px-2 py-1.5 rounded-md text-xs bg-surface border focus:outline-none transition-all ${
          required && (value === '' || value === null || value === undefined)
            ? 'border-destructive/60 focus:border-destructive'
            : 'border-border focus:border-accent'
        }`}
      />
    </div>
  )
}

// ── Dropzone ──────────────────────────────────────────────────────────────────
function CsvDropzone({ onFile, loading }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file.')
      return
    }
    onFile(file)
  }

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      handleFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-4
        rounded-2xl border-2 border-dashed p-10 cursor-pointer
        transition-all duration-200 select-none
        ${dragging
          ? 'border-accent bg-accent/10 scale-[1.01]'
          : 'border-border bg-surface hover:border-accent/50 hover:bg-surface-elevated'
        }
        ${loading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Animated icon */}
      <div className={`relative ${dragging ? 'scale-110' : ''} transition-transform duration-200`}>
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <FileText className="w-8 h-8 text-accent" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Upload className="w-3 h-3 text-accent" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">
          {dragging ? 'Drop your CSV here' : 'Upload Food Diary CSV'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Drag & drop or click to browse · CSV only · Max 5 MB
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Required columns: Name, Calories, Protein, Carbs, Fat
        </p>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground font-medium">Parsing PDF…</p>
          <p className="text-xs text-muted-foreground">Reading your food diary</p>
        </div>
      )}
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function BulkPdfImportModal({ open, onClose, onImported }) {
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [parsing, setParsing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [confirmError, setConfirmError] = useState(null)

  const [parsedData, setParsedData] = useState(null)   // { rows, tableHeaders, pageCount, warnings }
  const [editedRows, setEditedRows] = useState([])      // user-editable copy of rows
  const [included, setIncluded] = useState([])          // boolean[] per row

  const [defaultDate, setDefaultDate] = useState(toDateStr())
  const [defaultMealType, setDefaultMealType] = useState('snack')

  const [result, setResult] = useState(null)            // { imported, failed, errors }

  // ── Reset on close ──────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(STEPS.UPLOAD)
    setParsing(false)
    setConfirming(false)
    setParseError(null)
    setConfirmError(null)
    setParsedData(null)
    setEditedRows([])
    setIncluded([])
    setDefaultDate(toDateStr())
    setDefaultMealType('snack')
    setResult(null)
    onClose()
  }

  // ── Step 1: Upload & parse ──────────────────────────────────────────────────
  const handleFile = async (file) => {
    setParsing(true)
    setParseError(null)
    try {
      const data = await importsApi.parseCsv(file)
      setParsedData(data)
      // Deep-clone rows for editing
      const cloned = data.rows.map((r) => ({ ...r }))
      setEditedRows(cloned)
      // All valid rows included by default; invalid rows excluded
      setIncluded(cloned.map((r) => r._valid && rowIsComplete(r)))
      setStep(STEPS.PREVIEW)
    } catch (err) {
      setParseError(
        err?.response?.data?.error?.message ??
          'Failed to parse the CSV. Make sure it has the required nutrition columns.',
      )
    } finally {
      setParsing(false)
    }
  }

  // ── Row editing helpers ─────────────────────────────────────────────────────
  const handleToggle = (idx) => {
    setIncluded((prev) => {
      const next = [...prev]
      next[idx] = !next[idx]
      return next
    })
  }

  const handleEdit = (idx, field, value) => {
    setEditedRows((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      // If all required fields are now filled, re-enable the row
      return next
    })
    // Auto-enable row if it becomes complete after edit
    setIncluded((prev) => {
      const next = [...prev]
      if (!next[idx]) {
        const updatedRow = { ...editedRows[idx], [field]: value }
        if (rowIsComplete(updatedRow)) next[idx] = true
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setIncluded(editedRows.map((r) => rowIsComplete(r)))
  }
  const handleDeselectAll = () => setIncluded(editedRows.map(() => false))

  // ── Step 2: Confirm & import ────────────────────────────────────────────────
  const handleConfirm = async () => {
    const rowsToImport = editedRows
      .filter((_, i) => included[i])
      .map((r) => ({
        name: r.name,
        calories: Number(r.calories),
        protein_g: Number(r.protein_g),
        carbs_g: Number(r.carbs_g),
        fat_g: Number(r.fat_g),
        date: r.date || null,
        meal_type: r.meal_type || null,
        quantity_amount: r.quantity_amount != null ? Number(r.quantity_amount) : null,
        quantity_unit: r.quantity_unit || null,
        // micronutrients
        sodium_mg: r.sodium_mg ?? undefined,
        fiber_g: r.fiber_g ?? undefined,
        sugar_g: r.sugar_g ?? undefined,
        calcium_mg: r.calcium_mg ?? undefined,
        iron_mg: r.iron_mg ?? undefined,
        vitaminA_mcg: r.vitaminA_mcg ?? undefined,
        vitaminC_mg: r.vitaminC_mg ?? undefined,
        vitaminD_mcg: r.vitaminD_mcg ?? undefined,
        magnesium_mg: r.magnesium_mg ?? undefined,
        potassium_mg: r.potassium_mg ?? undefined,
        zinc_mg: r.zinc_mg ?? undefined,
        selenium_mcg: r.selenium_mcg ?? undefined,
        vitaminE_mg: r.vitaminE_mg ?? undefined,
        vitaminK_mcg: r.vitaminK_mcg ?? undefined,
        thiamin_mg: r.thiamin_mg ?? undefined,
        riboflavin_mg: r.riboflavin_mg ?? undefined,
        niacin_mg: r.niacin_mg ?? undefined,
        vitaminB6_mg: r.vitaminB6_mg ?? undefined,
        vitaminB12_mcg: r.vitaminB12_mcg ?? undefined,
        folate_mcg: r.folate_mcg ?? undefined,
      }))

    if (rowsToImport.length === 0) {
      setConfirmError('No rows selected for import. Toggle rows on or fix required fields.')
      return
    }

    setConfirming(true)
    setConfirmError(null)
    try {
      const data = await importsApi.confirmImport(rowsToImport, defaultDate, defaultMealType)
      setResult(data)
      setStep(STEPS.RESULT)
      onImported?.(data.imported)
    } catch (err) {
      setConfirmError(
        err?.response?.data?.error?.message ?? 'Import failed. Please try again.',
      )
    } finally {
      setConfirming(false)
    }
  }

  // ── Computed ────────────────────────────────────────────────────────────────
  const includedCount = included.filter(Boolean).length
  const totalRows = editedRows.length
  const validCount = editedRows.filter((r) => r._valid && rowIsComplete(r)).length
  const warningCount = editedRows.filter((r) => r._valid && r._warnings?.length > 0).length
  const invalidCount = editedRows.filter((r) => !r._valid || !rowIsComplete(r)).length

  const modalTitle =
    step === STEPS.UPLOAD
      ? 'Import from CSV'
      : step === STEPS.PREVIEW
      ? `Preview Import (${totalRows} rows detected)`
      : 'Import Complete'

  return (
    <Modal open={open} onClose={handleClose} title={modalTitle} width="max-w-4xl">
      {/* ─── STEP 1: UPLOAD ───────────────────────────────────────────────── */}
      {step === STEPS.UPLOAD && (
        <div className="flex flex-col gap-5">
          <CsvDropzone onFile={handleFile} loading={parsing} />

          {parseError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{parseError}</p>
            </div>
          )}

          {/* Format guide */}
          <div className="rounded-lg bg-surface border border-border p-4">
            <p className="text-xs font-semibold text-foreground mb-2">Supported CSV Format</p>
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '220px' }}>
              <table className="text-xs text-muted-foreground w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1 pr-4 font-medium text-foreground">Column</th>
                    <th className="text-left py-1 pr-4 font-medium text-foreground">Required?</th>
                    <th className="text-left py-1 font-medium text-foreground">Accepted names</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    ['Food Name', '✓ Yes', 'Food, Item, Meal, Food Item, Description, Name'],
                    ['Calories', '✓ Yes', 'Calories, Energy, Cal, kcal, Cals, Energy (kcal)'],
                    ['Protein (g)', '✓ Yes', 'Protein, Prot, Pro, Protein (g), Pro (g)'],
                    ['Carbs (g)', '✓ Yes', 'Carbohydrates, Carbs, Carb (g), Total Carbs, Net Carbs'],
                    ['Fat (g)', '✓ Yes', 'Fat, Total Fat, Fat (g), Fats (g), Lipids'],
                    ['Date', 'Optional', 'Date, Day, Logged On, Log Date, Entry Date'],
                    ['Meal Type', 'Optional', 'Meal, Meal Type, Category, Type, Meal Name'],
                    ['Quantity', 'Optional', 'Serving Size, Amount, Qty, Quantity, Portion'],
                    ['Sodium (mg)', 'Optional', 'Sodium, Sodium (mg), Na, Salt'],
                    ['Fiber (g)', 'Optional', 'Fiber, Dietary Fiber, Fibre, Fiber (g)'],
                    ['Sugar (g)', 'Optional', 'Sugar, Sugars, Total Sugar, Sugar (g)'],
                    ['Calcium (mg)', 'Optional', 'Calcium, Calcium (mg), Ca'],
                    ['Iron (mg)', 'Optional', 'Iron, Iron (mg), Fe'],
                    ['Vitamin A (mcg)', 'Optional', 'Vitamin A, Vit A, Vitamin A (mcg), Retinol'],
                    ['Vitamin C (mg)', 'Optional', 'Vitamin C, Vit C, Vitamin C (mg), Ascorbic Acid'],
                    ['Vitamin D (mcg)', 'Optional', 'Vitamin D, Vit D, Vitamin D (mcg), Cholecalciferol'],
                    ['Vitamin E (mg)', 'Optional', 'Vitamin E, Vit E, Vitamin E (mg), Alpha-Tocopherol'],
                    ['Vitamin K (mcg)', 'Optional', 'Vitamin K, Vit K, Vitamin K (mcg)'],
                    ['Thiamin (mg)', 'Optional', 'Thiamin, Thiamine, Thiamin (mg), Vitamin B1, B1'],
                    ['Riboflavin (mg)', 'Optional', 'Riboflavin, Riboflavin (mg), Vitamin B2, B2'],
                    ['Niacin (mg)', 'Optional', 'Niacin, Niacin (mg), Vitamin B3, B3'],
                    ['Vitamin B6 (mg)', 'Optional', 'Vitamin B6, Vit B6, B6, Vitamin B6 (mg)'],
                    ['Vitamin B12 (mcg)', 'Optional', 'Vitamin B12, Vit B12, B12, Cobalamin'],
                    ['Folate (mcg)', 'Optional', 'Folate, Folic Acid, Folate (mcg), Vitamin B9, B9'],
                    ['Magnesium (mg)', 'Optional', 'Magnesium, Magnesium (mg), Mg'],
                    ['Potassium (mg)', 'Optional', 'Potassium, Potassium (mg), K'],
                    ['Zinc (mg)', 'Optional', 'Zinc, Zinc (mg), Zn'],
                    ['Selenium (mcg)', 'Optional', 'Selenium, Selenium (mcg), Se'],
                  ].map(([col, req, names]) => (
                    <tr key={col}>
                      <td className="py-1 pr-4 font-medium">{col}</td>
                      <td className={`py-1 pr-4 ${req.startsWith('✓') ? 'text-accent' : ''}`}>{req}</td>
                      <td className="py-1 text-muted-foreground/70">{names}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: PREVIEW ──────────────────────────────────────────────── */}
      {step === STEPS.PREVIEW && (
        <div className="flex flex-col gap-4">
          {/* Global warnings from parse */}
          {parsedData?.warnings?.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning">{w}</p>
            </div>
          ))}

          {confirmError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{confirmError}</p>
            </div>
          )}

          {/* Stats bar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border">
              <span className="text-xs text-muted-foreground">Total:</span>
              <span className="text-xs font-semibold text-foreground">{totalRows}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent">{validCount} valid</span>
            </div>
            {warningCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">{warningCount} warnings</span>
              </div>
            )}
            {invalidCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <XCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  {invalidCount} need fixing
                </span>
              </div>
            )}
          </div>

          {/* Defaults for rows missing date/mealtype */}
          <div className="rounded-lg bg-surface border border-border p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground mb-1">
                Default date <span className="text-muted-foreground">(for rows without a date)</span>
              </p>
              <input
                type="date"
                value={defaultDate}
                onChange={(e) => setDefaultDate(e.target.value || toDateStr())}
                className="w-full px-3 py-2 rounded-lg text-sm bg-surface-elevated border border-border focus:border-accent outline-none transition-all"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground mb-1">
                Default meal type <span className="text-muted-foreground">(for rows without one)</span>
              </p>
              <select
                value={defaultMealType}
                onChange={(e) => setDefaultMealType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-surface-elevated border border-border focus:border-accent outline-none transition-all capitalize"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk selection controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-accent hover:underline"
              >
                Select all valid
              </button>
              <span className="text-muted-foreground/40">·</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Deselect all
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{includedCount}</span> of {totalRows} selected
            </span>
          </div>

          {/* Scrollable rows list */}
          <div
            className="flex flex-col gap-2 overflow-y-auto pr-1"
            style={{ maxHeight: '40vh' }}
          >
            {editedRows.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No rows were detected in the CSV.</p>
              </div>
            ) : (
              editedRows.map((row, i) => (
                <PreviewRow
                  key={row._rowIndex ?? i}
                  row={row}
                  index={i}
                  included={included[i] ?? false}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  defaultDate={defaultDate}
                  defaultMealType={defaultMealType}
                />
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStep(STEPS.UPLOAD)}
              className="gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Upload different file
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleConfirm}
                loading={confirming}
                disabled={includedCount === 0 || confirming}
              >
                <DownloadCloud className="w-4 h-4" />
                Import {includedCount} meal{includedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: RESULT ───────────────────────────────────────────────── */}
      {step === STEPS.RESULT && result && (
        <div className="flex flex-col gap-5">
          {/* Hero summary */}
          <div className="flex flex-col items-center text-center gap-3 py-4">
            {result.imported > 0 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {result.imported} meal{result.imported !== 1 ? 's' : ''} imported!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your food diary has been added to your meal log.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Import failed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No meals were saved. See errors below.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 text-center">
              <p className="text-2xl font-bold text-accent">{result.imported}</p>
              <p className="text-xs text-muted-foreground mt-1">Successfully imported</p>
            </div>
            <div
              className={`rounded-xl border p-4 text-center ${
                result.failed > 0
                  ? 'bg-destructive/10 border-destructive/20'
                  : 'bg-surface border-border'
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  result.failed > 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {result.failed}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Failed</p>
            </div>
          </div>

          {/* Failed row details */}
          {result.errors?.length > 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs font-semibold text-destructive mb-2">
                Failed rows
              </p>
              <ul className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">{e.name}</span>
                    {' — '}{e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            {result.failed > 0 && (
              <Button
                variant="secondary"
                onClick={() => setStep(STEPS.PREVIEW)}
              >
                <RotateCcw className="w-4 h-4" /> Back to preview
              </Button>
            )}
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
