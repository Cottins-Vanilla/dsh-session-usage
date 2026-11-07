# Publishing to the DeepSeek Harness plugin market

There is no single "publish" button inside Harness. A plugin becomes visible in
the in-app market through three separate layers:

| Layer | What it gives you | Status for this repo |
| --- | --- | --- |
| **Direct install** | Anyone with the GitHub URL can install it now | ✅ Ready |
| **Curated catalog** | Listing in the in-app market / Discover | ⏳ Needs a registry PR |
| **npm** | Download counts and npm-based updates | Optional; skipped (name taken) |

The in-app market (`dshmarket`) and the host's Discover index both read the
[curated `awesome-dsh-plugin` registry](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin).
The market app is a separate project; plugin entries are submitted to the
registry.

## Direct install (already available)

```sh
dsh plugin --profile desktop add https://github.com/Cottins-Vanilla/dsh-session-usage
```

Or in **Plugins → Add plugin**, paste the repository URL. This works today and
does not require a catalog entry.

## Before submitting to the catalog

The registry's CI checks these:

- **`dsh.bundle` exists** in `package.json` — this repo declares it.
- **The repository is at least one day old.** Created
  `2026-11-07T09:52:12Z`; the earliest safe submission is
  **2026-11-08T09:52:12Z** (Beijing `2026-11-08 17:52`).
- **The `dsh-plugin` topic is set** on GitHub. Add it at:
  <https://github.com/Cottins-Vanilla/dsh-session-usage>
  → **About** → gear icon → **Topics** → `dsh-plugin`.
- **The code is real and working** — this repo has the Host/Client halves,
  checks, CI, and a release.
- **The description is accurate** — no superlatives or invented features.
- **One PR, one entry, at most three entries.**

The storefront icon is optional. This repo provides a 180×180 PNG at
`assets/icon-180.png`; the registry only accepts GitHub-hosted raster images, not
SVG. Without it, storefronts fall back to the owner's avatar.

## The submission

Fork <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>, then add exactly
one file:

```text
data/plugins/Cottins-Vanilla__dsh-session-usage.yml
```

with:

```yaml
url: https://github.com/Cottins-Vanilla/dsh-session-usage
name: Cottins-Vanilla/dsh-session-usage
category: usage
description:
  en: 'Session usage dashboard for DeepSeek Harness: price, tokens, per-turn curves, and per-answer cost badges.'
  zh: 'DeepSeek Harness 会话用量面板：价格、token、每轮累计曲线，以及每个回答末尾的价格标记。'
icon: https://raw.githubusercontent.com/Cottins-Vanilla/dsh-session-usage/main/assets/icon-180.png
```

- The `description.en` value contains `: `, so it must be quoted.
- `category: usage` is an existing category and describes the plugin.
- Do not edit the generated README files; the registry regenerates them after
  merge.
- Do not add an `npm:` field; npm mapping is detected from the published
  package's `repository` field (this repo does not publish to npm).

Commit, push the branch, and open a pull request against `main`. A suggested PR
body:

```markdown
- [x] I added **one file** at `data/plugins/Cottins-Vanilla__dsh-session-usage.yml`.
- [x] My repo's `package.json` declares **`dsh.bundle`**
      (`dsh.bundle.patch: ./cordis.patch.yml`) and `dsh.client` for the Web UI.
- [x] My repo is at least **1 day old** — created 2026-11-07T09:52:12Z.
- [x] `category: usage` — a session price/token dashboard.
- [x] Description states what the plugin does, no superlatives.
- [x] My repo has the `dsh-plugin` topic.

Session Usage adds a sidebar dashboard, a 用量 tab, a header chip, and a
per-answer badge for price and token usage. It reads committed Session logs,
estimates price from a configurable DeepSeek price table, and makes no
third-party network calls.
```

CI checks the manifest, repository age, formatting, and that the READMEs
regenerate. A maintainer then reads the code and the description before merging.
If changes are requested, push to the same branch; do not open a new PR.

## What happens after merge

The registry's site and catalog rebuild automatically, usually within a day:

- **dshmarket**: the plugin appears in the Plugins market / Discover search.
- **Host Discover**: add the catalog index source
  `https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json` under
  **Plugins → Discover → Index sources**, then search for “Session usage”.
- **Direct install** continues to work regardless.

## Optional polish

### Screenshots

Add `screenshots.json` beside `package.json` with 1–8 GitHub-hosted raster image
paths, for example:

```json
["docs/images/panel-light.png", "docs/images/panel-dark.png"]
```

The market shows them as an App Store-style carousel. Without this file it tries
to extract images from the README. The images must live in this repository; do
not hotlink a third-party host.

### npm

The unscoped npm name `dsh-session-usage` belongs to another project. Publishing
is **not required** for catalog listing or installation. If you later want npm
download counts:

1. Rename the package, `cordis.patch.yml` row, and the Client loader id together.
2. Set `"private": false` and `"publishConfig": { "access": "public" }`.
3. Publish with `repository` pointing at this GitHub repository.
4. Reinstall the local bundle and update both READMEs.

The full checklist is in [publishing.md](publishing.md).

### Release tarball

This bundle has no build step, so a source install is enough. A prebuilt tarball
is only worth adding if you later introduce a build step; attach it to a GitHub
Release and point at it with `tarball:` in the registry entry.
