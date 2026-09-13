// Dummy data for running the UI without a live backend.
// Swap these out by wiring the real API hooks when backend is ready.

export const dummyUser = { userId: '1', email: 'demo@trackalorie.app' }

export const dummyGoal = {
  dailyCalorieTarget: 2200,
  proteinTargetG: 165,
  carbTargetG: 220,
  fatTargetG: 73,
  effectiveFrom: '2024-09-01',
}

export const dummyMeals = [
  {
    _id: 'm1',
    mealType: 'breakfast',
    date: '2024-09-13',
    source: 'manual',
    totals: { calories: 480, proteinG: 32, carbG: 55, fatG: 12 },
    items: [
      { name: 'Greek Yogurt', calories: 180, macros: { proteinG: 18, carbG: 14, fatG: 4 }, quantity: { amount: 200, unit: 'g' } },
      { name: 'Blueberries', calories: 80, macros: { proteinG: 1, carbG: 20, fatG: 0 }, quantity: { amount: 150, unit: 'g' } },
      { name: 'Granola', calories: 220, macros: { proteinG: 13, carbG: 21, fatG: 8 }, quantity: { amount: 50, unit: 'g' } },
    ],
  },
  {
    _id: 'm2',
    mealType: 'lunch',
    date: '2024-09-13',
    source: 'manual',
    totals: { calories: 620, proteinG: 48, carbG: 68, fatG: 14 },
    items: [
      { name: 'Grilled Chicken Breast', calories: 310, macros: { proteinG: 38, carbG: 0, fatG: 7 }, quantity: { amount: 200, unit: 'g' } },
      { name: 'Brown Rice', calories: 216, macros: { proteinG: 5, carbG: 45, fatG: 2 }, quantity: { amount: 180, unit: 'g' } },
      { name: 'Steamed Broccoli', calories: 94, macros: { proteinG: 5, carbG: 23, fatG: 5 }, quantity: { amount: 200, unit: 'g' } },
    ],
  },
  {
    _id: 'm3',
    mealType: 'snack',
    date: '2024-09-13',
    source: 'ai_label',
    totals: { calories: 210, proteinG: 10, carbG: 22, fatG: 8 },
    items: [
      { name: 'Protein Bar', calories: 210, macros: { proteinG: 10, carbG: 22, fatG: 8 }, quantity: { amount: 1, unit: 'bar' } },
    ],
  },
]

export const dummyTodayTotals = dummyMeals.reduce(
  (acc, m) => ({
    calories: acc.calories + m.totals.calories,
    proteinG: acc.proteinG + m.totals.proteinG,
    carbG: acc.carbG + m.totals.carbG,
    fatG: acc.fatG + m.totals.fatG,
  }),
  { calories: 0, proteinG: 0, carbG: 0, fatG: 0 }
)

export const dummyWeeklyTrend = [
  { day: '2024-09-07', calories: 2050, proteinG: 142, carbG: 208, fatG: 68 },
  { day: '2024-09-08', calories: 1840, proteinG: 128, carbG: 188, fatG: 62 },
  { day: '2024-09-09', calories: 2310, proteinG: 168, carbG: 235, fatG: 78 },
  { day: '2024-09-10', calories: 1960, proteinG: 138, carbG: 200, fatG: 65 },
  { day: '2024-09-11', calories: 2200, proteinG: 155, carbG: 225, fatG: 73 },
  { day: '2024-09-12', calories: 2080, proteinG: 148, carbG: 212, fatG: 69 },
  { day: '2024-09-13', calories: 1310, proteinG: 90, carbG: 145, fatG: 34 },
]

export const dummyGoalVsActual = dummyWeeklyTrend.map((d) => ({
  day: d.day,
  actual: { calories: d.calories, proteinG: d.proteinG, carbG: d.carbG, fatG: d.fatG },
  goal: { dailyCalorieTarget: 2200, proteinTargetG: 165, carbTargetG: 220, fatTargetG: 73 },
}))

export const dummyMicros = {
  vitaminA_mcg: 620,
  vitaminC_mg: 88,
  calcium_mg: 520,
  iron_mg: 12,
  sodium_mg: 1240,
  fiber_g: 28,
  sugar_g: 42,
}

export const dummyGoalHistory = [
  { _id: 'g2', dailyCalorieTarget: 2200, proteinTargetG: 165, carbTargetG: 220, fatTargetG: 73, effectiveFrom: '2024-09-01' },
  { _id: 'g1', dailyCalorieTarget: 2000, proteinTargetG: 150, carbTargetG: 210, fatTargetG: 67, effectiveFrom: '2024-08-01' },
]
