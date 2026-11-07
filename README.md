# Session Usage for DeepSeek Harness

<p align="center">
  <img src="icon.svg" alt="Session usage icon" width="72" height="72">
</p>

[English](README.md) | [中文](README.zh.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.19-339933)](package.json)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-0.2.2--rc.1-4C6EF5)](https://github.com/deepseek-ai/deepseek-harness)
[![Platform](https://img.shields.io/badge/platform-web-8A2BE2)](#compatibility)

A DeepSeek Harness plugin that answers one question for every conversation:
**what did it cost, in money and tokens?**

It reads the committed session log, folds `assistant/message` usage into
per-conversation and per-turn totals, and presents them in the places where you
already work: the sidebar, the conversation's View tabs, the session header, and
the end of every answer.

## Surfaces

| Surface | Where | What it shows |
| --- | --- | --- |
| **Usage panel** | Sidebar → **会话用量 / Session usage** | The full dashboard: KPIs, daily and per-turn curves, conversation list |
| **Usage tab** | Conversation View tabs → **用量 / Usage** | The same dashboard, scoped to the open conversation |
| **Session header chip** | Right side of the conversation header | Current conversation price and total tokens; click to open the panel |
| **Turn price badge** | After every completed answer | `本轮 ¥… · 当前对话 ¥…` — this turn's price first, then the conversation total, with a white default and a configurable accent |

```text
Sidebar
  └─ 会话用量  ← full dashboard

Conversation header
  ├─ [Chat] [Trajectory] [用量] [Context] [Fleet]
  └─ ¥0.1234 · 12.3k tokens        ← header chip

End of a completed answer
  └─ 本轮 ¥0.1234 · 当前对话 ¥1.2345   ← turn badge
```

## Features

- **Five metrics** — price, total tokens, input tokens, output tokens, and
  cache-read tokens.
- **Three scopes** — current conversation, current project (the conversation's
  working directory), or all conversations. Every scope names its target: the
  conversation title, the project folder, or the number of conversations.
- **Two curves** — a zero-filled daily curve and a per-turn cumulative curve.
  - The per-turn curve gives the eight most expensive conversations their own
    colors and folds the rest into a gray **other conversations** series.
  - A legend shows the color, title, project, and total for each series; click a
    legend item to hide or show that conversation.
  - Hover any point to inspect the cumulative value of every visible series.
- **Click-through** — every conversation row opens that conversation; the
  current-conversation view also lists each turn.
- **Turn cost badges** — after each answer, the badge shows that turn's price
  first, then the conversation total up to that answer. The default is white; the
  panel's **标记颜色 / Badge color** control offers white, color presets, and a
  custom color picker. The choice is stored locally.
- **Live enough** — the panel refreshes every 15 seconds, the header chip every
  8 seconds, and turn badges share one request per conversation.
- **Bilingual** — complete English and Simplified Chinese dictionaries.
- **Read-only by design** — no session-log writes, no profile edits, no
  third-party network calls, and no telemetry.

## Install

### Requirements

- DeepSeek Harness **0.2.2-rc.1** (tested) with the Web UI.
- Node.js **22.19+**.
- A profile with the Web app enabled.

### Option A — install from this repository

In the Web UI, open **Plugins → Add plugin**, choose the GitHub source, and enter:

```text
https://github.com/Cottins-Vanilla/dsh-session-usage
```

Or with the CLI, using the profile name that owns your Web UI:

```sh
dsh plugin --profile desktop add https://github.com/Cottins-Vanilla/dsh-session-usage
```

### Option B — install a local checkout

```sh
git clone https://github.com/Cottins-Vanilla/dsh-session-usage.git
dsh plugin --profile desktop add ./dsh-session-usage
```

The bundle has no build step and no runtime dependencies. Installation enables
it by default; if your app is already running, refresh the page. If the Host
half cannot reload through HMR, restart the app once.

### Uninstall

Use **Plugins → Session usage → Remove** in the Web UI, or:

```sh
dsh plugin --profile desktop remove dsh-session-usage
```

## Usage

### Scope

The scope row is a labeled control, not a set of loose labels:

- **当前对话 / Current conversation · `<title>`** — the conversation you last
  opened in this page.
- **当前项目 / Current project · `<folder>`** — sessions whose recorded `cwd`
  matches the current conversation's `cwd`. Hover the button for the full path.
- **全部对话 / All conversations · `<n>`** — every live or persisted session
  visible to `sessionQuery`.

The current-conversation and current-project options are disabled until a
conversation has been opened in this page.

### Curve modes

Use the **每日 / Daily** and **每轮累计 / By turn** toggle at the top right of the
chart card.

- **Daily** is a zero-filled window of `chartDays` calendar days, ending today
  (Beijing date). It answers "when did I spend what?"
- **By turn** plots each conversation's cumulative metric against its turn
  number. It answers "how did this conversation grow, and which conversation is
  ahead at turn N?"

### Turn cost badges

Every completed turn renders a small badge in the chat:

```text
● 本轮 ¥0.1234 · 当前对话 ¥1.2345
```

- The first value is that turn's price; the second is the conversation total
  through that turn.
- The default is a solid white pill with dark text, readable in light and dark
  themes.
- Change the accent in the panel's **标记颜色 / Badge color** row. Presets include
  white, amber, red, blue, green, purple, and teal; the color picker accepts any
  hex color. The preference lives in `localStorage` under
  `dsh-session-usage.turnColor`.
- Clicking the badge opens the usage panel for that conversation.

## Pricing model

Prices are **estimates**. The Harness records token usage per assistant message
but does not record an invoice or a provider price.

The default table follows DeepSeek's published CNY list prices per 1M tokens:

| Model match | Cache hit | Cache miss (input) | Output |
| --- | ---: | ---: | ---: |
| `deepseek-flash` | 0.02 | 1 | 4 |
| `deepseek-v4-flash` | 0.02 | 1 | 4 |
| `deepseek-v4-flash-vision-exp` | 0.02 | 1 | 4 |
| `deepseek-v4-pro` | 0.15 | 4.5 | 13.5 |
| `deepseek-pro` | 0.15 | 4.5 | 13.5 |
| fallback | 0.02 | 1 | 4 |

For one message:

```text
cost = (cacheRead × hit + input × miss + cacheWrite × miss + output × out) / 1,000,000
       × (peak ? peakMultiplier : 1)
```

- Peak windows are Beijing time, Monday–Friday, **09:00–12:00** and
  **14:00–18:00**; `peakMultiplier` defaults to `2`.
- Weekends and the bundled 2026 Chinese public holidays bill at the off-peak
  rate.
- `outputTokens` already contains `reasoningTokens` in the Session contract, so
  reasoning is not added twice.
- `totalTokens` is `input + cacheRead + cacheWrite + output`; the plugin honors
  an explicit `totalTokens` when the provider supplies one.
- Subagent sessions are included in project/all totals and marked **subagent**
  in the list.

See [docs/pricing.md](docs/pricing.md) for the full rules and caveats.

## Configuration

The bundle row accepts an optional `config` object. Values override the built-in
defaults; see [docs/configuration.md](docs/configuration.md) for every field.

```yaml
- id: session-usage
  config:
    chartDays: 14              # daily points, 2..60
    maxSessions: 400           # newest N sessions to scan, 1..2000
    pricing:
      currency: CNY
      peakMultiplier: 2
      peakHours: [[9, 12], [14, 18]]
      weekendValley: true
      models:
        deepseek-v4-pro: { hit: 0.15, miss: 4.5, out: 13.5 }
        deepseek-flash: { hit: 0.02, miss: 1, out: 4 }
        my-model: { hit: 0.1, miss: 2, out: 6 }
      fallback: { hit: 0.02, miss: 1, out: 4 }
      holidays: ['2026-10-01']
```

Model keys match case-insensitively as substrings of the model id, longest key
first. The first **All conversations** query reads every cold session once and
caches the folded index in memory; later queries only fold newly committed live
events.

## Data, privacy, and security

- **Source of truth** — the committed Session log. Live sessions are folded from
  the in-memory store; cold sessions are read through
  `sessionQuery.readSession()`. The plugin never appends events and never writes
  session data.
- **No external network** — the only HTTP request is the same-origin,
  authenticated `POST /api/session-usage/query` between this bundle's Client and
  Host halves.
- **No telemetry** — nothing is reported to the author or a third party.
- **No secrets** — the plugin reads token counts and model ids, not credentials
  or account data. The only message text it retains is a short fallback title
  (up to 120 characters) derived from the first user message when the session has
  no title event.
- **Bounded work** — `maxSessions` caps the scan; the query route is read-only;
  failed sessions are isolated and reported as a warning count.

See [SECURITY.md](SECURITY.md) for reporting a vulnerability.

## Architecture

```text
Session log ──► Host fold (lib/stats.js + lib/pricing.js)
                   │
                   ├── per-session totals (tokens, price, models, days, turns)
                   ├── per-turn points (cost, tokens, seq)
                   └── POST /api/session-usage/query
                              │
Client (client.js) ◄──────────┘
  ├── sidebar panel (main + sidebar.panellist)
  ├── 用量 View tab (conversation.view)
  ├── header chip (conversation.session.header.utilities)
  └── turn badges (conversation.chat.turnTail)
```

The Host keeps a derived in-memory index; it is a cache, not a second source of
truth. The Client renders with theme tokens, does not import Harness Client
packages, and reads session data only through the Host response.

More detail: [docs/architecture.md](docs/architecture.md).

## Project layout

```text
dsh-session-usage/
├── index.js                 Host half: route, session scan, caches
├── client.js                Web Client half: slots, charts, badges, locales
├── lib/
│   ├── pricing.js           Price table, peak windows, cost formula
│   └── stats.js             Event fold, per-turn/day aggregation
├── locale/{en,zh}.json      Plugin Manager display metadata
├── cordis.patch.yml         Bundle layer: one Host row
├── icon.svg                 Plugin icon (original artwork, MIT)
├── scripts/check.mjs        Dependency-free repository checks / CI
├── docs/                    Architecture, configuration, pricing, publishing
├── examples/                Example profile patch
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE
```

## Development

There is no compilation step. Edit `client.js` / `index.js` / `lib/*.js` and run:

```sh
npm test          # node scripts/check.mjs
```

The check validates the manifest, exports, locale metadata, SVG size, the
Client loader id, JavaScript syntax, and the absence of temporary/local files.

To preview a local checkout, install its directory as a bundle (see above).
Client-only edits are picked up by a page refresh after the bundle reloads;
Host-side edits need the plugin to be toggled or the app restarted.

## Compatibility and known limitations

- Tested with DeepSeek Harness **0.2.2-rc.1**, Web platform only.
- Prices are estimates; the bundled 2026 holiday table must be updated for later
  years. Override `pricing.models` and `pricing.holidays` for other providers or
  new prices.
- The first **All conversations** query can take a moment on a large history
  because cold logs are read once; later queries are incremental.
- "Current project" compares recorded `cwd` values; it is not a full workspace
  registry mapping.
- The npm package name `dsh-session-usage` is occupied by an unrelated project.
  This repository is distributed as a GitHub/local bundle. See
  [docs/publishing.md](docs/publishing.md) before attempting an npm release.
- Screenshots are not committed; the UI map above describes every surface.

## Contributing

Issues and pull requests are welcome. Read
[CONTRIBUTING.md](CONTRIBUTING.md) and follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2026 Cottins-Vanilla.

DeepSeek, DeepSeek Harness, and related marks belong to their respective owners.
This plugin is not an official DeepSeek product.
