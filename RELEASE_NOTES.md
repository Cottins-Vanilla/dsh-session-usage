# Session usage 1.2.6

Chart-only follow-up for the v1.2.5 review.

- **C01** — default cursor everywhere except an exact clickable data-point
  centre; click and cursor share the same hit test. Title corrected.
- **C02** — every real data point keeps a marker; no more invisible clickable
  points after 24 samples.
- **C03** — details moved into a reserved panel below the chart; hover is
  limited to the plot area, so lines are not covered.
- **C04** — the detail panel lists every visible series instead of dropping
  rows after six.
- **C05** — a one-day daily chart renders a permanent marker.
- **C06** — navigation requires the exact centre (0.01 SVG-unit epsilon), not a
  sub-unit disc.
- **S01** — current-conversation turn points are hollow (background fill,
  series stroke); project/all points stay solid.

Verification: 40 structural checks, 24 behavioral tests.

**Full Changelog**: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.2.5...v1.2.6
