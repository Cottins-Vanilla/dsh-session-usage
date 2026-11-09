# Session usage 1.4.0

- **Automatic update check on each Harness login**, shared across panel mounts.
  A newer release shows a red dot at the upper-left of **检查更新**; a manual
  check still forces a refresh.
- **Manual update feedback:** newer release, up to date, or failure is always
  shown; a click during an automatic check queues a manual check.
- **Visible-range Y-axis scaling:** with a limited turn range, the Y axis follows
  the scrolled window (including segment-edge interpolation) instead of being
  flattened by off-screen highs.
- **Range viewport fix:** N now controls the actual visible span; N=1 and N=20
  differ, and N larger than the data fits all turns.

Verification: 40 structural checks, 24 behavioral tests.

**Full Changelog**: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.3.1...v1.4.0
