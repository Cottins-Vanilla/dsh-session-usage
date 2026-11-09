# Session usage 1.2.5

Follow-up fixes for the v1.2.4 review.

- **R01 — root-directory project filtering.** `normalizeCwd('/')` keeps `/`
  (Windows drive roots use `c:/`), and project filtering uses `null` for “no
  filter”. Root sessions are filtered before `maxSessions` and no longer share
  the unknown-cwd key.
- **R02 — cold-log revalidation.** Cold records revalidate after five minutes,
  and the panel's manual refresh forces a persisted re-read. External
  Host/CLI updates are picked up without losing the shared fold guarantees.
- **R03 — centre-only chart navigation.** Only the exact rendered data-point
  centre (distance < 1 SVG unit) triggers navigation. Other dot positions, line
  segments, aggregate points, and blank space do not.

Verification: 40 structural checks, 24 behavioral tests.

**Full Changelog**: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.2.4...v1.2.5
