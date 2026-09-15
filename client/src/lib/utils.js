import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs) => twMerge(clsx(inputs))

export const toDateStr = (d = new Date()) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const mealDateKey = (date) =>
  typeof date === 'string' ? date.split('T')[0] : toDateStr(date)

export const formatDate = (str) => {
  const d = new Date(str.includes('T') ? str : str + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const formatDateLong = (str) => {
  const d = new Date(str.includes('T') ? str : str + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export const pct = (val, target) =>
  target > 0 ? Math.min(Math.round((val / target) * 100), 100) : 0

export const getBrowserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone

export const fmt = (n, decimals = 0) =>
  (Math.round(n * 10 ** decimals) / 10 ** decimals).toFixed(decimals)

export const apiErrorMessage = (error, fallback) => {
  const apiError = error?.response?.data?.error
  const details = apiError?.details
  const detailText = Array.isArray(details)
    ? details.map((detail) => `${detail.path ? `${detail.path}: ` : ''}${detail.message}`).join(' ')
    : ''
  return [apiError?.message, detailText].filter(Boolean).join(' ') || error?.message || fallback
}

export const MACRO_COLORS = {
  protein: '#7CFFB2',
  carb:    '#60A5FA',
  fat:     '#F59E0B',
}
