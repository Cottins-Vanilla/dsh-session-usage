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

1. **Header** — title, subtitle, loading indicator, refresh button.
2. **Toolbar**
   - **统计范围 / Scope** — three labeled options. The label is a small caption
     above the control, not a button.
   - **显示指标 / Metric** — price, total tokens, input, output, cache reads.
   - **标记颜色 / Badge color** — white (default), six presets, custom picker.
3. **KPI band** — price, tokens, input/output, cache reads with hit rate, and
   conversations/turns/steps.
4. **Chart card**
   - Title and window/series note.
   - **每日 / Daily** and **每轮累计 / By turn** mode toggle.
   - SVG curve; hover shows a guide and a tooltip.
   - Legend in By-turn mode: color, title, project (all scope), total, and a
     visibility toggle.
5. **Detail card**
   - Current scope: per-turn rows.
   - Project/all scope: conversation rows with a value bar; click opens the
     conversation.
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

## Chart behavior

- **Daily** — one line, zero-filled over `chartDays`, ending today.
- **By turn** — one colored line per top conversation, plus a gray aggregate.
- X axis is turn number (`T1`, `T2`, …); Y axis is the selected metric
  (cumulative in By-turn mode).
- Hover snaps to the nearest turn or day. The tooltip lists up to six visible
  series, sorted by value.
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
