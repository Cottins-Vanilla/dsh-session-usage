# Contributing

Thanks for taking the time to improve Session Usage.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
Security reports belong in the private process described in [SECURITY.md](SECURITY.md),
not in a public issue.

## Ways to contribute

- Report a reproducible bug with the bug report form.
- Propose a focused feature with the feature request form.
- Improve documentation, translations, or the price table.
- Send a pull request with a small, reviewable change.

## Development setup

Requirements:

- Node.js **22.19+**.
- A DeepSeek Harness **0.2.2-rc.1** Web profile for manual verification.

There is no build step. The bundle is plain ESM and plain JavaScript:

```sh
git clone https://github.com/Cottins-Vanilla/dsh-session-usage.git
cd dsh-session-usage
npm test
```

`npm test` runs `scripts/check.mjs`, which validates:

- `package.json` metadata, exports, bundle and client declarations;
- required files and locale metadata;
- the Client loader id matches the package name;
- the icon is a small SVG;
- all JavaScript files parse;
- no temporary or local-only files are present.

### Previewing locally

Install the checkout as a bundle in a throwaway profile, or into your own
profile when you are ready:

```sh
dsh plugin --profile desktop add ./dsh-session-usage
```

Client-side changes are visible after the bundle reloads and the page is
refreshed. Host-side changes need the plugin to be toggled or the app restarted.
When you are done, remove the bundle or keep it — the repository itself contains
no profile state.

## What to change where

| Area | Files |
| --- | --- |
| Session folding, aggregation, cache | `lib/stats.js`, `index.js` |
| Price table, peak windows, cost formula | `lib/pricing.js` |
| Sidebar panel, Usage tab, charts, badges, colors | `client.js` |
| Display title and description | `locale/en.json`, `locale/zh.json` |
| Installation, architecture, pricing docs | `README.md`, `README.zh.md`, `docs/` |
| Repository checks and CI | `scripts/check.mjs`, `.github/workflows/ci.yml` |

## Guidelines

- **The session log is the source of truth.** Do not persist derived usage in a
  second store; the Host cache is disposable.
- **Stay read-only.** Do not append session events, rewrite profile files, or
  change user configuration.
- **No third-party network calls.** The only request should remain the
  same-origin Client-to-Host query.
- **Do not import Harness Client packages** such as
  `@deepseek-ai/dsh-client-ui-primitives` from `client.js`. Match the host look
  with CSS and the `--dsw-alias-*` theme tokens instead.
- **Route visible text through the locale service.** Add keys to both `zh` and
  `en` dictionaries in `client.js`; add display metadata to both locale JSON
  files when it changes.
- **Keep user data out of the repository.** No session logs, screenshots with
  real conversations, tokens, `.env` files, temporary test folders, or local
  paths. `.gitignore` and `npm test` enforce the common cases.
- **Bound the work.** New scans or timers need a cap and cleanup. Prefer the
  existing in-memory cache and shared request helpers.
- **Keep dependencies at zero.** The bundle is installed as a linked directory
  and has no build or runtime dependencies; adding one should be discussed
  first.
- **Preserve compatibility.** The plugin targets DSH 0.2.2-rc.1's Web slots and
  services. Check `cordis_inspect_query` before relying on a new service or
  event.

## Testing checklist

Before opening a pull request:

- [ ] `npm test` passes.
- [ ] The plugin loads and the Host row is active.
- [ ] The sidebar panel, Usage tab, header chip, and turn badge all render.
- [ ] Current conversation, current project, and all conversations return data.
- [ ] Daily and per-turn chart modes render, including an empty scope.
- [ ] Legend toggles and the tooltip work with more than one series.
- [ ] The badge color picker changes the badge and survives a refresh.
- [ ] Light and dark themes remain readable.
- [ ] No console errors from a slot entry.
- [ ] No temporary files or personal data are present.

If a check is not available in your environment, say so in the pull request
instead of claiming it passed.

## Commit and pull request style

- Use Conventional Commits when practical: `feat:`, `fix:`, `docs:`, `chore:`,
  `refactor:`, `test:`.
- Keep a pull request to one topic and describe the user-visible change.
- Include reproduction steps for a bug fix.
- Update `CHANGELOG.md` under `[Unreleased]` for user-visible changes.
- Update both README languages when behavior or installation changes.

The pull request template contains the exact checklist.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
