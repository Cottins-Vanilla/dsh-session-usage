# Session usage 1.2.4

Follow-up release for the v1.2.3 review. The original 11 findings still pass;
this release closes the five remaining reproduced issues (N01–N05).

## Accounting

- **N01 — missing samples retain, explicit zero samples replace.** A message
  revision with no `data.usage` and no stream usage now updates only the visible
  message count and leaves the prior token/cost contribution intact. A message
  or attempt that explicitly reports zero usage replaces the prior contribution
  with zero. Session, day, model, turn, and message buckets stay consistent.

## Cache lifecycle

- **N02 — stale final sync cannot overwrite a live reactivation.** Each live
  record carries a `liveGeneration`. A final cold sync captures the generation
  before reading persistence; if `markLive()` happens while the read is pending,
  the old snapshot is discarded and the record stays live. A later final sync
  still folds the remaining persisted tail. This fixes the live → final-sync
  pending → live again → cold interleaving.

## Polling

- **N03 — slow requests are no longer cancelled every tick.** The header chip and
  dashboard now schedule the next poll after the previous request settles,
  instead of aborting the in-flight request when a fixed interval fires. A
  request slower than the poll period can now complete. Manual refresh,
  scope/session changes, and unmount still abort the active request, and request
  ids still prevent older responses from winning.

## Chart hit testing

- **N04 — hit testing follows the drawn segments.** The chart now interpolates
  the actual line between rendered points, does not extend a series past its
  last point, and still ignores aggregate hits and clicks farther than 24 chart
  units from a line. This fixes two cases:
  - clicking blank space after a short series no longer opens that conversation;
  - clicking the midpoint of a steep segment now hits the line.

## Paths

- **N05 — POSIX literal backslashes stay literal.** Backslash-to-slash
  normalization is Windows-only. On POSIX, `/work/foo\bar` and `/work/foo/bar`
  are distinct project identities; case sensitivity is unchanged.

## Verification

```text
40 structural checks passed
22 behavioral tests passed
```

New regressions cover missing usage, explicit-zero usage, stale final-sync
reactivation, and POSIX literal backslashes, alongside the existing price,
attempt, project, SemVer, peak-hour, concurrency, and path tests.

## Upgrade

```sh
dsh plugin --profile desktop add https://github.com/Cottins-Vanilla/dsh-session-usage
```

Refresh the page after the bundle reloads. Existing settings are unchanged.

---

**Full Changelog**: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.2.3...v1.2.4
