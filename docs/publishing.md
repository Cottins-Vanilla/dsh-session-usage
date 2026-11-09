# Publishing and releases

## npm name collision

The npm name **`dsh-session-usage` is already occupied** by an unrelated plugin
(`dsh-session-usage@0.1.1` by `ewoowe`). This repository therefore keeps:

- the package name `dsh-session-usage` for local and GitHub bundle installation;
- `"private": true` so `npm publish` cannot accidentally hit the existing name;
- no npm installation instructions.

GitHub repositories are per-owner, so `Cottins-Vanilla/dsh-session-usage` does
not collide with that npm package.

## If you want to publish to npm

Choose a unique unscoped name (for example `dsh-session-usage-dashboard`) or a
scope you own (for example `@your-scope/dsh-session-usage`). Then:

1. Change the package name in `package.json`.
2. Change the row name in `cordis.patch.yml` to the same name.
3. Change the `window.__ModuleLoader__.load({ id: … })` value in `client.js` and
   the plugin object's `name` to the same name. The slot keys
   (`session-usage`, `usage`, `session-usage:header`, `session-usage:turn-cost`)
   can stay as they are, but a rename is a good time to make them unique too.
4. Remove `"private": true` and add:

   ```json
   "publishConfig": { "access": "public" }
   ```

5. Reinstall the bundle in the profile. The old package name leaves a stale
   dependency; remove it first:

   ```sh
   dsh plugin --profile desktop remove dsh-session-usage
   dsh plugin --profile desktop add ./dsh-session-usage
   ```

6. Update `README.md`, `README.zh.md`, `docs/configuration.md`, and badges with
   the new install command.
7. Run `npm test` and `npm pack --dry-run --json`, then `npm publish`.

Do not commit a token, `.npmrc`, or a generated tarball.

## GitHub release

The project has no build step. A source tag is the release.

```sh
git tag -a v1.2.5 -m "Session usage 1.2.5"
git push origin main --tags
```

The tag push runs `.github/workflows/release.yml`, which creates the release
with `RELEASE_NOTES.md` as the body. Keep that file detailed for the current
version; the CHANGELOG remains the full history.

Manual fallback:

1. Open **Releases → Draft a new release**.
2. Choose tag `v1.2.5`.
3. Title: `Session usage 1.2.5`.
4. Use `RELEASE_NOTES.md` or copy the `[1.2.5]` section from `CHANGELOG.md`.
5. Attach no binary; GitHub's source archive is enough.
6. Mark it **Latest**.

After the first release, the comparison link in `CHANGELOG.md` resolves. Keep
`[Unreleased]` at the top.

## Repository metadata

Suggested GitHub description:

> Session usage dashboard for DeepSeek Harness: price, tokens, per-turn curves,
> and per-answer cost badges.

Suggested topics:

```text
deepseek-harness  dsh  dsh-plugin  cordis  token-usage  cost  dashboard  observability
```

Enable:

- Issues (with the provided forms).
- Discussions (optional).
- Private vulnerability reporting (Security tab).
- Dependabot alerts if you later add dependencies.
- Branch protection on `main`: require the `Validate` check and one review if the
  repository gains collaborators.

## Screenshots

The repository intentionally ships no screenshots rather than fake or
placeholder images. To add real ones:

1. Open the plugin in a Web profile.
2. Use a demo conversation, not a real private one. Redact titles, paths, and
   prices if needed.
3. Capture the sidebar panel (light and dark), the Usage tab, and a turn badge.
4. Save as `docs/images/panel-light.png`, `panel-dark.png`, `usage-tab.png`, and
   `turn-badge.png`.
5. Add them to the **Surfaces** or a new **Screenshots** section in both README
   files, with descriptive alt text.
6. Keep each image reasonably small (< 1 MB) and do not commit temporary crops
   or editor files.

## Versioning

- **Patch** — documentation, price-table correction, small UI fixes.
- **Minor** — a new metric, chart mode, setting, or compatible surface.
- **Major** — a breaking config or package-name change, or a Harness API change
  that requires users to reinstall.

Update `CHANGELOG.md` for every user-visible change.
