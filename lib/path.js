/**
 * Project path identity normalization.
 *
 * Windows paths are case-insensitive; POSIX paths are not. Lowercasing every
 * platform merges `/work/Foo` and `/work/foo` on Linux, so the platform is a
 * required part of the identity decision. `platform` is injectable for tests.
 */
export function normalizeCwd(value, platform = process.platform) {
  const original = String(value || '')
  let text = original
  // POSIX allows a literal backslash in a filename; only Windows treats it as
  // a separator.
  if (platform === 'win32') {
    text = text.replace(/\\/g, '/')
    text = text.replace(/\/+$/, '')
    if (/^[a-z]:$/i.test(text)) text += '/'
    else if (text === '' && original.trim() !== '') text = '/'
    return text.toLowerCase()
  }
  const stripped = text.replace(/\/+$/, '')
  // Preserve a POSIX root as '/', not as the empty "unknown cwd" key.
  return stripped === '' && original !== '' ? '/' : stripped
}
