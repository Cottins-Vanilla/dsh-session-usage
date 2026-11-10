# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.4.1] - 2026-11-10

### Fixed

- **Update feedback now reliably disappears after 3.5 seconds.** The deadline
  lives in shared state instead of component-local dismissal, with a CSS expiry
  fallback, so re-renders or panel remounts cannot keep an expired message alive.
- A new manual check hides the previous result while it is in flight; the new
  result gets its own full 3.5 seconds.
- Update feedback is rendered independently of usage-data loading/error, so a
  discovered release is not lost before the dashboard data arrives.

## [1.4.0] - 2026-11-09

### Added

- **Automatic update check on each Harness login.** The result is shared across
  panel mounts, so reopening the panel does not repeat it. A newer release shows
  a red dot at the upper-left of **检查更新**; manual checks still force a refresh.
- **Visible-range Y-axis scaling.** With a limited turn range, the Y axis follows
  the currently scrolled window, including interpolated segment edges, instead of
  being flattened by off-screen highs.

### Fixed

- The turn-range viewport now uses the actual available width and N, so N=1 and
  N=20 produce different visible spans; N larger than the data falls back to
  fitting all turns.
- Manual **检查更新** now always reports a result: newer release, up to date, or
  a failure banner. A click during an automatic check queues a manual check.

## [1.3.1] - 2026-11-09

### Fixed

- **Current conversation now uses the display range too.** The range control is
  available for Current conversation's **每轮值** and **每轮累计**, and for
  Current project / All conversations' **每轮累计**. Daily mode still hides it
  and applies no limit.
- The range row is right-aligned instead of left-aligned.

## [1.3.0] - 2026-11-09

Display/range release. Host accounting is unchanged.

### Added

- **Turn display range** for **All conversations** and **Current project** in
  By-turn mode. The default is **不限 / All**; a positive N limits the shared
  horizontal viewport to about N turns, with native scrolling through the full
  original turn axis. The control is a dedicated row below the mode switch.
  Current conversation and Daily mode never apply the range.
- The range reuses the existing validation/state: invalid input leaves the
  effective range unchanged, cumulative values still start at the real first
  turn, and switching modes/scopes does not leak a hidden limit.

### Changed

- Restored the floating detail card near the pointer (right/below first,
  switching sides as needed), with actual card-size clamping and no chart-height
  shift. Replaces the fixed below-chart panel.
- Hover-only hollow point markers for all scopes; clicking a rendered marker
  opens the original session/turn. No default solid markers; line/blank/aggregate
  targets do not navigate.

## [1.2.6] - 2026-11-09

Chart-only follow-up for the v1.2.5 review.

### Fixed

- **C01 — whole-chart hand cursor and misleading title.** The SVG uses the
  default cursor except when the pointer is exactly on a clickable data-point
  centre; the cursor and click share one hit test. The title now says “click a
  data-point centre”.
- **C02 — points disappeared after 24 samples.** Every real data point keeps a
  rendered marker, so long series no longer have invisible-but-clickable points.
- **C03 — tooltip covered the plot and could overflow.** Details moved into a
  reserved panel below the chart; hover is limited to the plot area, and the
  panel width follows the container.
- **C04 — only six detail rows were shown.** The detail panel lists every
  visible series instead of silently dropping rows after six.
- **C05 — a one-day daily chart had no marker.** A single-day series renders a
  permanent hollow marker, independent of hover.
- **C06 — sub-unit offsets were accepted.** Navigation requires the centre
  within a tiny SVG-coordinate epsilon (0.01), not a 0.5–1 unit disc.

### Added

- **S01 — hollow current-conversation markers.** Current-conversation turn
  points are hollow (background fill, series stroke); project/all points remain
  solid.

### Changed

- Version 1.2.6; release notes include the v1.2.5...v1.2.6 Full Changelog link.
- Client chart changes remain outside the repository's Host-focused behavioral
  suite; 24 existing tests still pass.

## [1.2.5] - 2026-11-09

Follow-up fixes for the v1.2.4 review. N01/N02/N03/N05 from the previous round
remain fixed; this release closes R01–R03.

### Fixed

- **R01 — POSIX root project was treated as "no filter".** `normalizeCwd('/')`
  now returns `/` instead of an empty key, so the project filter stays active.
  Windows drive roots normalize to `c:/`. `readAll` uses `null` (not `''`) for
  "no cwd filter"; root directory sessions are filtered before `maxSessions` and
  no longer share the unknown-cwd identity.
- **R02 — external cold-log updates were cached forever.** Cold records now
  revalidate after five minutes, and the panel's manual refresh sends
  `refresh: true` to force a persisted re-read. A changed cold source is folded
  through the same shared refresh path; unchanged caches are reused.
- **R03 — non-centre chart clicks still navigated.** Chart click targets are now
  the exact rendered data-point centres (distance < 1 SVG unit). Other positions
  inside a dot, line segments, aggregate points, and blank space do not trigger.

### Added

- Host regressions for a root-directory project being filtered before
  `maxSessions`, and for forced revalidation of an externally updated cold log.
- 24 behavioral tests total.

### Changed

- Documentation for root path identity, cold revalidation/manual refresh, and
  centre-only chart hit testing.
- Version 1.2.5; release notes include the v1.2.4...v1.2.5 Full Changelog link.

## [1.2.4] - 2026-11-08

Follow-up fixes for the v1.2.3 review. The 11 original findings still pass; this
release closes the 5 remaining reproduced issues (N01–N05) and adds 5 behavioral
regressions (22 total).

### Fixed

