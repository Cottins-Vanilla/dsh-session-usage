import test from 'node:test'
import assert from 'node:assert/strict'

import { apply } from '../index.js'
import { resolvePricing, priceUsage } from '../lib/pricing.js'
import { createRecord, foldEvents, summarizeRecord } from '../lib/stats.js'

// Saturday 08:00 Beijing = off-peak.
const OFF_PEAK = Date.UTC(2026, 10, 7, 0, 0, 0)
// Friday 10:00 Beijing = peak.
const PEAK = Date.UTC(2026, 10, 6, 2, 0, 0)

function usage(input = 0, output = 0, cacheRead = 0) {
  return { inputTokens: input, outputTokens: output, cacheReadTokens: cacheRead, totalTokens: input + cacheRead + output }
}

function usageChunk(value, time = OFF_PEAK) {
  return { type: 'chunk', time, chunk: { type: 'usage', usage: value } }
}

function messageEvent(seq, value, time = OFF_PEAK, model = 'deepseek-flash', withUsage = true) {
  return {
    seq,
    time,
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 1,
      message: { source: { provider: 'deepseek', model }, content: [] },
      ...(withUsage ? { usage: value } : {}),
      stream: withUsage ? [] : [usageChunk(value, time)],
    },
  }
}

function attemptEvent(seq, value, time = OFF_PEAK) {
  return {
    seq,
    time,
    type: 'assistant/attempt',
    data: { turn: 1, step: 1, stream: [usageChunk(value, time)] },
  }
}

function requestHeader(seq, model = 'deepseek-flash', time = OFF_PEAK) {
  return {
    seq,
    time,
    type: 'request/header',
    data: { header: { config: { provider: 'deepseek', model } }, reason: 'initial' },
  }
}

function retryStarted(seq, turn = 1, step = 1, time = OFF_PEAK) {
  return { seq, time, type: 'llm/retry-started', data: { turn, step } }
}

function recordFor(events, pricing = resolvePricing()) {
  const record = createRecord({ id: 's1', cwd: 'E:/demo', createdAt: 1 })
  foldEvents(record, events, pricing)
  return { record, summary: summarizeRecord(record) }
}

test('default prices match the published Flash/Pro table, including peak windows', () => {
  const pricing = resolvePricing()
  const flashInput = priceUsage(pricing, { input: 1_000_000 }, 'deepseek-flash', OFF_PEAK)
  const flashHit = priceUsage(pricing, { cacheRead: 1_000_000 }, 'deepseek-flash', OFF_PEAK)
  const flashOutput = priceUsage(pricing, { output: 1_000_000 }, 'deepseek-flash', OFF_PEAK)
  const proInput = priceUsage(pricing, { input: 1_000_000 }, 'deepseek-v4-pro', OFF_PEAK)
  const peakInput = priceUsage(pricing, { input: 1_000_000 }, 'deepseek-flash', PEAK)

  assert.equal(flashInput.cost, 1)
  assert.equal(flashHit.cost, 0.02)
  assert.equal(flashOutput.cost, 4)
  assert.equal(proInput.cost, 4.5)
  assert.equal(peakInput.cost, 2)
  assert.equal(peakInput.peak, true)
})

test('invalid model and fallback rates throw instead of silently reusing Flash', () => {
  assert.throws(
    () => resolvePricing({ models: { 'deepseek-v4-pro': { hit: 0.15, miss: 4.5, out: 'oops' } } }),
    /Invalid pricing\.models\["deepseek-v4-pro"\]/,
  )
  assert.throws(
    () => resolvePricing({ models: { 'my-model': { hit: 0.1, miss: 2 } } }),
    /Invalid pricing\.models\["my-model"\]/,
  )
  assert.throws(
    () => resolvePricing({ fallback: { hit: 0.1, miss: 2, out: 'oops' } }),
    /Invalid pricing\.fallback/,
  )
})

test('valid model override is used at the overridden price', () => {
  const pricing = resolvePricing({ models: { 'my-model': { hit: 0.1, miss: 2, out: 6 } } })
  const priced = priceUsage(pricing, { input: 1_000_000 }, 'my-model', OFF_PEAK)
  assert.equal(priced.cost, 2)
})

test('failed attempt stream usage is counted once alongside the successful retry', () => {
  const { record, summary } = recordFor([
    requestHeader(1),
    attemptEvent(2, usage(1_000_000)),
    retryStarted(3),
    messageEvent(4, usage(1_000_000)),
  ])

  assert.equal(summary.tokens, 2_000_000)
  assert.equal(summary.cost, 2)
  assert.equal(summary.messages, 1)
  assert.equal(record.turns[0].usage.total, 2_000_000)
  assert.equal(record.turns[0].cost, 2)
  assert.equal(record.models['deepseek-flash'].total, 2_000_000)
  assert.equal(record.days['2026-11-07'].cost, 2)
  assert.equal(record.days['2026-11-07'].messages, 1)
})

test('same turn/step usage revision replaces, not adds', () => {
  const { record, summary } = recordFor([
    messageEvent(1, usage(1_000_000)),
    messageEvent(2, usage(1_500_000)),
  ])
  assert.equal(summary.tokens, 1_500_000)
  assert.equal(summary.cost, 1.5)
  assert.equal(summary.messages, 1)
  assert.equal(record.turns[0].usage.total, 1_500_000)
})

test('usage revision can decrease and still replaces', () => {
  const { summary } = recordFor([
    messageEvent(1, usage(1_500_000)),
    messageEvent(2, usage(1_000_000)),
  ])
  assert.equal(summary.tokens, 1_000_000)
  assert.equal(summary.cost, 1)
  assert.equal(summary.messages, 1)
})

