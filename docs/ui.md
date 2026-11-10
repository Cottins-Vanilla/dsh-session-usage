# UI map

This page describes what the plugin renders and where. It is the reference for
screenshots, reviews, and accessibility checks.

## Surfaces

```text
┌ Sidebar ─────────────┐  ┌ Conversation ─────────────────────────────────┐
│ Plugins              │  │  Title        [Chat] [Trajectory] [用量] …    │
│ Automation tasks     │  │                             ¥0.12 · 12.3k   │
│ 上下文洞察            │  │  ┌──────────────────────────────────────────┐  │
│ 会话用量              │  │  │  Conversation rows …                     │  │
│                      │  │  │                                          │  │
│                      │  │  │  ● 本轮 ¥0.1234 · 当前对话 ¥1.2345        │  │
│                      │  │  └──────────────────────────────────────────┘  │
└──────────────────────┘  └────────────────────────────────────────────────┘
```

| Surface | Slot | Scope | Content |
| --- | --- | --- | --- |
| Sidebar entry | `sidebar.panellist` | root | Chart glyph and “会话用量” label |
| Dashboard | `main` key `session-usage` | root | KPIs, chart, list, footer |
| Usage tab | `conversation.view` id `usage` | session | Same dashboard, current session prefilled |
| Header chip | `conversation.session.header.utilities` | session | Current price and tokens |
| Turn badge | `conversation.chat.turnTail` | session | This turn's price first, then the conversation total |

## Dashboard anatomy

1. **Header** — title, subtitle, loading indicator, **检查更新 / Check for
   updates**, and refresh.
   - The plugin checks once per Harness login; the button forces a check.
     A newer release shows a red dot at the button's upper-left and a release
     banner. A manual check also shows an up-to-date or failure banner, which
     disappears after 3.5 seconds; automatic failures stay silent.
   - The banner names the installed and latest versions and offers **查看 Release
     / View release** plus dismiss. It uses the GitHub release URL returned by the
     Host.
2. **Toolbar**
   - **统计范围 / Scope** — three labeled options. The label is a small caption
     above the control, not a button.
   - **显示指标 / Metric** — price, total tokens, input, output, cache reads.
   - **标记颜色 / Badge color** — white (default), six presets, custom picker.
3. **KPI band** — price, tokens, input/output, cache reads with hit rate, and
   conversations/turns/steps.
4. **Chart card**
   - Title and window/series note.
   - Mode toggle. For the current conversation, in order: **每轮值 / Per-turn
     value**, **每轮累计 / By turn**, **每日 / Daily**. For project/all:
     **每日 / Daily**, **每轮累计 / By turn**.
   - SVG curve; hover shows a guide and a tooltip.
   - Legend in By-turn modes: color, title, project (all scope), total, and a
     visibility toggle.
5. **Detail card**
   - Current scope: per-turn rows; clicking one opens the conversation (or
     switches the Usage tab back to Chat and lands on that turn).
   - Project/all scope: conversation rows with a value bar; click opens the
     conversation. The list shows 150 rows initially and exposes **Show more**
     in 150-row increments, with a “Showing 150 / N” note, so every counted
     conversation remains reachable.
6. **Footer** — estimate disclaimer, current peak status, generated time, and a
   warning count if any session failed to load.

## Scope labels

| Option | Example |
| --- | --- |
| Current conversation | `当前对话 · 【项目】单词UI` |
| Current project | `当前项目 · Harness` (hover shows the full path) |
| All conversations | `全部对话 · 16` (count appears when all is selected) |

If no conversation has been opened in the page, the first two options are
disabled and a short hint is shown.

## Header chip

The header chip polls every 8 seconds **after the previous request settles**. Each
poll has a monotonic request id; only the newest response may update the value or
mark a failure. A slow request is allowed to finish instead of being cancelled by
the next tick. If the latest poll fails after a successful value, the chip keeps
that value but appends **数据可能已过期 / may be stale** and explains the state in
its title; a first-load failure still shows the ordinary error label.

