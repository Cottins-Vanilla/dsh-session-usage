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

/**
 * Last adapter-reported usage chunk in a compact Assistant stream.
 *
 * `assistant/message` normally carries `data.usage`, but a failed or retried
 * `assistant/attempt` has no message and records its accounting only in the
 * stream. Streams store this chunk as `{type:'chunk', chunk:{type:'usage'}}`;
 * expanded timed chunks carry the same `chunk` property.
 */
export function usageFromStream(stream) {
  if (!Array.isArray(stream)) return null
  let raw = null
  for (const record of stream) {
    const chunk = record?.type === 'chunk' ? record.chunk : record?.chunk
    if (chunk?.type === 'usage' && chunk.usage && typeof chunk.usage === 'object') raw = chunk.usage
  }
  return raw ? usageOf(raw) : null
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
    liveGeneration: 0,
    updatedAt: Number(header?.createdAt) || 0,
    firstAt: 0,
    lastModel: '',
    lastProvider: '',
    usage: emptyUsage(),
    cost: 0,
    steps: 0,
    userMessages: 0,
    messages: 0,
    models: Object.create(null),
    callSlots: Object.create(null),
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

function negateUsage(usage) {
  return {
    input: -Number(usage?.input || 0),
    cacheRead: -Number(usage?.cacheRead || 0),
    cacheWrite: -Number(usage?.cacheWrite || 0),
    output: -Number(usage?.output || 0),
    reasoning: -Number(usage?.reasoning || 0),
    total: -Number(usage?.total || 0),
  }
}

function slotKey(turn, step) {
  return `${Number(turn) || 0}:${Number(step) || 0}`
}

/**
 * Reverse one call sample from every bucket. A revised `assistant/message`
 * replaces the previous sample for the same turn/step; a retry event closes the
 * slot so the next attempt is added instead. Keeping the contribution's exact
 * day/model/turn lets a cross-day or cross-model revision reverse cleanly.
 */
function removeSample(record, sample) {
  addUsage(record.usage, negateUsage(sample.usage))
  record.cost -= sample.cost
  const day = ensureDay(record, sample.day)
  day.cost -= sample.cost
  addUsage(day, negateUsage(sample.usage))
  if (sample.countMessage) day.messages -= 1
  const modelBucket = ensureModel(record, sample.provider, sample.model)
  modelBucket.cost -= sample.cost
  addUsage(modelBucket, negateUsage(sample.usage))
  if (sample.countMessage) modelBucket.messages -= 1
  const turn = ensureTurn(record, sample.turn, sample.time)
  turn.cost -= sample.cost
  addUsage(turn.usage, negateUsage(sample.usage))
  if (sample.countMessage) turn.messages -= 1
}

function addPricedSample(record, data, usage, priced, model, provider, time, seq, countMessage) {
  const turnNumber = Number(data.turn) || 0
  const stepNumber = Number(data.step) || 0
  const key = slotKey(turnNumber, stepNumber)
  const previous = record.callSlots[key]
  if (previous) removeSample(record, previous)
  if (previous?.countMessage) record.messages -= 1

  addUsage(record.usage, usage)
  record.cost += priced.cost
  const day = ensureDay(record, dayKey(time))
  day.cost += priced.cost
  addUsage(day, usage)
  if (countMessage) {
    record.messages += 1
    day.messages += 1
  }
  const modelBucket = ensureModel(record, provider, model)
  modelBucket.cost += priced.cost
  addUsage(modelBucket, usage)
  if (countMessage) modelBucket.messages += 1
  const turn = touchTurn(record, data.turn, time, seq)
  turn.cost += priced.cost
  addUsage(turn.usage, usage)
  if (countMessage) turn.messages += 1

  record.callSlots[key] = {
    turn: turnNumber,
    step: stepNumber,
    time,
    day: dayKey(time),
    model,
    provider,
    countMessage: !!countMessage,
    cost: priced.cost,
    usage: { ...usage },
  }
}

/**
 * A message revision with no usage sample still replaces the visible message,
 * but must not wipe the prior call's token/cost contribution. Update only the
 * message counts on the existing slot (or create a zero-usage slot when this is
 * the first sample).
 */
function addMessageOnly(record, data, model, provider, time, seq) {
  const key = slotKey(data.turn, data.step)
  const previous = record.callSlots[key]
  if (previous?.countMessage) return
  if (!previous) {
    const day = ensureDay(record, dayKey(time))
    const modelBucket = ensureModel(record, provider, model)
    const turn = touchTurn(record, data.turn, time, seq)
    record.messages += 1
    day.messages += 1
    modelBucket.messages += 1
    turn.messages += 1
    record.callSlots[key] = {
      turn: Number(data.turn) || 0,
      step: Number(data.step) || 0,
      time,
      day: dayKey(time),
      model,
      provider,
      countMessage: true,
      cost: 0,
      usage: emptyUsage(),
    }
    return
  }
  // A prior attempt's sample stays; add the message count to its buckets.
  const day = ensureDay(record, previous.day)
  const modelBucket = ensureModel(record, previous.provider, previous.model)
  const turn = touchTurn(record, previous.turn, previous.time, seq)
  record.messages += 1
  day.messages += 1
  modelBucket.messages += 1
  turn.messages += 1
  previous.countMessage = true
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
      case 'request/header': {
        const config = data.header?.config
        if (config && typeof config === 'object') {
          if (typeof config.model === 'string' && config.model) record.lastModel = config.model
          if (typeof config.provider === 'string' && config.provider) record.lastProvider = config.provider
        }
        break
      }
      case 'request/context': {
        if (typeof data.model === 'string' && data.model) record.lastModel = data.model
        if (typeof data.provider === 'string' && data.provider) record.lastProvider = data.provider
        break
      }
      case 'llm/retry-started': {
        const turn = Number(data.turn) || 0
        const hasStep = data.step !== undefined && data.step !== null
        const step = Number(data.step) || 0
        if (hasStep) {
          delete record.callSlots[slotKey(turn, step)]
        } else {
          for (const key of Object.keys(record.callSlots)) {
            if (Number(key.split(':')[0]) === turn) delete record.callSlots[key]
          }
        }
        break
      }
      case 'assistant/message': {
        const usage = data.usage
          ? usageOf(data.usage)
          : usageFromStream(data.stream)
        const model = data.message?.source?.model || record.lastModel || ''
        const provider = data.message?.source?.provider || record.lastProvider || ''
        if (model) record.lastModel = model
        if (provider) record.lastProvider = provider
        if (!usage) {
          addMessageOnly(record, data, model, provider, time, seq)
          break
        }
        const priced = priceUsage(pricing, usage, model, time)
        addPricedSample(record, data, usage, priced, model, provider, time, seq, true)
        break
      }
      case 'assistant/attempt': {
        // A failed, retried, or stream-error attempt has no assistant/message.
        // Its accounting lives only in the stream; count those tokens and the
        // money, but not a model-visible message. A revision replaces the
        // previous sample for the same turn/step; llm/retry-started closes it.
        // No usage sample at all retains the previous contribution; an explicit
        // zero sample replaces it.
        const usage = data.usage
          ? usageOf(data.usage)
          : usageFromStream(data.stream)
        if (!usage) break
        const model = data.message?.source?.model || record.lastModel || ''
        const provider = data.message?.source?.provider || record.lastProvider || ''
        const priced = priceUsage(pricing, usage, model, time)
        addPricedSample(record, data, usage, priced, model, provider, time, seq, false)
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
