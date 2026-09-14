import { useState, useRef } from 'react'
import { ScanLine, Upload, CheckCircle2, AlertTriangle, X, Camera } from 'lucide-react'
import { Button, Card, SectionHeader, Select, Input } from '../components/ui'
import { fmt, toDateStr } from '../lib/utils'
import { aiApi, mealsApi } from '../api'

const CONFIDENCE_CONFIG = {
  high:   { color: 'bg-accent/10 border-accent/30 text-accent',            icon: CheckCircle2, label: 'High confidence' },
  medium: { color: 'bg-warning/10 border-warning/30 text-warning',         icon: AlertTriangle, label: 'Medium confidence' },
  low:    { color: 'bg-destructive/10 border-destructive/30 text-destructive', icon: AlertTriangle, label: 'Low confidence' },
}

export default function AIScannerPage() {
  const [mode, setMode] = useState('label') // 'label' | 'plate'
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(null)
  const [mealType, setMealType] = useState('snack')
  const [mealDate, setMealDate] = useState(toDateStr())
  const [labelServingGrams, setLabelServingGrams] = useState('')
  const [consumedGrams, setConsumedGrams] = useState('')
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setImagePreview(url)
    setResult(null)
    setLabelServingGrams('')
    setConsumedGrams('')
    setConfirmed(false)
    setError(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const handleScan = async () => {
    if (!selectedFile) return
    setScanning(true)
    setResult(null)
    setError(null)
    try {
      const extraction = await aiApi.extract(selectedFile, mode)
      setResult(extraction)
      setConsumedGrams(extraction.type === 'label' && extraction.draft.servingGrams
        ? String(extraction.draft.servingGrams)
        : '')
      setLabelServingGrams(extraction.type === 'label' && extraction.draft.servingGrams
        ? String(extraction.draft.servingGrams)
        : '')
    } catch (err) {
      setError(
        err?.response?.data?.error?.message
        ?? (!err?.response
          ? 'The backend is unavailable. Start the server on port 5000 and make sure MongoDB is running.'
          : 'Unable to analyze this image. Please try again.')
      )
    } finally {
      setScanning(false)
    }
  }

  const toQuantity = (value) => {
    const match = String(value ?? '').trim().match(/^([\d.]+)\s*(.*)$/)
    return { amount: match ? Number(match[1]) : 1, unit: match?.[2] || 'serving' }
  }

  const getLabelNutrition = () => {
    const draft = result.draft
    const servingGrams = Number(labelServingGrams)
    const amountGrams = Number(consumedGrams)
    const scale = servingGrams > 0 && amountGrams > 0 ? amountGrams / servingGrams : 1
    const scaleValue = (value) => value === null ? null : Math.round(value * scale * 10) / 10

    return {
      ...draft,
      calories: Math.round(draft.calories * scale),
      proteinG: scaleValue(draft.proteinG),
      carbG: scaleValue(draft.carbG),
      fatG: scaleValue(draft.fatG),
      micros: Object.fromEntries(
        Object.entries(draft.micros ?? {}).map(([key, value]) => [key, scaleValue(value)])
      ),
    }
  }

  const handleConfirm = async () => {
    if (!result) return
    setError(null)
    try {
      const labelNutrition = result.type === 'label' ? getLabelNutrition() : null
      const items = result.type === 'label'
        ? [{
            name: labelNutrition.foodName,
            calories: labelNutrition.calories,
            quantity: { amount: Number(consumedGrams), unit: 'g' },
            macros: {
              proteinG: labelNutrition.proteinG,
              carbG: labelNutrition.carbG,
              fatG: labelNutrition.fatG,
            },
            micros: Object.fromEntries(
              Object.entries(labelNutrition.micros ?? {}).filter(([, value]) => value !== null)
            ),
          }]
        : result.draft.map((item) => ({
            name: item.name,
            calories: item.calories,
            quantity: toQuantity(item.estimatedQuantity),
            macros: {
              proteinG: item.proteinG,
              carbG: item.carbG,
              fatG: item.fatG,
            },
          }))

      await mealsApi.create({
        mealType,
        date: mealDate,
        source: result.type === 'label' ? 'ai_label' : 'ai_plate',
        aiMeta: { confidence: result.confidenceScore },
        items,
      })
      setConfirmed(true)
      setTimeout(() => {
        setSelectedFile(null)
        setImagePreview(null)
        setResult(null)
        setConfirmed(false)
      }, 2000)
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Unable to save this meal. Please try again.')
    }
  }

  const cc = result ? CONFIDENCE_CONFIG[result.confidence] : null
  const ConfIcon = cc?.icon

  const totalCalories = result?.type === 'plate'
    ? result.draft.reduce((a, it) => a + it.calories, 0)
    : result?.type === 'label' ? getLabelNutrition().calories : undefined
  const labelNutrition = result?.type === 'label' ? getLabelNutrition() : null
  const canConfirmLabel = result?.type !== 'label'
    || (Number(labelServingGrams) > 0 && Number(consumedGrams) > 0)

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <SectionHeader
        title="AI Food Scanner"
        subtitle="Upload a nutrition label or plate photo — AI extracts the macros"
        action={<ScanLine className="w-5 h-5 text-accent" />}
      />

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'label', label: '🏷️ Nutrition Label', desc: 'High accuracy OCR' },
          { id: 'plate', label: '🍽️ Plate of Food',   desc: 'Visual estimation' },
        ].map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setResult(null) }}
            className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
              mode === id
                ? 'border-accent bg-accent/5'
                : 'border-border bg-surface hover:border-border/80'
            }`}
          >
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload zone */}
        <div className="flex flex-col gap-4">
          <div
            className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center min-h-56 cursor-pointer transition-all ${
              imagePreview ? 'border-accent/40' : 'border-border hover:border-accent/40'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !imagePreview && fileRef.current?.click()}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover rounded-xl" />
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setImagePreview(null); setResult(null); setError(null) }}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Drop image here</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP · Max 5MB</p>
                </div>
                <Button size="sm" variant="secondary">
                  <Camera className="w-3.5 h-3.5" /> Browse file
                </Button>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

          <Button
            onClick={handleScan}
            disabled={!imagePreview || scanning}
            loading={scanning}
            className="w-full"
          >
            <ScanLine className="w-4 h-4" />
            {scanning ? 'Analyzing with GPT-4o…' : 'Scan & Extract'}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Meal type" value={mealType} onChange={(e) => setMealType(e.target.value)}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </Select>
            <Input label="Date" type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

          {mode === 'plate' && (
            <p className="text-xs text-muted-foreground text-center px-2">
              ⚠️ Plate estimates are always shown as <strong>medium confidence</strong> — visual portion sizing has inherent uncertainty.
            </p>
          )}
        </div>

        {/* Result panel */}
        <div className="flex flex-col gap-4">
          {!result && !scanning && (
            <div className="flex flex-col items-center justify-center min-h-56 gap-3 text-center border border-dashed border-border rounded-xl">
              <ScanLine className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Upload an image and click Scan</p>
              <p className="text-xs text-muted-foreground/60">Results appear here</p>
            </div>
          )}

          {scanning && (
            <div className="flex flex-col items-center justify-center min-h-56 gap-4 border border-border rounded-xl">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-accent/20 border-t-accent animate-spin-slow" />
                <ScanLine className="absolute inset-0 m-auto w-6 h-6 text-accent" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Analyzing image…</p>
                <p className="text-xs text-muted-foreground mt-1">GPT-4o vision · structured output</p>
              </div>
            </div>
          )}

          {result && !confirmed && (
            <div className="flex flex-col gap-3 animate-fade-in">
              {/* Confidence banner */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${cc.color}`}>
                <ConfIcon className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">{cc.label} ({Math.round(result.confidenceScore * 100)}%)</p>
                  {result.type === 'plate' && (
                    <p className="text-xs opacity-80">Plate estimations are capped at medium — always review</p>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-warning bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
                      ⚠️ {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Extracted data */}
              <Card className="p-4">
                {result.type === 'label' ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{result.draft.foodName}</p>
                      <p className="text-xs text-muted-foreground">Label serving: {result.draft.servingSize}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Label serving (g)"
                        type="number"
                        min="1"
                        step="0.1"
                        value={labelServingGrams}
                        onChange={(e) => setLabelServingGrams(e.target.value)}
                      />
                      <Input
                        label="Consumed (g)"
                        type="number"
                        min="1"
                        step="0.1"
                        value={consumedGrams}
                        onChange={(e) => setConsumedGrams(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Showing estimated nutrition for {consumedGrams || 0}g consumed, based on the label values per {labelServingGrams || 0}g.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Calories', val: labelNutrition.calories, unit: 'kcal', color: '#7CFFB2' },
                        { label: 'Protein',  val: labelNutrition.proteinG, unit: 'g',    color: '#7CFFB2' },
                        { label: 'Carbs',    val: labelNutrition.carbG,    unit: 'g',    color: '#60A5FA' },
                        { label: 'Fat',      val: labelNutrition.fatG,     unit: 'g',    color: '#F59E0B' },
                      ].map(({ label, val, unit, color }) => (
                        <div key={label} className="card p-2.5 text-center">
                          <p className="mono text-lg font-bold" style={{ color }}>{fmt(val)}{unit}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground">Detected Items</p>
                      <span className="mono text-xs text-accent">{totalCalories} kcal total</span>
                    </div>
                    {result.draft.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.estimatedQuantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="mono text-sm font-medium text-foreground">{item.calories} kcal</p>
                          <p className="mono text-xs text-muted-foreground">
                            {fmt(item.proteinG)}P · {fmt(item.carbG)}C · {fmt(item.fatG)}F
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <p className="text-xs text-muted-foreground text-center">
                Review and edit values before confirming — data will be logged as a meal
              </p>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setResult(null)}>Re-scan</Button>
                <Button className="flex-1" onClick={handleConfirm} disabled={!canConfirmLabel}>
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Log
                </Button>
              </div>
            </div>
          )}

          {confirmed && (
            <div className="flex flex-col items-center justify-center min-h-56 gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-accent" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Meal logged!</p>
                <p className="text-xs text-muted-foreground mt-1">Added to your meal log</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
