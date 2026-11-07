/**
 * Project path identity normalization.
 *
 * Windows paths are case-insensitive; POSIX paths are not. Lowercasing every
 * platform merges `/work/Foo` and `/work/foo` on Linux, so the platform is a
 * required part of the identity decision. `platform` is injectable for tests.
 */
export function normalizeCwd(value, platform = process.platform) {
  const text = String(value || '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
  return platform === 'win32' ? text.toLowerCase() : text
}
