/**
 * Pure folding and aggregation for session usage.
 *
 * The Host half feeds committed `SessionEvent` objects from the live store or a
 * cold `sessionQuery.readSession()` snapshot. Nothing here touches Cordis or
 * the filesystem, so the numbers can be unit-tested against real logs.
 */

import { dayKey, priceUsage } from './pricing.js'

const DAY_MS = 86_400_000

export function emptyUsage() {
  return { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0, total: 0 }
}

export function addUsage(target, source) {
  target.input += Number(source?.input) || 0
  target.cacheRead += Number(source?.cacheRead) || 0
  target.cacheWrite += Number(source?.cacheWrite) || 0
  target.output += Number(source?.output) || 0
  target.reasoning += Number(source?.reasoning) || 0
  target.total += Number(source?.total) || 0
  return target
}

/** Read one assistant message's TokenUsage into our flat shape. */
export function usageOf(raw) {
  const input = Number(raw?.inputTokens) || 0
  const cacheRead = Number(raw?.cacheReadTokens) || 0
  const cacheWrite = Number(raw?.cacheWriteTokens) || 0
  const output = Number(raw?.outputTokens) || 0
  const reasoning = Number(raw?.reasoningTokens) || 0
  const declared = Number(raw?.totalTokens)
  return {
    input,
    cacheRead,
    cacheWrite,
    output,
    reasoning,
    // `outputTokens` already contains reasoning; totalTokens matches
    // input + cacheRead + output in every log observed, but honor it when present.
    total: Number.isFinite(declared) && declared > 0 ? declared : input + cacheRead + cacheWrite + output,
  }
}

