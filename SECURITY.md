# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.1.x | ✅ |
| 1.0.x | ⚠️ upgrade recommended |
| < 1.0 | ❌ |

The plugin is tested against DeepSeek Harness **0.2.2-rc.1** on the Web
platform. A newer Harness release may change the Services or Slots this plugin
uses; check the release notes before upgrading.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the plugin version, Harness version, operating system, a minimal
   reproduction, and the impact you observed.

If private reporting is unavailable, contact the maintainer
**[@Cottins-Vanilla](https://github.com/Cottins-Vanilla)** through GitHub and ask
for a private channel. Do not include exploit details in a public message.

You can expect an acknowledgement on a best-effort basis. This is a
single-maintainer community project, not a commercial support contract. Please
allow reasonable time for a fix before public disclosure.

## What the plugin can access

Understanding the data flow makes reports easier to assess:

- **Session data.** The Host half calls `sessionQuery.listSessions()` and
  `sessionQuery.readSession()`. It folds token counts, model ids, timestamps,
  turn numbers, working directories, and a short fallback title derived from the
  first user message. Prompts, tool output, attachments, and credentials are not
  returned to the Client.
- **No external network.** The Client calls one same-origin, authenticated route:
  `POST /api/session-usage/query`. The plugin does not contact the author or any
  third party.
- **No writes.** The plugin does not append session events, edit the profile, or
  write files. The Client stores only its own preferences (selected metric, badge
  color, chart mode) in `localStorage`.
- **Local exposure.** The query response includes conversation titles and
  working-directory paths. It is served to the authenticated same-origin Web
  client through the Harness Connection service. If you expose the Harness Web UI
  beyond loopback, review your Harness remote-access and authentication settings;
  this plugin adds no separate authorization layer.

## Known non-security limitations

- Prices are estimates and can differ from an invoice. A wrong estimate is a
  correctness issue, not a security vulnerability.
- The 2026 holiday table is static and must be updated for later years.
- The plugin reads every cold session once on the first **All conversations**
  query, capped by `maxSessions`.

## Safe harbor

Good-faith research that follows this policy, avoids privacy violations, and
does not degrade other users' systems will not be pursued legally by the
maintainer. Do not access data that is not yours, and do not run denial-of-service
tests against a shared Harness instance.
