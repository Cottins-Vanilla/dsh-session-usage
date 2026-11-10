# Session usage 1.4.1

- **Update feedback reliably disappears after 3.5 seconds.** The deadline is
  shared across panel mounts and backed by a CSS expiry, so re-renders or
  remounts cannot keep an expired message visible.
- A new manual check hides the old result while the request is in flight; the new
  result gets its full display time.
- Update messages render independently of usage-data loading/error, so a
  discovered release is not lost while the dashboard is still loading.

Verification: 40 structural checks, 24 behavioral tests.

**Full Changelog**: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.4.0...v1.4.1
