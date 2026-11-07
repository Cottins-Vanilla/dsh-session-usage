# Pricing

The Harness records token usage, not money. This plugin turns one into the other
with a small, transparent table. Treat every amount as an estimate.

## Formula

For one `assistant/message` or `assistant/attempt` at time `t`:

```text
rates = table.match(model) or table.fallback

cost = (
    cacheReadTokens  × rates.hit
  + inputTokens      × rates.miss
  + cacheWriteTokens × rates.miss
  + outputTokens     × rates.out
) / 1,000,000

if model starts with "deepseek" and isPeak(t):
    cost = cost × peakMultiplier
```

- `inputTokens` is **uncached** input, as defined by the Session `TokenUsage`
  contract. Cached input is in `cacheReadTokens`.
- `outputTokens` already contains `reasoningTokens`; reasoning is never added a
  second time.
- `cacheWriteTokens` is billed at the miss rate because the default DeepSeek
  table has no separate write rate.
- The total token figure is `input + cacheRead + cacheWrite + output` (or an
  explicit `totalTokens` when the provider supplies one).
- `assistant/message` uses `data.usage`; if that field is absent, the last
  `usage` chunk in its stream is used instead.
- `assistant/attempt` has no message and no `data.usage`. Its billable usage is
  read from the last `usage` chunk in `data.stream`; tokens and cost are added to
  the session, day, model, and turn, but it is not counted as a visible message.
  The model comes from the preceding `request/header`/`request/context` or the
  last assistant message.
- A failed attempt followed by a successful retry therefore contributes both
  attempts' tokens, matching provider billing for the failed request.
- A later sample for the same `(turn, step)` **replaces** the previous sample
  (usage revisions); `llm/retry-started` closes that slot so the next attempt is
  added. The previous contribution is removed from session, day, model, and turn
  buckets before the replacement is added.

## Default table

CNY per 1,000,000 tokens, matched as a case-insensitive substring of the model
id, longest key first:

| Key | Cache hit | Cache miss | Output |
| --- | ---: | ---: | ---: |
| `deepseek-flash` | 0.02 | 1 | 4 |
| `deepseek-v4-flash` | 0.02 | 1 | 4 |
| `deepseek-v4-flash-vision-exp` | 0.02 | 1 | 4 |
| `deepseek-v4-pro` | 0.15 | 4.5 | 13.5 |
| `deepseek-pro` | 0.15 | 4.5 | 13.5 |
| `deepseek-chat` | 0.02 | 1 | 4 |
| `deepseek-reasoner` | 0.02 | 1 | 4 |
| fallback | 0.02 | 1 | 4 |

The defaults are based on DeepSeek's public pricing. Prices change; verify the
current official table before using these numbers for reconciliation.

## Overrides are validated

`pricing.models` and `pricing.fallback` rows must contain exactly three
non-negative **numbers** (`hit`, `miss`, `out`). A malformed row throws at plugin
startup with the offending key; it is never silently dropped. This prevents a
mistyped Pro row from quietly pricing Pro at the fallback (Flash) rate.

## Peak windows

- **Timezone:** Beijing (`UTC+08:00`), independent of the Host machine.
- **Peak:** Monday–Friday, `09:00–12:00` and `14:00–18:00`, end exclusive.
- **Off-peak:** all other hours, plus weekends (when `weekendValley` is true) and
  dates in `pricing.holidays`.
- **Multiplier:** `pricing.peakMultiplier`, default `2`.
- **Disabling peak:** set `pricing.peakHours: []`. An explicit empty array means
  no peak windows; it does not restore the defaults. Invalid ranges throw.
- **Scope:** the multiplier is applied only when the model id starts with
  `deepseek`; other providers use their rates unchanged.

The 2026 holiday list is bundled. Update `pricing.holidays` for later years.

## Where the money appears

- **KPI “Estimated price”** — all-time sum for the selected scope.
- **Daily chart** — the selected metric (price or tokens) per Beijing calendar
  day, zero-filled.
- **Per-turn value chart** — current conversation only; each point is that
  turn's own price/tokens, without accumulation.
- **Per-turn cumulative chart** — cumulative price/tokens by turn for each
  conversation.
- **Conversation list** — total price for each conversation; the price is also the
  secondary value when another metric is selected.
- **Header chip** — current conversation total price and tokens.
- **Turn badge** — that answer's price first, then the conversation total through
  that answer.

## Known approximations

| Topic | Behavior |
| --- | --- |
| Historical prices | The current table is applied to all history; past price changes are not modeled |
| Provider routes | Pricing keys use the model id, not the provider route; two routes for the same model share rates |
| Images and audio | Not modeled; only text token usage is priced |
| Cache writes | Billed at the miss rate |
| Reasoning | Included in output, not added separately |
| Currency | CNY by default; no FX conversion |
| Invoice reconciliation | Estimates can differ from the provider's invoice because of discounts, rounding, and unmodeled request charges |
| Free or granted quota | Not deducted; the estimate shows list-price value |

## Recomputing a message

For a message with `input=882`, `cacheRead=8576`, `output=482`, model
`deepseek-flash`, off-peak:

```text
(8576 × 0.02 + 882 × 1 + 482 × 4) / 1,000,000
= (171.52 + 882 + 1928) / 1,000,000
= 0.00298152 CNY
```

The panel formats it as `¥0.0030` (four decimals below ¥0.01). Per-turn and
per-conversation totals are summed from unrounded per-message costs and rounded
only for display/JSON (six decimal places).

## Overriding prices

```yaml
- id: session-usage
  config:
    pricing:
      currency: CNY
      models:
        deepseek-v4-pro: { hit: 0.2, miss: 5, out: 15 }
        my-model: { hit: 0.1, miss: 2, out: 6 }
      fallback: { hit: 0.02, miss: 1, out: 4 }
```

See [configuration.md](configuration.md) for every field.
