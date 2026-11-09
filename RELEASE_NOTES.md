# Session usage 1.3.0

Display/range release. Host accounting is unchanged.

- **Turn display range** for **All conversations** and **Current project** in
  By-turn mode. A dedicated row below the mode switch sets **不限** or positive N;
  the shared horizontal viewport scrolls through the full original turn axis.
  Current conversation and Daily mode never apply the range.
- Cumulative values still start at the real first turn; scrolling or limiting
  never rebases totals. Invalid input leaves the effective range unchanged.
- Restored the floating detail card near the pointer, clamped by its actual size
  and the visible chart area; it no longer sits below the chart or shifts layout.
- Hover-only hollow point markers across scopes; clicking a rendered marker
  opens the original session and turn. Lines, blank space, and aggregate points
  do not navigate.

Verification: 40 structural checks, 24 behavioral tests.

**Full Changelog**: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.2.6...v1.3.0
