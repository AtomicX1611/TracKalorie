import { useState, useRef } from 'react'
import { ScanLine, Upload, CheckCircle2, AlertTriangle, X, Loader2, Camera } from 'lucide-react'
import { Button, Card, Badge, SectionHeader } from '../components/ui'
import { fmt } from '../lib/utils'

// Simulated AI extraction result for UI demo
const DUMMY_LABEL_RESULT = {
  type: 'label',
  confidence: 'high',
  confidenceScore: 0.91,
  warnings: [],
  draft: {
    foodName: 'Kellogg\'s Special K Original',
    servingSize: '1 cup (31g)',
    servingsPerContainer: 14,
    calories: 120,
    proteinG: 6,
    carbG: 22,
    fatG: 0.5,
    micros: {
      vitaminA_mcg: 200,
      vitaminC_mg: 6,
      calcium_mg: 10,
      iron_mg: 11,
      sodium_mg: 200,
      fiber_g: 1,
      sugar_g: 4,
    },
  },
}

const DUMMY_PLATE_RESULT = {
  type: 'plate',
  confidence: 'medium',
  confidenceScore: 0.65,
  warnings: [
    'Plate estimations are visual approximations. Portion sizes may vary — please review and adjust.',
    'Hidden sauces or marinades may add calories not visible in the image.',
  ],
  draft: [
    { name: 'Grilled Salmon',    estimatedQuantity: '200g', calories: 416, proteinG: 46, carbG: 0,  fatG: 24 },
    { name: 'Steamed Broccoli',  estimatedQuantity: '150g', calories: 51,  proteinG: 4,  carbG: 10, fatG: 0.5 },
    { name: 'Mashed Potatoes',   estimatedQuantity: '180g', calories: 212, proteinG: 4,  carbG: 42, fatG: 4 },
  ],
}

const CONFIDENCE_CONFIG = {
  high:   { color: 'bg-accent/10 border-accent/30 text-accent',            icon: CheckCircle2, label: 'High confidence' },
  medium: { color: 'bg-warning/10 border-warning/30 text-warning',         icon: AlertTriangle, label: 'Medium confidence' },
  low:    { color: 'bg-destructive/10 border-destructive/30 text-destructive', icon: AlertTriangle, label: 'Low confidence' },
}

export default function AIScannerPage() {
  const [mode, setMode] = useState('label') // 'label' | 'plate'
  const [imagePreview, setImagePreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setResult(null)
    setConfirmed(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const handleScan = async () => {
    if (!imagePreview) return
    setScanning(true)
    setResult(null)
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 2200))
    setResult(mode === 'label' ? DUMMY_LABEL_RESULT : DUMMY_PLATE_RESULT)
    setScanning(false)
  }

  const handleConfirm = () => {
    // TODO: call mealsApi.create() with result data
    setConfirmed(true)
    setTimeout(() => {
      setImagePreview(null)
      setResult(null)
      setConfirmed(false)
    }, 2000)
  }

  const cc = result ? CONFIDENCE_CONFIG[result.confidence] : null
  const ConfIcon = cc?.icon

  const totalCalories = result?.type === 'plate'
    ? result.draft.reduce((a, it) => a + it.calories, 0)
    : result?.draft?.calories

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
                  onClick={(e) => { e.stopPropagation(); setImagePreview(null); setResult(null) }}
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
                      <p className="text-xs text-muted-foreground">{result.draft.servingSize}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Calories', val: result.draft.calories, unit: 'kcal', color: '#7CFFB2' },
                        { label: 'Protein',  val: result.draft.proteinG, unit: 'g',    color: '#7CFFB2' },
                        { label: 'Carbs',    val: result.draft.carbG,    unit: 'g',    color: '#60A5FA' },
                        { label: 'Fat',      val: result.draft.fatG,     unit: 'g',    color: '#F59E0B' },
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
                <Button className="flex-1" onClick={handleConfirm}>
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