The dashboard follows the same completion-based schedule at 15 seconds. Manual
refresh, scope/session changes, and unmount still abort the active request.

## Chart behavior

- **Per-turn value** — current conversation only; each point is that turn
  alone, with no accumulation. This is the default for the current
  conversation.
- **By turn** — cumulative metric per turn. One colored line per top
  conversation, plus a gray aggregate for project/all.
- **Daily** — one line, zero-filled over `chartDays`, ending today.
- X axis is turn number (`T1`, `T2`, …), or the date in Daily mode; Y axis is
  the selected metric (single-turn in Per-turn value mode, cumulative in
  By-turn mode).
- Hover snaps to the nearest turn or day inside the plot area. The detail card
  floats near the pointer (right/below first, switching sides when needed),
  stays inside the visible chart area, and lists every visible series (not a
  silent top-six slice). It does not change chart height or cover the chart
  from a fixed top position.
- **Display range** appears as its own row below the mode switch for every
  per-turn mode: Current conversation (**每轮值 / 每轮累计**), Current project and
  All conversations (**每轮累计**). **不限 / All** is the default; entering a
  positive N limits the horizontal viewport to about N turns, with native
  horizontal scrolling through the full original turn axis. The cumulative
  series still accumulates from the real first turn; scrolling never rebases the
  values. Invalid input leaves the current range unchanged and shows a short
  error. Daily mode never applies it.
- No solid data-point markers are drawn in the default state. Hovering a column
  shows the hollow point(s) at that turn (background fill, series-colour stroke)
  for the visible series; project/all use the same hover-only marker. Daily mode
  always shows a marker for a single-day window.
- Clicking a rendered hollow marker opens that conversation; inside the Usage
  tab it selects the Chat view and addresses that turn. Line segments, aggregate
  markers, and blank space do not trigger.
- Turn navigation is bound to its target session: a pending jump is cancelled
  when the active session changes, and retries never touch a newer session's
  turn rail.
- Clicking a legend item hides or shows its series. Hidden series are dimmed in
  the legend; the Y scale reflows to the remaining series.
- If every series is hidden, the chart shows axes without lines; the legend
  remains available.

## Turn badge

```text
● 本轮 ¥0.1234 · 当前对话 ¥1.2345
```

- The turn price comes first and uses the primary text color; the conversation
  total follows in the secondary color.
- White background and dark text by default; other accents use a tinted
  background with the accent dot and border.
- Clicking opens the dashboard for that conversation.
- The badge is not rendered for a turn with no usage or while its data is
  loading; it does not reserve an empty placeholder.

## Color control

- White is first and selected by default.
- Presets: white, amber, red, blue, green, purple, teal.
- The native color input accepts any `#RRGGBB` value.
- The choice is stored in `localStorage` and applied to existing mounted badges
  through a small subscription store.

## Theming and accessibility

- All non-artwork colors use `--dsw-alias-*` tokens:
  `bg-base`, `bg-layer-1`, `bg-layer-2`, `bg-overlay`, `border-l1`, `border-l2`,
  `brand-primary`, `label-primary`, `label-secondary`, and state colors where
  relevant.
- Chart series colors and the white badge are intentional artwork/data colors,
  chosen for contrast on light and dark surfaces.
- Interactive elements are native `<button>`s with focus-visible outlines.
- The chart SVG has `role="img"` and an `aria-label`; legend items expose
  `aria-pressed`.
- The hover tooltip is mouse-only. Keyboard and screen-reader users still get
  the legend totals, the KPI values, and the detail rows; the per-point tooltip
  is a known limitation.
- Text is routed through the Client locale service (`zh` and `en`).

## Screenshots

There are no committed screenshots. To capture real ones without leaking data:

1. Use a demo conversation.
2. Redact titles, paths, and prices if needed.
3. Capture light and dark versions of the panel, the Usage tab, and a turn
   badge.
4. Put them in `docs/images/` and reference them from both README files.

Do not commit temporary crops, failed captures, or images containing real
conversation content.
