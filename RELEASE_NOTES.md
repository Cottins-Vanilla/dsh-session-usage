# Session usage 1.2.3

Source-review fixes for accounting, cache lifecycle, project scope, async UI,
navigation, list access, and SemVer. This release closes the 11 findings in the
2026-11-08 review and clarifies the empty `peakHours` boundary.

## Accounting and cache

- **F01 — same-call usage revisions now replace.** A call slot keyed by
  `(turn, step)` subtracts its previous contribution from session, day, model,
  and turn buckets before adding the revision. `llm/retry-started` closes the
  slot, so a real retry accumulates while a revised message or attempt does not.
  Covered for increases, decreases, cross-day, and cross-model revisions.
- **F02 — live-to-cold tails are synchronized.** When a cached live record is
  observed after its live session disappears, the Host reads the persisted
  snapshot and folds only events after `lastSeq`, then marks `live=false`.
  Concurrent final syncs share one request; failures leave the record live so
  the next poll retries.
- **F03 — turn badges wait for a snapshot covering their seq.** The shared
  `sharedUsage` request is awaited, `maxSeq >= requestedSeq` is verified, and one
  fresh request is made if the snapshot is too old. A known `turnHint` missing
  from the snapshot no longer falls back to another turn's amount.

## Scope and paths

- **F04 — project filtering happens before `maxSessions`.** The project cwd
  filter is applied to listed headers and live additions before the cap, so
  unrelated projects cannot evict eligible sessions from the target project.
- **F05 — cwd case follows the platform.** Windows is case-insensitive; POSIX
  preserves case. `/work/Foo` and `/work/foo` no longer merge on Linux.
  `lib/path.js` exposes the platform rule for tests.

## Header chip and navigation

- **F06 — stale chip values are marked.** A failed poll keeps the last successful
  value but appends “may be stale” and uses an explicit stale title. First-load
  failures still show the ordinary error label.
- **F07 — older chip responses cannot win.** Each poll gets a monotonic id and a
  dedicated AbortController; only the newest request can apply data or mark
  failure.
- **F08 — turn navigation is session-bound.** Pending navigation carries the
  target session, re-checks it before every retry, cancels timers when the
  session changes, and clears all timers on plugin unload.
- **F09 — aggregate and blank chart clicks do nothing.** Hit testing includes the
  gray “other conversations” series; an aggregate hit ends the operation, and
  clicks more than 24 chart units from a line are ignored.

## List, version, and pricing boundary

- **F10 — every counted conversation is reachable.** The list initially renders
  150 rows, shows “Showing 150 / N”, and expands in 150-row increments with
  **Show more** instead of silently truncating.
- **F11 — SemVer 2.0.0 validation and ordering.** The parser now rejects trailing
  garbage, leading zeroes, empty identifiers, and malformed build metadata.
  Prerelease comparison follows the spec: numeric identifiers compare
  numerically and rank below non-numeric identifiers, non-numeric identifiers
  compare in ASCII order, a shorter identifier set sorts first, and build
  metadata is ignored.
- **R01 — empty `peakHours` disables peak pricing.** An explicit empty array now
  means no peak windows; malformed ranges throw at startup instead of silently
  restoring defaults.

## Verification

```text
40 structural checks passed
17 behavioral tests passed
```

The behavioral suite covers same-call revisions, retry boundaries, live-to-cold
tail sync, project-before-cap filtering, path identity, SemVer ordering, empty
and malformed peak hours, attempt accounting, stream fallback, pricing
validation, concurrent cold loading, and the exact Flash/Pro/peak rates.

## Upgrade

```sh
dsh plugin --profile desktop add https://github.com/Cottins-Vanilla/dsh-session-usage
```

Refresh the page after the bundle reloads. Existing settings are unchanged;
malformed pricing or peak-hour configuration now fails loudly so it can be
corrected.

---

**Full Changelog**: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.2.2...v1.2.3
