import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs) => twMerge(clsx(inputs))

export const toDateStr = (d = new Date()) => d.toISOString().split('T')[0]

export const formatDate = (str) => {
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const formatDateLong = (str) => {
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export const pct = (val, target) =>
  target > 0 ? Math.min(Math.round((val / target) * 100), 100) : 0

export const getBrowserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone

export const fmt = (n, decimals = 0) =>
  (Math.round(n * 10 ** decimals) / 10 ** decimals).toFixed(decimals)

export const MACRO_COLORS = {
  protein: '#7CFFB2',
  carb:    '#60A5FA',
  fat:     '#F59E0B',
}