function messageText(message) {
  const content = message?.content
  if (!Array.isArray(content)) return ''
  const parts = []
  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string') parts.push(block.text)
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function emptyTurn(turn, time) {
  return {
    turn: Number(turn) || 0,
    time0: time,
    time1: time,
    lastSeq: 0,
    cost: 0,
    usage: emptyUsage(),
    steps: 0,
    messages: 0,
  }
}

export function createRecord(header, inheritedEventCount = 0) {
  const inherited = Math.max(0, Number(inheritedEventCount) || 0)
  return {
    id: header?.id || '',
    title: '',
    firstUserText: '',
    cwd: header?.cwd || '',
    createdAt: Number(header?.createdAt) || 0,
    parentSession: header?.parentSession || null,
    subagent: header?.origin === 'subagent',
    inherited,
    lastSeq: inherited - 1,
    loaded: false,
    live: false,
    updatedAt: Number(header?.createdAt) || 0,
    firstAt: 0,
    usage: emptyUsage(),
    cost: 0,
    steps: 0,
    userMessages: 0,
    messages: 0,
    models: Object.create(null),
    days: Object.create(null),
    turns: [],
    turnIndex: Object.create(null),
  }
}

function ensureTurn(record, turn, time) {
  const key = String(Number(turn) || 0)
  let bucket = record.turnIndex[key]
  if (!bucket) {
    bucket = emptyTurn(turn, time)
    record.turnIndex[key] = bucket
    record.turns.push(bucket)
  }
  if (time > bucket.time1) bucket.time1 = time
  return bucket
}

function touchTurn(record, turn, time, seq) {
  const bucket = ensureTurn(record, turn, time)
  if (Number.isFinite(seq) && seq > bucket.lastSeq) bucket.lastSeq = seq
  return bucket
}

function ensureDay(record, day) {
  let bucket = record.days[day]
  if (!bucket) {
    bucket = { day, cost: 0, messages: 0, ...emptyUsage() }
    record.days[day] = bucket
  }
  return bucket
}

function ensureModel(record, provider, model) {
  // Price depends on the model id, not the provider route, so one row per model.
  const key = model || 'unknown'
  let bucket = record.models[key]
  if (!bucket) {
    bucket = { provider: provider || '', model: model || 'unknown', cost: 0, messages: 0, ...emptyUsage() }
    record.models[key] = bucket
  }
  return bucket
}

/**
 * Fold committed events into `record`.
 *
 * Events at or below `record.lastSeq` and inherited (fork/seed) events are
 * skipped, so a cold read followed by live increments cannot double count.
 */
export function foldEvents(record, events, pricing) {
  if (!Array.isArray(events)) return record
  for (const event of events) {
    if (!event || typeof event !== 'object') continue
    const seq = Number(event.seq)
    if (Number.isFinite(seq)) {
      if (seq < record.inherited) continue
      if (seq <= record.lastSeq) continue
      record.lastSeq = seq
    }
    const time = Number(event.time) || record.updatedAt
    if (time > record.updatedAt) record.updatedAt = time
    if (!record.firstAt || time < record.firstAt) record.firstAt = time
    const data = event.data
    if (!data || typeof data !== 'object') continue

    switch (event.type) {
      case 'session/title':
        if (typeof data.title === 'string' && data.title.trim()) record.title = data.title.trim()
        break
      case 'user/message':
        record.userMessages += 1
        if (!record.firstUserText) record.firstUserText = messageText(data).slice(0, 120)
        break
      case 'turn/start':
        touchTurn(record, data.turn, time, seq)
        break
      case 'turn/end':
        if (data.turn != null) touchTurn(record, data.turn, time, seq)
        break
      case 'step/start': {
        record.steps += 1
        if (data.turn != null) touchTurn(record, data.turn, time, seq).steps += 1
        break
      }
      case 'assistant/message': {
        record.messages += 1
        const usage = usageOf(data.usage)
        const model = data.message?.source?.model || ''
        const provider = data.message?.source?.provider || ''
        const priced = priceUsage(pricing, usage, model, time)
        addUsage(record.usage, usage)
        record.cost += priced.cost
        const day = ensureDay(record, dayKey(time))
        day.cost += priced.cost
        day.messages += 1
        addUsage(day, usage)
        const modelBucket = ensureModel(record, provider, model)
        modelBucket.cost += priced.cost
        modelBucket.messages += 1
        addUsage(modelBucket, usage)
        const turn = touchTurn(record, data.turn, time, seq)
        turn.messages += 1
        turn.cost += priced.cost
        addUsage(turn.usage, usage)
        break
      }
      default:
        break
    }
  }
  return record
}

function round(value, digits = 6) {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

export function displayTitle(record) {
  return record.title || record.firstUserText || ''
}

export function summarizeRecord(record) {
  const usage = record.usage
  const models = Object.values(record.models)
    .map((bucket) => ({
      provider: bucket.provider,
      model: bucket.model,
      cost: round(bucket.cost),
      tokens: bucket.total,
      input: bucket.input,
      output: bucket.output,
      cacheRead: bucket.cacheRead,
      messages: bucket.messages,
    }))
    .sort((a, b) => b.cost - a.cost || b.tokens - a.tokens)
  return {
    id: record.id,
    title: displayTitle(record),
    cwd: record.cwd,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    live: !!record.live,
    subagent: !!record.subagent,
    cost: round(record.cost),
    tokens: usage.total,
    input: usage.input,
    cacheRead: usage.cacheRead,
    cacheWrite: usage.cacheWrite,
    output: usage.output,
    reasoning: usage.reasoning,
    turns: record.turns.length,
    steps: record.steps,
    userMessages: record.userMessages,
    messages: record.messages,
    models,
  }
}

/** Per-turn points for the current conversation's cumulative curve. */
export function turnPoints(record) {
  return record.turns.map((turn) => ({
    label: `T${turn.turn}`,
    turn: turn.turn,
    seq: turn.lastSeq,
    time: turn.time0,
    cost: round(turn.cost),
    tokens: turn.usage.total,
    input: turn.usage.input,
    cacheRead: turn.usage.cacheRead,
    cacheWrite: turn.usage.cacheWrite,
    output: turn.usage.output,
    steps: turn.steps,
    messages: turn.messages,
  }))
}

/** Sum all-time totals over a set of records. */
export function aggregateTotals(records) {
  const usage = emptyUsage()
  let cost = 0
  let turns = 0
  let steps = 0
  let messages = 0
  let userMessages = 0
  for (const record of records) {
    cost += record.cost
    turns += record.turns.length
    steps += record.steps
    messages += record.messages
    userMessages += record.userMessages
    addUsage(usage, record.usage)
  }
  const billedInput = usage.cacheRead + usage.input + usage.cacheWrite
  return {
    cost: round(cost),
    ...usage,
    tokens: usage.total,
    sessions: records.length,
    turns,
    steps,
    messages,
    userMessages,
    cacheHitRate: billedInput > 0 ? usage.cacheRead / billedInput : 0,
  }
}

function shiftDay(day, delta) {
  const time = Date.parse(`${day}T00:00:00Z`)
  if (!Number.isFinite(time)) return day
  return new Date(time + delta * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Zero-filled per-day series ending today (Beijing date).
 * Buckets outside the window are ignored; totals remain all-time.
 */
export function aggregateDays(records, today, days) {
  const count = Math.max(2, Math.min(60, Number(days) || 14))
  const keys = []
  for (let offset = count - 1; offset >= 0; offset -= 1) keys.push(shiftDay(today, -offset))
  const buckets = new Map()
  for (const key of keys) buckets.set(key, { day: key, cost: 0, messages: 0, ...emptyUsage() })
  for (const record of records) {
    for (const [key, day] of Object.entries(record.days)) {
      const bucket = buckets.get(key)
      if (!bucket) continue
      bucket.cost += day.cost
      bucket.messages += day.messages
      addUsage(bucket, day)
    }
  }
  return keys.map((key) => {
    const bucket = buckets.get(key)
    return {
      label: key.slice(5),
      day: key,
      time: Date.parse(`${key}T00:00:00+08:00`),
      cost: round(bucket.cost),
      tokens: bucket.total,
      input: bucket.input,
      cacheRead: bucket.cacheRead,
      cacheWrite: bucket.cacheWrite,
      output: bucket.output,
      messages: bucket.messages,
    }
  })
}

/** Latest active day across records, or '' when none has usage. */
export function latestDay(records) {
  let latest = ''
  for (const record of records) {
    for (const day of Object.keys(record.days)) {
      if (day > latest) latest = day
    }
  }
  return latest
}
