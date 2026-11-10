# Session usage 1.4.2

- Manual update results now use a floating popup card at the lower-right, with a
  close button and Release link when applicable.
- The card holds for two seconds, then fades over 1.5 seconds; only `opacity`
  and `transform` animate, avoiding frame drops.
- An available update uses a red card with white text; up-to-date remains green
  and failures remain red-accented.

Verification: 40 structural checks, 24 behavioral tests.

**Full Changelog**: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.4.1...v1.4.2
