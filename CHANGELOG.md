# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.0.1] - 2026-11-07

### Changed

- The conversation-page turn badge now shows **this turn's price first**, then
  the current conversation's total through that turn. The turn value uses the
  primary text color and the conversation total follows in the secondary color.
- README, the Chinese README, and the UI map now document the new order.

## [1.0.0] - 2026-11-07

### Added

- Sidebar **Session usage** panel and conversation **Usage** View tab.
- Current conversation, current project, and all conversations scopes, with the
  concrete conversation title, project folder, or conversation count in each
  option.
- Five selectable metrics: price, total tokens, input tokens, output tokens, and
  cache-read tokens.
- Daily and per-turn cumulative chart modes.
- Multi-conversation per-turn curves: the eight most expensive conversations
  keep distinct colors, the rest fold into an aggregate series; the legend names
  each conversation, shows its project and total, and toggles visibility.
- Session header chip with the current conversation's estimated price and total
  tokens.
- Per-answer turn badges showing the conversation total through that turn and
  that turn's price.
- White default badge color, with white, amber, red, blue, green, purple, teal,
  and custom color options persisted in local storage.
- DeepSeek price estimation with peak/off-peak windows, weekend and 2026 holiday
  rules, and a configurable per-model price table.
- English and Simplified Chinese dictionaries.
- Read-only Host query route with bounded session scanning and per-session
  isolation.
- Repository checks (`npm test`), GitHub Actions CI, issue templates, security
  policy, contribution guide, and documentation.

### Changed

- Scope control is now rendered as a labeled group instead of loose pills.
- The current conversation and project options show their exact target.
- The first **All conversations** query caches folded cold sessions; subsequent
  queries only fold new live events.

### Fixed

- Prevented undefined token totals in the all-conversations response.
- Prevented chart tooltips from reading a stale hover index after a scope or
  data change.
- Avoided duplicate per-turn labels at the same turn number.
- Ensured a conversation switch clears the previous conversation's title and
  working directory.

[Unreleased]: https://github.com/Cottins-Vanilla/dsh-session-usage/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.0.1
[1.0.0]: https://github.com/Cottins-Vanilla/dsh-session-usage/releases/tag/v1.0.0
