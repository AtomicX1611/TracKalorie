// Merges Tailwind classes intelligently — avoids class conflicts
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format a number as compact (1200 → 1.2k)
export function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return Math.round(n).toString()
}

// Format a date to YYYY-MM-DD
export function toDateString(date = new Date()) {
  return date.toISOString().split('T')[0]
}

// Convert YYYY-MM-DD to display format (Sep 13)
export function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Get today's IANA timezone
export function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

// Macro calorie calculation (protein×4 + carb×4 + fat×9)
export function calcCaloriesFromMacros(proteinG, carbG, fatG) {
  return proteinG * 4 + carbG * 4 + fatG * 9
}

// Get progress percentage capped at 100
export function pct(value, target) {
  if (!target || target === 0) return 0
  return Math.min((value / target) * 100, 100)
}
