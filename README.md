# dsh-session-usage

A DeepSeek Harness plugin that shows what each conversation costs in money and
tokens.

## What it adds

- **Session header chip** — the current conversation's estimated price and total
  tokens. Click it to open the dashboard.
- **Usage tab** — a **用量 / Usage** entry in the conversation's top View tabs,
  showing the same dashboard for the open session.
- **Session usage page** — a first-class sidebar panel beside Plugins and
  Automation tasks:
  - **Scope**: current conversation, current project (the current conversation's
    working directory), or all conversations. Each option names its target: the
    conversation title, the project folder, or the conversation count.
  - **Metric**: price, total tokens, input tokens, output tokens, or cache-read
    tokens.
  - **Curve**: switch between a zero-filled daily curve and a per-turn cumulative
    curve. The per-turn curve draws the eight most expensive conversations in
    distinct colors plus a gray “other conversations” aggregate; the legend names
    each conversation (and its project when viewing all conversations) and can
    hide or show a series.
  - **Details**: a sortable conversation list; every row opens that conversation.
    The current conversation's view lists each turn.
- **Turn price badge** — after every completed answer, the conversation shows a
  badge with the conversation's total price up to that answer and that turn's
  price. It defaults to white and the color can be changed from the panel's
  **标记颜色 / Badge color** control (white plus color presets, or a custom
  color picker). The choice is remembered in local storage.
- Subagent sessions are included in the totals and marked in the list, because
  their model calls are billed too.

## How the numbers are produced

The Host half folds committed `assistant/message` events (`usage` plus
`message.source.model`) from the session log. Live sessions are read from the
in-memory store; cold sessions come from `sessionQuery.readSession()`. Nothing
is persisted by the plugin, and inherited fork/seed events are skipped so they
are never billed twice.

Prices are an estimate. The default table follows DeepSeek's published CNY list
prices (`deepseek-flash`: 0.02 cache hit / 1 miss / 4 output per 1M tokens;
`deepseek-v4-pro`: 0.15 / 4.5 / 13.5), with 2× billing in the Beijing-time peak
windows (Mon–Fri 09:00–12:00 and 14:00–18:00) and off-peak weekends and Chinese
public holidays. The 2026 holiday list is bundled; update it for later years.

## Configuration

The bundle row accepts an optional `config` object. Values override the built-in
defaults:

```yaml
- id: session-usage
  config:
    chartDays: 14        # 2..60 daily points for project/all charts
    maxSessions: 400     # newest N sessions to scan
    pricing:
      currency: CNY
      peakMultiplier: 2
      models:
        deepseek-v4-pro: { hit: 0.15, miss: 4.5, out: 13.5 }
        deepseek-flash: { hit: 0.02, miss: 1, out: 4 }
        my-model: { hit: 0.1, miss: 2, out: 6 }
      fallback: { hit: 0.02, miss: 1, out: 4 }
      holidays: ['2026-10-01']
```

`models` keys match case-insensitively as substrings of the model id, longest
key first. The first load of "All conversations" reads every cold session once
and caches the folded index in memory; later openings and the 15-second refresh
only fold newly committed live events. The turn badge shares one request per
conversation and refreshes it only when a newer turn appears.

## Install

This is a local bundle: install its directory with the Plugin Manager's bundle
installation (the same action used for a workspace bundle). The bundle declares
one Host row and one web Client module, so it needs no build step. After the
first installation the Host half stays loaded until the plugin is toggled or the
app restarts; a browser refresh is enough to pick up Client-only edits.
