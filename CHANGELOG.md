# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.2.2] - 2026-11-08

### Fixed

- **Concurrent cold loads no longer double count.** Two simultaneous
  **All conversations** requests now share one per-session load/fold promise;
  `foldCold()` also refuses an already loaded record. Previously both callers
  folded the same snapshot and the inflated total persisted in the cache.
- **Failed and retried attempts are now billable.** `assistant/attempt` has no
  `assistant/message`; its token accounting is the last `usage` chunk in
  `data.stream`. Those tokens and their price are counted without incrementing
  the visible-message count. The model comes from `request/header` /
  `request/context` or the previous message.
- **`assistant/message` falls back to stream usage** when `data.usage` is absent.
- **Malformed pricing overrides now fail loudly.** A bad or partial
  `pricing.models[...]` / `pricing.fallback` row throws at startup with the
  offending key instead of silently dropping the row and pricing it with the
  Flash fallback.

### Added

- `tests/usage.test.mjs`: behavioral `node:test` coverage for exact Flash/Pro
  prices, peak rates, failed-attempt accounting, stream fallback, invalid
  pricing configuration, message/stream de-duplication, and the concurrent
  cold-load regression.
- `npm test` now runs the structural checks **and** the behavioral suite;
  `npm run check` keeps the structural-only mode.

### Changed

- Documentation now distinguishes structural checks from accounting regressions
  and explains the attempt/stream rules and strict pricing validation.

## [1.2.1] - 2026-11-08

### Fixed

- Clicking a turn detail row or a per-turn chart point in the Usage View now
  lands on that turn instead of merely switching back to Chat at the last turn.
  `openView('chat', turn)` only selected the Chat View because Chat does not
  consume the focus payload; the client now activates the native turn-rail mark
  after the switch and falls back to scrolling the transcript.
- Opening the Usage View's **Open conversation** action without a turn still
  switches to Chat without leaving a stale pending turn navigation behind.

## [1.2.0] - 2026-11-07

### Added

- **检查更新 / Check for updates** button in the panel header. The Host reads the
  installed version, fetches the latest GitHub release, compares the versions,
  and returns the result. A newer release shows a banner with the current/latest
  versions and a **View release** link.
- The update result is cached for six hours; explicit clicks bypass the cache.
  Failures are non-blocking and shown as a small header note.
- English and Chinese strings for the update check and banner.

### Changed

- Privacy wording is now explicit: the plugin makes no third-party request by
  default; only the user-initiated update check contacts `api.github.com`, and it
  sends no session data.
- Documented the update route, its bounded response, the manual-only check, and
  the offline/rate-limit failure mode.

## [1.1.1] - 2026-11-07

### Fixed

- Turn detail rows and per-turn chart points now navigate when the Usage View
  tab is active. The session is already selected there, so `openSession` was a
  no-op; the Usage view now selects the Chat View explicitly and passes the
  clicked turn as the focus.
- Chart points are clickable in the per-turn value and per-turn cumulative
  modes; the aggregate “other conversations” series is not clickable.
- Conversation rows still open their session, and the sidebar dashboard keeps
  its `openSession` fallback outside a Conversation View.

### Changed

- Added a click hint to the chart and documented the click-through behavior in
  both READMEs and the UI map.

## [1.1.0] - 2026-11-07

### Added

- **每轮值 / Per-turn value** chart for the current conversation: every point is
  a single turn's value, without accumulation.
- The current-conversation mode toggle now offers per-turn value, per-turn
  cumulative, and daily, in that order; per-turn value is the default.

### Changed

- The current conversation opens on the new per-turn value view; switching to
  project/all still opens the daily view.
- READMEs, the UI map, configuration notes, and pricing notes describe the new
  mode and its scope restriction.

## [1.0.1] - 2026-11-07

### Changed

- The conversation-page turn badge now shows **this turn's price first**, then
  the current conversation's total through that turn. The turn value uses the
  primary text color and the conversation total follows in the secondary color.
- README, the Chinese README, and the UI map now document the new order.

## [1.0.0] - 2026-11-07

### Added

- Sidebar **Session usage** panel and conversation **Usage** View tab.
- Current conversation, current project, and all conversations scopes, with the
  concrete conversation title, project folder, or conversation count in each
  option.
- Five selectable metrics: price, total tokens, input tokens, output tokens, and
  cache-read tokens.
- Daily and per-turn cumulative chart modes.
- Multi-conversation per-turn curves: the eight most expensive conversations
  keep distinct colors, the rest fold into an aggregate series; the legend names
  each conversation, shows its project and total, and toggles visibility.
- Session header chip with the current conversation's estimated price and total
  tokens.
- Per-answer turn badges showing the conversation total through that turn and
  that turn's price.
- White default badge color, with white, amber, red, blue, green, purple, teal,
  and custom color options persisted in local storage.
- DeepSeek price estimation with peak/off-peak windows, weekend and 2026 holiday
  rules, and a configurable per-model price table.
- English and Simplified Chinese dictionaries.
- Read-only Host query route with bounded session scanning and per-session
  isolation.
- Repository checks (`npm test`), GitHub Actions CI, issue templates, security
  policy, contribution guide, and documentation.

### Changed

- Scope control is now rendered as a labeled group instead of loose pills.
- The current conversation and project options show their exact target.
- The first **All conversations** query caches folded cold sessions; subsequent
  queries only fold new live events.

### Fixed

- Prevented undefined token totals in the all-conversations response.
- Prevented chart tooltips from reading a stale hover index after a scope or
  data change.
- Avoided duplicate per-turn labels at the same turn number.
- Ensured a conversation switch clears the previous conversation's title and
  working directory.

[Unreleased]: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.2
[1.2.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.1
[1.2.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.0
[1.1.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.1.1
[1.1.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.1.0
[1.0.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.0.1
[1.0.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.0.0