- **N01 — missing vs explicit-zero usage.** A message/attempt revision with no
  usage sample now retains the prior token/cost contribution; only the visible
  message count is updated. An explicit zero sample (including a zero attempt)
  replaces the prior contribution with zero. Session, day, model, turn, and
  message counts are handled separately so a revision cannot erase an existing
  charge or keep a charge that was explicitly zeroed.
- **N02 — stale final-sync overwrote a live reactivation.** Each live record has
  a `liveGeneration`. A final cold sync captures the generation before reading
  persistence and refuses to fold or mark the record cold if a newer
  `markLive()` happened while the read was pending. The reactivated live tail is
  preserved; a later final sync still adds the remaining persisted tail.
- **N03 — polling cancelled every slow request.** The header chip and dashboard
  now schedule the next poll only after the previous request settles, instead of
  cancelling the in-flight request on a fixed tick. Manual refresh, scope/session
  changes, and unmount still abort the active request. Request-id guards remain.
- **N04 — chart hit testing used discrete values.** Hit testing now interpolates
  the actual drawn line segments, does not extend a series past its last point,
  and still rejects aggregate hits and clicks more than 24 chart units from a
  line. Short-series blank space and steep segment midpoints now behave
  correctly.
- **N05 — POSIX literal backslash was treated as a separator.** Backslash-to-slash
  normalization is now Windows-only; POSIX keeps literal backslashes while
  retaining case sensitivity. Windows case/separator normalization is unchanged.

### Added

- Behavioral tests for missing usage, explicit-zero usage, stale final-sync
  reactivation, and POSIX literal backslashes; 22 tests total.
- Documentation for the new polling schedule, segment-based chart hit testing,
  missing/zero sample semantics, lifecycle generation guard, and platform path
  rules.

### Changed

- Bump to 1.2.4. Release notes include the v1.2.3...v1.2.4 Full Changelog link.

## [1.2.3] - 2026-11-08

This release resolves the 11 findings in the 2026-11-08 source review plus the
empty `peakHours` boundary. It adds 8 behavioral regressions (17 total).

### Fixed

- **F01 — revised call usage was added twice.** Usage is now tracked in one slot
  per `(turn, step)`. A later `assistant/message`/`assistant/attempt` sample
  replaces the previous contribution across session, day, model, and turn
  buckets; `llm/retry-started` closes the slot so a real retry accumulates.
  Increases, decreases, cross-day, and cross-model revisions are covered.
- **F02 — live-to-cold transitions missed the persisted tail.** When a cached
  live record is seen after its live session disappears, the Host reads the
  snapshot once and folds only the missing tail, then marks `live=false`.
  Concurrent final syncs share one promise; read failures leave the record live
  for retry.
- **F03 — a new turn reused a stale in-flight badge request.** `getTurnData()`
  verifies `maxSeq` after the shared request and makes one fresh request when
  the snapshot predates the requested turn. `TurnCost` no longer falls back to a
  neighbouring turn when a known `turnHint` is absent.
- **F04 — project scope was truncated by the global scan cap.** The project cwd
  filter is applied before `maxSessions`; unrelated projects can no longer evict
  the target project's eligible sessions.
- **F05 — POSIX paths were lowercased.** Cwd identity keeps case on non-Windows
  platforms and stays case-insensitive on Windows. `lib/path.js` makes the
  platform rule testable.
- **F06 — a failed chip poll still looked healthy.** The chip now appends a
  “may be stale” marker and uses an explicit stale title after a failure while
  retaining the last successful value.
- **F07 — an older chip response could overwrite a newer one.** Each poll gets a
  monotonic request id and its own AbortController; only the newest request may
  apply data or mark failure.
- **F08 — pending turn navigation could target another session.** Navigation
  carries the target session, re-checks it before every retry, cancels timers on
  session change, and cancels all pending navigation on plugin unload.
- **F09 — aggregate/blank chart clicks opened a colored conversation.** Hit
  testing includes the aggregate series; an aggregate hit does nothing, and
  clicks more than 24 chart units from any line are ignored.
- **F10 — the conversation list silently showed only 150 rows.** The list now
  displays “Showing 150 / N” and a **Show more** button in 150-row increments,
  so every counted conversation is reachable.
- **F11 — SemVer parsing and prerelease ordering were incomplete.** The version
  parser now validates the complete SemVer 2.0.0 grammar (rejecting trailing
  garbage, leading zeroes, empty identifiers, and bad metadata) and compares
  prerelease identifiers by the spec: numeric before non-numeric, numeric
  numerically, ASCII otherwise, shorter set first, build ignored.
- **R01 — empty `peakHours` silently restored defaults.** An explicit empty
  array now means no peak windows; malformed ranges throw at startup.

### Added

- `tests/usage.test.mjs` now has 17 behavioral tests covering same-call
  revisions, retry slots, live-to-cold tail sync, project-before-cap filtering,
  path identity, SemVer ordering, empty/malformed peak hours, and the prior
  concurrency/pricing regressions.
- `lib/path.js` for platform-aware cwd identity.

### Changed

- Documentation now records the slot/retry rules, live-to-cold refresh, per-scope
  `maxSessions` behavior, platform path identity, stale chip state, chart hit
  rules, list expansion, SemVer requirements, and empty `peakHours` semantics.
- `RELEASE_NOTES.md` and the release workflow now publish these detailed notes,
  not only generated compare links.

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

[Unreleased]: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.4.1...HEAD
[1.4.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.4.1
[1.4.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.4.0
[1.3.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.3.1
[1.3.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.3.0
[1.2.6]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.6
[1.2.5]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.5
[1.2.4]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.4
[1.2.3]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.3
[1.2.2]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.2
[1.2.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.1
[1.2.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.2.0
[1.1.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.1.1
[1.1.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.1.0
[1.0.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.0.1
[1.0.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.0.0