test('same-call revision reverses the old day and model buckets', () => {
  const { record, summary } = recordFor([
    messageEvent(1, usage(1_000_000), OFF_PEAK, 'deepseek-flash'),
    messageEvent(2, usage(1_500_000), PEAK, 'deepseek-v4-pro'),
  ])
  assert.equal(summary.tokens, 1_500_000)
  assert.equal(summary.cost, 13.5)
  assert.equal(summary.messages, 1)
  assert.equal(record.days['2026-11-07'].total, 0)
  assert.equal(record.days['2026-11-06'].cost, 13.5)
  assert.equal(record.models['deepseek-flash'].total, 0)
  assert.equal(record.models['deepseek-v4-pro'].total, 1_500_000)
})

test('attempt usage uses the model from the preceding request header', () => {
  const { summary } = recordFor([
    requestHeader(1, 'deepseek-v4-pro'),
    attemptEvent(2, usage(1_000_000)),
  ])
  assert.equal(summary.tokens, 1_000_000)
  assert.equal(summary.cost, 4.5)
  assert.equal(summary.messages, 0)
})

test('assistant message falls back to stream usage when data.usage is absent', () => {
  const { summary } = recordFor([messageEvent(1, usage(1_000_000), OFF_PEAK, 'deepseek-flash', false)])
  assert.equal(summary.tokens, 1_000_000)
  assert.equal(summary.cost, 1)
  assert.equal(summary.messages, 1)
})

test('message data.usage wins over its stream and is not double counted', () => {
  const event = messageEvent(1, usage(1_000_000))
  event.data.stream = [usageChunk(usage(1_000_000))]
  const { summary } = recordFor([event])
  assert.equal(summary.tokens, 1_000_000)
  assert.equal(summary.cost, 1)
})

test('attempt without billable usage is ignored', () => {
  const { summary } = recordFor([attemptEvent(1, usage(0))])
  assert.equal(summary.tokens, 0)
  assert.equal(summary.cost, 0)
  assert.equal(summary.messages, 0)
})

test('concurrent All conversations requests fold one cold session once', async () => {
  let reads = 0
  const header = { id: 's1', cwd: 'E:/demo', createdAt: 1 }
  const snapshot = {
    session: header,
    inheritedEventCount: 0,
    events: [messageEvent(1, usage(1_000_000))],
  }
  const routes = new Map()
  const ctx = {
    get(name) {
      if (name === 'sessions') return { list: () => [] }
      if (name === 'sessionQuery') {
        return {
          listSessions: async () => [{ header }],
          readSession: async () => {
            reads += 1
            await new Promise((resolve) => setTimeout(resolve, 20))
            return snapshot
          },
        }
      }
      return undefined
    },
    inject(names, callback) {
      if (!names.includes('connection')) return
      const connectionCtx = {
        get: (name) => name === 'connection'
          ? { fetch: { register: (options) => { routes.set(options.path, options) } } }
          : undefined,
        effect: (fn) => fn(),
      }
      callback(connectionCtx)
    },
  }
  apply(ctx, {})
  const handler = routes.get('/api/session-usage/query').fetch
  const request = { json: async () => ({ scope: 'all' }) }

  const responses = await Promise.all([handler(request), handler(request)])
  const bodies = await Promise.all(responses.map((response) => response.json()))
  assert.equal(reads, 1)
  for (const body of bodies) {
    assert.equal(body.totals.tokens, 1_000_000)
    assert.equal(body.totals.cost, 1)
  }

  const third = await (await handler(request)).json()
  assert.equal(third.totals.tokens, 1_000_000)
  assert.equal(third.totals.cost, 1)
})

test('live-to-cold transition folds the persisted tail exactly once', async () => {
  let reads = 0
  let live = true
  const header = { id: 's1', cwd: 'E:/demo', createdAt: 1 }
  const first = messageEvent(1, usage(1_000_000))
  const tail = messageEvent(2, usage(1_000_000))
  tail.data.turn = 2
  tail.data.step = 1
  const liveSession = {
    id: 's1',
    header,
    inheritedEventCount: 0,
    ownEvents: () => [first],
  }
  const routes = new Map()
  const ctx = {
    get(name) {
      if (name === 'sessions') return { list: () => (live ? [liveSession] : []) }
      if (name === 'sessionQuery') {
        return {
          listSessions: async () => [{ header }],
          readSession: async () => {
            reads += 1
            return { session: header, inheritedEventCount: 0, events: [first, tail] }
          },
        }
      }
      return undefined
    },
    inject(names, callback) {
      if (!names.includes('connection')) return
      const connectionCtx = {
        get: (name) => name === 'connection'
          ? { fetch: { register: (options) => { routes.set(options.path, options) } } }
          : undefined,
        effect: (fn) => fn(),
      }
      callback(connectionCtx)
    },
  }
  apply(ctx, {})
  const handler = routes.get('/api/session-usage/query').fetch
  const request = { json: async () => ({ scope: 'all' }) }

  const whileLive = await (await handler(request)).json()
  assert.equal(whileLive.totals.tokens, 1_000_000)
  assert.equal(whileLive.totals.cost, 1)
  assert.equal(whileLive.sessions[0].live, true)
  assert.equal(reads, 0)

  live = false
  const after = await (await handler(request)).json()
  assert.equal(after.totals.tokens, 2_000_000)
  assert.equal(after.totals.cost, 2)
  assert.equal(after.sessions[0].live, false)
  assert.equal(reads, 1)
  assert.equal(after.session, null)

  const cached = await (await handler(request)).json()
  assert.equal(cached.totals.tokens, 2_000_000)
  assert.equal(cached.totals.cost, 2)
  assert.equal(reads, 1)
})
