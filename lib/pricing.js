/**
 * Price estimation for session usage.
 *
 * The Harness records token usage per assistant message but does not attach a
 * monetary price. This module converts TokenUsage into an estimated amount with
 * a configurable per-million-token table. Defaults follow DeepSeek's published
 * list prices (CNY per 1M tokens) and its peak/off-peak split:
 *
 *   off-peak: cache hit 0.02, cache miss 1, output 4   (deepseek-flash)
 *   peak:     2x the off-peak rates
 *   peak windows: Beijing time Mon-Fri 09:00-12:00 and 14:00-18:00
 *   weekends and Chinese public holidays bill at the off-peak rate
 *
 * These numbers are an estimate. Users can override the table with the bundle
 * row's `config.pricing` (see README.md) when a provider changes its prices.
 */

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000

/** Chinese public holidays for 2026 (off-peak all day). Update for later years. */
export const CN_HOLIDAYS_2026 = Object.freeze([
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
  '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-09-25', '2026-09-26', '2026-09-27',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05',
  '2026-10-06', '2026-10-07',
])

const FLASH_RATES = Object.freeze({ hit: 0.02, miss: 1, out: 4 })
const PRO_RATES = Object.freeze({ hit: 0.15, miss: 4.5, out: 13.5 })

export const DEFAULT_PRICING = Object.freeze({
  currency: 'CNY',
  peakMultiplier: 2,
  peakHours: Object.freeze([[9, 12], [14, 18]]),
  weekendValley: true,
  holidays: CN_HOLIDAYS_2026,
  models: Object.freeze({
    'deepseek-v4-pro': PRO_RATES,
    'deepseek-pro': PRO_RATES,
    'deepseek-flash': FLASH_RATES,
    'deepseek-v4-flash': FLASH_RATES,
    'deepseek-v4-flash-vision-exp': FLASH_RATES,
    'deepseek-chat': FLASH_RATES,
    'deepseek-reasoner': FLASH_RATES,
  }),
  fallback: FLASH_RATES,
})

function nonNegative(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function finiteRate(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : NaN
}

function normalizeRates(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const hit = finiteRate(input.hit)
  const miss = finiteRate(input.miss)
  const out = finiteRate(input.out)
  if (!Number.isFinite(hit) || !Number.isFinite(miss) || !Number.isFinite(out)) return null
  return { hit, miss, out }
}

function normalizeHours(input) {
  if (!Array.isArray(input)) return DEFAULT_PRICING.peakHours.map((range) => [...range])
  const normalized = []
  for (const range of input) {
    if (!Array.isArray(range) || range.length !== 2) continue
    const start = Number(range[0])
    const end = Number(range[1])
    if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= 24 && start < end) {
      normalized.push([start, end])
    }
  }
  return normalized.length > 0 ? normalized : DEFAULT_PRICING.peakHours.map((range) => [...range])
}

/**
 * Merge user overrides into the default table and sort matches longest-first so
 * a key such as `deepseek-v4-flash` wins over `deepseek-flash`.
 */
export function resolvePricing(overrides) {
  const input = overrides && typeof overrides === 'object' ? overrides : {}
  const models = new Map()
  for (const [key, rates] of Object.entries(DEFAULT_PRICING.models)) {
    models.set(String(key).toLowerCase(), rates)
  }
  if (input.models !== undefined) {
    if (!input.models || typeof input.models !== 'object' || Array.isArray(input.models)) {
      throw new Error('Invalid pricing.models: expected an object of model -> { hit, miss, out }.')
    }
    for (const [key, rates] of Object.entries(input.models)) {
      const normalized = normalizeRates(rates)
      if (!normalized) {
        throw new Error(`Invalid pricing.models["${key}"]: hit, miss, and out must be non-negative finite numbers.`)
      }
      models.set(String(key).toLowerCase(), normalized)
    }
  }
  let fallback = DEFAULT_PRICING.fallback
  if (input.fallback !== undefined) {
    const normalized = normalizeRates(input.fallback)
    if (!normalized) {
      throw new Error('Invalid pricing.fallback: hit, miss, and out must be non-negative finite numbers.')
    }
    fallback = normalized
  }
  const holidays = new Set(
    (Array.isArray(input.holidays) ? input.holidays : DEFAULT_PRICING.holidays)
      .map((day) => String(day))
      .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)),
  )
  return {
    currency: typeof input.currency === 'string' && /^[A-Z]{3}$/.test(input.currency.toUpperCase())
      ? input.currency.toUpperCase()
      : DEFAULT_PRICING.currency,
    peakMultiplier: nonNegative(input.peakMultiplier, DEFAULT_PRICING.peakMultiplier) || DEFAULT_PRICING.peakMultiplier,
    peakHours: normalizeHours(input.peakHours),
    weekendValley: input.weekendValley !== false,
    holidays,
    models: [...models.entries()].sort((a, b) => b[0].length - a[0].length),
    fallback,
  }
}

/** The rate row for an exact model id (substring match, longest key first). */
export function ratesFor(pricing, model) {
  const needle = String(model || '').toLowerCase()
  if (needle) {
    for (const [key, rates] of pricing.models) {
      if (needle.includes(key)) return rates
    }
  }
  return pricing.fallback
}

/** Beijing calendar date (`YYYY-MM-DD`) for a millisecond timestamp. */
export function dayKey(timeMs) {
  const time = Number(timeMs)
  if (!Number.isFinite(time)) return ''
  return new Date(time + BEIJING_OFFSET_MS).toISOString().slice(0, 10)
}

/** Whether a millisecond timestamp falls in DeepSeek's peak billing window. */
export function isPeak(timeMs, pricing) {
  const time = Number(timeMs)
  if (!Number.isFinite(time)) return false
  const beijing = new Date(time + BEIJING_OFFSET_MS)
  const day = beijing.toISOString().slice(0, 10)
  if (pricing.holidays.has(day)) return false
  const weekday = beijing.getUTCDay()
  if (pricing.weekendValley && (weekday === 0 || weekday === 6)) return false
  const hour = beijing.getUTCHours()
  return pricing.peakHours.some(([start, end]) => hour >= start && hour < end)
}

/**
 * Estimate one message's price.
 *
 * @param pricing result of resolvePricing
 * @param usage `{ input, cacheRead, cacheWrite, output }` token counts
 * @param model exact model id from the assistant message source
 * @param timeMs event time used to choose peak or off-peak rates
 */
export function priceUsage(pricing, usage, model, timeMs) {
  const rates = ratesFor(pricing, model)
  const peak = /^deepseek/i.test(String(model || '')) && isPeak(timeMs, pricing)
  const multiplier = peak ? pricing.peakMultiplier : 1
  const tokens = {
    input: nonNegative(usage?.input, 0),
    cacheRead: nonNegative(usage?.cacheRead, 0),
    cacheWrite: nonNegative(usage?.cacheWrite, 0),
    output: nonNegative(usage?.output, 0),
  }
  const cost = (
    tokens.cacheRead * rates.hit
    + tokens.input * rates.miss
    + tokens.cacheWrite * rates.miss
    + tokens.output * rates.out
  ) / 1_000_000 * multiplier
  return { cost, peak, multiplier, rates }
}

/** Current peak status, for the panel's price note. */
export function isPeakNow(pricing) {
  return isPeak(Date.now(), pricing)
}
