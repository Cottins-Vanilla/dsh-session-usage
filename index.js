/**
 * Session usage: Host half.
 *
 * Folds committed session logs into per-conversation token and price totals and
 * serves them to the Client half over an authenticated Connection fetch route.
 *
 * The session log is the source of truth: live sessions are folded from their
 * in-memory events, cold sessions from `sessionQuery.readSession()`. Nothing is
 * persisted by this plugin, and the whole index is a derived cache.
 */

import { isPeakNow, resolvePricing } from './lib/pricing.js'
import {
  aggregateDays,
  aggregateTotals,
  createRecord,
  displayTitle,
  foldEvents,
  summarizeRecord,
  turnPoints,
} from './lib/stats.js'

const ROUTE = '/api/session-usage/query'
const DEFAULT_MAX_SESSIONS = 400
const DEFAULT_CHART_DAYS = 14
const READ_CONCURRENCY = 3
const TURN_SERIES_LIMIT = 8

function clampInt(value, fallback, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

function messageOf(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

function json(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function normalizeCwd(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase()
}

function projectLabel(cwd) {
  const text = String(cwd || '').replace(/[\\/]+$/, '')
  const parts = text.split(/[\\/]/)
  return parts[parts.length - 1] || text
}

export function apply(ctx, config) {
  const options = config && typeof config === 'object' ? config : {}
  const pricing = resolvePricing(options.pricing)
  const chartDays = clampInt(options.chartDays, DEFAULT_CHART_DAYS, 2, 60)
  const maxSessions = clampInt(options.maxSessions, DEFAULT_MAX_SESSIONS, 1, 2000)

  /** @type {Map<string, ReturnType<typeof createRecord>>} */
  const cache = new Map()
  /** @type {Map<string, Promise<unknown>>} */
  const inflight = new Map()

  const sessionQuery = () => ctx.get('sessionQuery')

  function liveSessions() {
    const map = new Map()
    try {
      const store = ctx.get('sessions')
      const list = typeof store?.list === 'function' ? store.list() : []
      for (const session of Array.isArray(list) ? list : []) {
        if (session && typeof session.id === 'string') map.set(session.id, session)
      }
    } catch {
      // A missing live store only means every session is read from persistence.
    }
    return map
  }

  function readCold(id) {
    const query = sessionQuery()
    if (!query || typeof query.readSession !== 'function') {
      throw new Error('The session query service is unavailable, so persisted sessions cannot be read.')
    }
    let pending = inflight.get(id)
    if (!pending) {
      pending = Promise.resolve(query.readSession(id)).finally(() => {
        if (inflight.get(id) === pending) inflight.delete(id)
      })
      inflight.set(id, pending)
    }
    return pending
  }

  function markLive(record, session) {
    record.live = true
    if (session?.header?.cwd) record.cwd = session.header.cwd
    try {
      foldEvents(record, session.ownEvents(), pricing)
      record.loaded = true
    } catch {
      // Fall back to the persisted snapshot below when the live log is unreadable.
    }
  }

  function foldCold(record, snapshot) {
    const inherited = Math.max(0, Number(snapshot?.inheritedEventCount) || 0)
    record.inherited = inherited
    record.lastSeq = inherited - 1
    foldEvents(record, snapshot?.events, pricing)
    record.loaded = true
    return record
  }

  /** Ensure a record for a listed header, reading the cold log only once. */
  async function ensureRecord(header, liveMap) {
    const id = header.id
    const session = liveMap.get(id)
    let record = cache.get(id)
    if (!record) {
      record = createRecord(session?.header ?? header, session?.inheritedEventCount ?? 0)
      cache.set(id, record)
    }
    if (session) markLive(record, session)
    if (record.loaded) return record
    return foldCold(record, await readCold(id))
  }

  /** Ensure a record by id even when it is not in the newest-N listing. */
  async function ensureById(id, liveMap) {
    let record = cache.get(id)
    const session = liveMap.get(id)
    if (record) {
      if (session) markLive(record, session)
      if (record.loaded) return record
    } else if (session) {
      record = createRecord(session.header, session.inheritedEventCount)
      cache.set(id, record)
      markLive(record, session)
      if (record.loaded) return record
    }
    const snapshot = await readCold(id)
    if (!record) {
      record = createRecord(snapshot?.session ?? { id }, snapshot?.inheritedEventCount ?? 0)
      cache.set(id, record)
    }
    return foldCold(record, snapshot)
  }

  async function readAll(liveMap) {
    const query = sessionQuery()
    if (!query || typeof query.listSessions !== 'function') {
      throw new Error('The session query service is unavailable, so the session list cannot be read.')
    }
    const listed = await query.listSessions()
    const headers = (Array.isArray(listed) ? listed : [])
      .slice(0, maxSessions)
      .map((entry) => entry.header)
    const known = new Set(headers.map((header) => header.id))
    for (const session of liveMap.values()) {
      if (session?.header && !known.has(session.id)) {
        headers.push(session.header)
        known.add(session.id)
      }
    }
    const results = []
    const warnings = []
    let next = 0
    const worker = async () => {
      while (true) {
        const index = next
        next += 1
        if (index >= headers.length) return
        const header = headers[index]
        try {
          results.push(await ensureRecord(header, liveMap))
        } catch (error) {
          warnings.push(`${header?.id || 'session'}: ${messageOf(error)}`)
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(READ_CONCURRENCY, headers.length) }, worker))
    results.sort((a, b) => b.updatedAt - a.updatedAt)
    return { records: results, warnings }
  }

  function totalsOf(records) {
    return aggregateTotals(records)
  }

  function hasUsage(record) {
    return (Number(record?.usage?.total) || 0) > 0 || (Number(record?.cost) || 0) > 0
  }

  function roundCost(value) {
    return Math.round((Number(value) || 0) * 1_000_000) / 1_000_000
  }

  /**
   * Per-turn cumulative source for the chart. The eight most expensive
   * conversations keep their own colored series; the rest fold into one
   * "other conversations" series so every conversation still contributes to
   * the curve without exhausting the palette.
   */
  function buildTurnSeries(records) {
    const active = records.filter(hasUsage)
    const sorted = [...active].sort((a, b) => b.cost - a.cost)
    const top = sorted.slice(0, TURN_SERIES_LIMIT)
    const rest = sorted.slice(TURN_SERIES_LIMIT)
    const series = top.map((record) => ({
      id: record.id,
      title: displayTitle(record),
      cwd: record.cwd,
      cost: roundCost(record.cost),
      tokens: record.usage.total,
      points: turnPoints(record),
    }))
    let other = null
    if (rest.length > 0) {
      const buckets = new Map()
      let cost = 0
      let tokens = 0
      for (const record of rest) {
        cost += record.cost
        tokens += record.usage.total
        for (const point of turnPoints(record)) {
          let bucket = buckets.get(point.turn)
          if (!bucket) {
            bucket = {
              label: point.label,
              turn: point.turn,
              seq: 0,
              time: point.time,
              cost: 0,
              tokens: 0,
              input: 0,
              cacheRead: 0,
              cacheWrite: 0,
              output: 0,
              steps: 0,
              messages: 0,
            }
            buckets.set(point.turn, bucket)
          }
          bucket.cost += point.cost
          bucket.tokens += point.tokens
          bucket.input += point.input
          bucket.cacheRead += point.cacheRead
          bucket.cacheWrite += point.cacheWrite
          bucket.output += point.output
          bucket.steps += point.steps
          bucket.messages += point.messages
          bucket.seq = Math.max(bucket.seq, Number(point.seq) || 0)
          if (point.time) bucket.time = Math.min(bucket.time, point.time)
        }
      }
      other = {
        count: rest.length,
        cost: roundCost(cost),
        tokens,
        points: [...buckets.values()]
          .sort((a, b) => a.turn - b.turn)
          .map((bucket) => ({ ...bucket, cost: roundCost(bucket.cost) })),
      }
    }
    const lastTurn = (points) => points.reduce((max, point) => Math.max(max, Number(point.turn) || 0), 0)
    const maxTurn = Math.max(
      0,
      ...series.map((entry) => lastTurn(entry.points)),
      other ? lastTurn(other.points) : 0,
    )
    return { series, other, maxTurn }
  }

  function chartFor(records, today) {
    return {
      daily: aggregateDays(records, today, chartDays),
      turns: buildTurnSeries(records),
    }
  }

  async function build(scope, sessionId) {
    const liveMap = liveSessions()
    const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)

    if (scope === 'current' || scope === 'project') {
      if (!sessionId) {
        return {
          ok: true,
          generatedAt: Date.now(),
          scope,
          currency: pricing.currency,
          chartDays,
          peak: isPeakNow(pricing),
          current: null,
          project: null,
          totals: totalsOf([]),
          chart: { daily: [], turns: { series: [], other: null, maxTurn: 0 } },
          session: null,
          sessions: [],
          warnings: [],
        }
      }
      const current = await ensureById(sessionId, liveMap)
      if (scope === 'current') {
        return {
          ok: true,
          generatedAt: Date.now(),
          scope,
          currency: pricing.currency,
          chartDays,
          peak: isPeakNow(pricing),
          maxSeq: current.lastSeq,
          current: { id: current.id, title: displayTitle(current), cwd: current.cwd },
          project: null,
          totals: totalsOf([current]),
          chart: chartFor([current], today),
          session: summarizeRecord(current),
          sessions: [],
          warnings: [],
        }
      }
      const listed = await readAll(liveMap)
      const cwd = normalizeCwd(current.cwd)
      let records = listed.records.filter((record) => normalizeCwd(record.cwd) === cwd)
      if (!records.some((record) => record.id === current.id)) records = [current, ...records]
      records = records.filter(hasUsage)
      return {
        ok: true,
        generatedAt: Date.now(),
        scope,
        currency: pricing.currency,
        chartDays,
        peak: isPeakNow(pricing),
        current: { id: current.id, title: displayTitle(current), cwd: current.cwd },
        project: { cwd: current.cwd, label: projectLabel(current.cwd) },
        totals: totalsOf(records),
        chart: chartFor(records, today),
        session: null,
        sessions: records.map(summarizeRecord).sort((a, b) => b.cost - a.cost),
        warnings: listed.warnings.slice(0, 8),
      }
    }

    const listed = await readAll(liveMap)
    const records = listed.records.filter(hasUsage)
    return {
      ok: true,
      generatedAt: Date.now(),
      scope: 'all',
      currency: pricing.currency,
      chartDays,
      peak: isPeakNow(pricing),
      current: null,
      project: null,
      totals: totalsOf(records),
      chart: chartFor(records, today),
      session: null,
      sessions: records.map(summarizeRecord).sort((a, b) => b.cost - a.cost),
      warnings: listed.warnings.slice(0, 8),
    }
  }

  async function handle(request) {
    try {
      let payload = {}
      try {
        const body = await request.json()
        if (body && typeof body === 'object' && !Array.isArray(body)) payload = body
      } catch {
        payload = {}
      }
      const scope = payload.scope === 'current' || payload.scope === 'project' ? payload.scope : 'all'
      const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : ''
      return json(await build(scope, sessionId))
    } catch (error) {
      return json({ ok: false, error: { code: 'session-usage/failed', message: messageOf(error) } })
    }
  }

  ctx.inject(['connection'], (connectionCtx) => {
    const connection = connectionCtx.get('connection')
    const register = connection?.fetch?.register
    if (typeof register !== 'function') return
    connectionCtx.effect(() => register({
      path: ROUTE,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: handle,
    }))
  })
}
