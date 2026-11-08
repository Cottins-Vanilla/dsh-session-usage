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

import { readFileSync } from 'node:fs'
import { normalizeCwd } from './lib/path.js'
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
const UPDATE_ROUTE = '/api/session-usage/update'
const UPDATE_API = 'https://api.github.com/repos/Cottins-Vanilla/dsh-session-usage/releases/latest'
const RELEASES_URL = 'https://github.com/Cottins-Vanilla/dsh-session-usage/releases'
const UPDATE_TTL = 6 * 60 * 60 * 1000
const DEFAULT_MAX_SESSIONS = 400
const DEFAULT_CHART_DAYS = 14
const READ_CONCURRENCY = 3
const TURN_SERIES_LIMIT = 8

function readPackageVersion() {
  try {
    const body = readFileSync(new URL('./package.json', import.meta.url), 'utf8')
    const parsed = JSON.parse(body)
    return typeof parsed.version === 'string' ? parsed.version : ''
  } catch {
    return ''
  }
}

const CURRENT_VERSION = readPackageVersion()

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

export function parseVersion(value) {
  const match = SEMVER_PATTERN.exec(String(value || '').trim())
  if (!match) return null
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
    build: match[5] ? match[5].split('.') : [],
  }
}

export function compareVersions(a, b) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  if (!left || !right) return 0
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] - right[key]
  }
  const l = left.prerelease
  const r = right.prerelease
  if (l.length === 0 && r.length === 0) return 0
  if (l.length === 0) return 1
  if (r.length === 0) return -1
  for (let index = 0; index < Math.max(l.length, r.length); index += 1) {
    const x = l[index]
    const y = r[index]
    if (x === undefined) return -1
    if (y === undefined) return 1
    if (x === y) continue
    const xNumeric = /^\d+$/.test(x)
    const yNumeric = /^\d+$/.test(y)
    if (xNumeric && yNumeric) return Number(x) - Number(y)
    if (xNumeric) return -1
    if (yNumeric) return 1
    return x < y ? -1 : 1
  }
  return 0
}

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

  /** @type {{ at: number, data: Record<string, unknown> } | null} */
  let updateCache = null
  /** @type {Promise<Record<string, unknown>> | null} */
  let updateInFlight = null

  async function checkForUpdate(force) {
    if (!force && updateCache && Date.now() - updateCache.at < UPDATE_TTL) {
      return updateCache.data
    }
    if (updateInFlight) return updateInFlight
    updateInFlight = (async () => {
      if (typeof fetch !== 'function') {
        throw new Error('This Harness runtime has no fetch implementation for the update check.')
      }
      const current = parseVersion(CURRENT_VERSION)
      if (!current) {
        throw new Error('The installed package version is not a semantic version.')
      }
      const init = {
        headers: {
          accept: 'application/vnd.github+json',
          'user-agent': 'dsh-session-usage',
          'x-github-api-version': '2022-11-28',
        },
      }
      if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        init.signal = AbortSignal.timeout(8000)
      }
      const response = await fetch(UPDATE_API, init)
      if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`)
      const release = await response.json()
      const tag = typeof release?.tag_name === 'string' ? release.tag_name : ''
      const latest = tag.replace(/^v/i, '')
      if (!parseVersion(latest)) throw new Error('The latest GitHub release has no semantic version tag.')
      const candidate = typeof release?.html_url === 'string' ? release.html_url : ''
      const releaseUrl = candidate.startsWith('https://github.com/Cottins-Vanilla/dsh-session-usage/releases/')
        ? candidate
        : RELEASES_URL
      const data = {
        ok: true,
        current: CURRENT_VERSION,
        latest,
        updateAvailable: compareVersions(latest, CURRENT_VERSION) > 0,
        releaseUrl,
        releaseName: typeof release?.name === 'string' ? release.name.slice(0, 120) : '',
        publishedAt: typeof release?.published_at === 'string' ? release.published_at : '',
        checkedAt: Date.now(),
      }
      updateCache = { at: Date.now(), data }
      return data
    })().finally(() => {
      updateInFlight = null
    })
    return updateInFlight
  }

  async function handleUpdate(request) {
    try {
      let payload = {}
      try {
        const body = await request.json()
        if (body && typeof body === 'object' && !Array.isArray(body)) payload = body
      } catch {
        payload = {}
      }
      return json(await checkForUpdate(payload.force === true))
    } catch (error) {
      return json({
        ok: false,
        current: CURRENT_VERSION,
        error: { code: 'session-usage/update-check-failed', message: messageOf(error) },
      })
    }
  }

  /** @type {Map<string, ReturnType<typeof createRecord>>} */
  const cache = new Map()
  /** @type {Map<string, Promise<unknown>>} */
  const inflight = new Map()
  /** @type {Map<string, Promise<ReturnType<typeof createRecord>>>} */
  const loading = new Map()
  /** @type {Map<string, Promise<ReturnType<typeof createRecord>>>} */
  const refreshing = new Map()

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
    record.liveGeneration = (Number(record.liveGeneration) || 0) + 1
    if (session?.header?.cwd) record.cwd = session.header.cwd
    try {
      foldEvents(record, session.ownEvents(), pricing)
      record.loaded = true
    } catch {
      // Fall back to the persisted snapshot below when the live log is unreadable.
    }
  }

  function foldCold(record, snapshot) {
    if (!record || record.loaded) return record
    const inherited = Math.max(0, Number(snapshot?.inheritedEventCount) || 0)
    record.inherited = inherited
    record.lastSeq = inherited - 1
    foldEvents(record, snapshot?.events, pricing)
    record.loaded = true
    return record
  }

  /** Load one cold record at most once, sharing the fold across concurrent requests. */
  function coldLoad(id, header, session) {
    let pending = loading.get(id)
    if (pending) return pending
    const existing = cache.get(id)
    if (existing?.loaded) return Promise.resolve(existing)
    pending = (async () => {
      const snapshot = await readCold(id)
      let record = cache.get(id)
      if (!record) {
        record = createRecord(
          snapshot?.session ?? session?.header ?? header ?? { id },
          snapshot?.inheritedEventCount ?? session?.inheritedEventCount ?? 0,
        )
        cache.set(id, record)
      }
      if (session) markLive(record, session)
      if (!record.loaded) foldCold(record, snapshot)
      return record
    })().finally(() => {
      if (loading.get(id) === pending) loading.delete(id)
    })
    loading.set(id, pending)
    return pending
  }

  /** Fold the persisted tail after a live session disappears, without re-reading old events. */
  function refreshCold(record, id) {
    let pending = refreshing.get(id)
    if (!pending) {
      const generation = Number(record.liveGeneration) || 0
      pending = (async () => {
        const snapshot = await readCold(id)
        // A live reactivation during the read owns the newer state. The stale
        // snapshot must not fold or mark the record cold.
        if ((Number(record.liveGeneration) || 0) !== generation) return record
        const inherited = Math.max(0, Number(snapshot?.inheritedEventCount) || 0)
        if (inherited > record.inherited) record.inherited = inherited
        // Deliberately keep lastSeq: existing samples are already counted, and
        // only the persisted tail is missing.
        foldEvents(record, snapshot?.events, pricing)
        record.loaded = true
        record.live = false
        return record
      })().finally(() => {
        if (refreshing.get(id) === pending) refreshing.delete(id)
      })
      refreshing.set(id, pending)
    }
    return pending
  }
  /** Ensure a record for a listed header, reading and folding the cold log only once. */
  async function ensureRecord(header, liveMap) {
    const id = header.id
    const session = liveMap.get(id)
    const existing = cache.get(id)
    if (existing) {
      if (session) markLive(existing, session)
      else if (existing.live && existing.loaded) return refreshCold(existing, id)
      if (existing.loaded) return existing
    } else if (session) {
      const record = createRecord(session.header ?? header, session.inheritedEventCount ?? 0)
      cache.set(id, record)
      markLive(record, session)
      if (record.loaded) return record
    }
    return coldLoad(id, header, session)
  }

  /** Ensure a record by id even when it is not in the newest-N listing. */
  async function ensureById(id, liveMap) {
    const session = liveMap.get(id)
    const existing = cache.get(id)
    if (existing) {
      if (session) markLive(existing, session)
      else if (existing.live && existing.loaded) return refreshCold(existing, id)
      if (existing.loaded) return existing
    } else if (session) {
      const record = createRecord(session.header, session.inheritedEventCount)
      cache.set(id, record)
      markLive(record, session)
      if (record.loaded) return record
    }
    return coldLoad(id, { id }, session)
  }

  async function readAll(liveMap, onlyCwd = '') {
    const query = sessionQuery()
    if (!query || typeof query.listSessions !== 'function') {
      throw new Error('The session query service is unavailable, so the session list cannot be read.')
    }
    const listed = await query.listSessions()
    const headers = (Array.isArray(listed) ? listed : [])
      .map((entry) => entry.header)
      .filter((header) => !onlyCwd || normalizeCwd(header?.cwd) === onlyCwd)
      .slice(0, maxSessions)
    const known = new Set(headers.map((header) => header.id))
    for (const session of liveMap.values()) {
      if (session?.header && !known.has(session.id)
        && (!onlyCwd || normalizeCwd(session.header.cwd) === onlyCwd)) {
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
      const cwd = normalizeCwd(current.cwd)
      const listed = await readAll(liveMap, cwd)
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
    connectionCtx.effect(() => register({
      path: UPDATE_ROUTE,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: handleUpdate,
    }))
  })
}
