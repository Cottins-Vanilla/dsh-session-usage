# Configuration

The plugin reads an optional `config` object from its Loader row. Everything has
a safe default, so an empty row works.

## Where the config lives

The bundle's own patch inserts one row:

```yaml
# cordis.patch.yml (inside this package)
- insert:
    - id: session-usage
      name: dsh-session-usage
```

To tune it, override the same row in the profile patch:

```yaml
- id: session-usage
  config:
    chartDays: 21
    maxSessions: 250
    pricing:
      currency: CNY
      peakMultiplier: 2
      models:
        deepseek-flash: { hit: 0.02, miss: 1, out: 4 }
```

A profile override replaces the complete `config` object for that row. The
plugin still merges its own defaults underneath, so partial top-level objects
are safe; model rate rows must be complete. Unknown fields are ignored.

## Top-level fields

| Field | Type | Default | Meaning |
| --- | --- | ---: | --- |
| `chartDays` | integer | `14` | Daily points in the daily chart; clamped to `2..60` |
| `maxSessions` | integer | `400` | Newest N sessions scanned for **All conversations**; clamped to `1..2000` |
| `pricing` | object | see below | Price table and peak-window rules |

Invalid numbers fall back to the default. Decimal values are truncated.

## Pricing fields

| Field | Type | Default | Meaning |
| --- | --- | ---: | --- |
| `pricing.currency` | string | `CNY` | Three-letter currency code used by the Client symbol |
| `pricing.peakMultiplier` | number | `2` | Multiplier applied during peak windows |
| `pricing.peakHours` | array of `[start, end]` | `[[9,12],[14,18]]` | Beijing local hours; start inclusive, end exclusive |
| `pricing.weekendValley` | boolean | `true` | Bill Saturday/Sunday at the off-peak rate |
| `pricing.holidays` | array of `YYYY-MM-DD` | 2026 Chinese public holidays | Days billed at the off-peak rate |
| `pricing.models` | object | DeepSeek Flash/Pro table | Model-match → `{ hit, miss, out }` CNY per 1M tokens |
| `pricing.fallback` | object | Flash rates | Rates used when no model key matches |

`pricing.models` keys match case-insensitively as **substrings** of the model id,
longest key first. For example, `deepseek-v4-flash` wins over `deepseek-flash`.
Each model row and `pricing.fallback` must contain non-negative numeric `hit`,
`miss`, and `out`; a malformed or partial row throws at plugin startup instead of
being silently dropped. Top-level fields remain optional and merge with defaults.

There is no separate cache-write rate: `cacheWriteTokens` is billed at the
`miss` rate. This is correct for the current DeepSeek table, where cache writes
are zero or included in the miss price.

## Example: a different provider

```yaml
- id: session-usage
  config:
    pricing:
      currency: USD
      peakMultiplier: 1
      weekendValley: false
      holidays: []
      models:
        gpt-5.2: { hit: 0.125, miss: 1.25, out: 10 }
        claude-sonnet-4.5: { hit: 0.3, miss: 3, out: 15 }
      fallback: { hit: 0.125, miss: 1.25, out: 10 }
```

The parser is not a full pricing engine. It does not model per-request image
charges, batch discounts, long-context tiers, or provider-specific cache-write
premiums. See [pricing.md](pricing.md).

## Client preferences

These are not part of the Host config:

| Storage key | Values | Effect |
| --- | --- | --- |
| `dsh-session-usage.metric` | `cost`, `tokens`, `input`, `output`, `cacheRead` | Selected metric |
| `dsh-session-usage.turnColor` | `#RRGGBB` | Turn badge accent; default `#FFFFFF` |

The chart mode is not persisted: the current conversation opens in **每轮值**
(Per-turn value), and project/all open in **每日** (Daily). Switching the mode
applies until the scope changes or the panel unmounts.

The badge color control is in the panel's **标记颜色 / Badge color** row. White is
the first preset and the default. A custom color is stored in the same key and
survives a refresh. The Client catches storage errors, so a profile with
`--no-webstorage` still works with in-memory defaults.

## Update check

The panel's **检查更新 / Check for updates** button calls the same-origin
`POST /api/session-usage/update` route. The Host reads the installed
`package.json` version and fetches the latest GitHub release tag from
`api.github.com`; it compares the two and caches a successful result for six
hours. The check is manual — there is no background polling and no config key
for it. A failure is non-fatal and appears as a small header note; it never
blocks the usage query. No session contents or identity are sent.

## Recommended starting points

- Small laptop or a long history: `maxSessions: 150`, `chartDays: 7`.
- Team billing review: `maxSessions: 1000`, `chartDays: 30`.
- Non-DeepSeek provider: set `currency`, `peakMultiplier: 1`,
  `weekendValley: false`, `holidays: []`, and your model table.

## Verification

After changing the config, toggle the plugin or restart the Host. Check the
panel footer: it shows the current peak status and the generated time. The price
table itself is not rendered, so verify a known message by comparing a synthetic
calculation with the panel total.

Run `npm test` before committing config or documentation changes.
