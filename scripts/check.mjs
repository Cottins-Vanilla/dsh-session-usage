#!/usr/bin/env node
/**
 * Repository and bundle sanity checks.
 *
 * Run with `npm test` (or `node scripts/check.mjs`). The checks are deliberately
 * dependency-free so a fresh clone and GitHub Actions can run them as-is.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = []
const checks = []

function check(name, condition, detail = '') {
  checks.push(name)
  if (!condition) failures.push(detail || name)
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function exists(file) {
  return fs.existsSync(path.join(root, file))
}

function parseJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    failures.push(`${file}: ${error.message}`)
    return null
  }
}

function walk(dir, visitor) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(absolute, visitor)
    else visitor(absolute)
  }
}

const pkg = parseJson('package.json')
if (pkg) {
  check('package name', typeof pkg.name === 'string' && pkg.name.length > 0)
  check('package version', /^\d+\.\d+\.\d+(?:[-+].+)?$/.test(String(pkg.version)))
  check('package description', typeof pkg.description === 'string' && pkg.description.length >= 20)
  check('package license', pkg.license === 'MIT')
  check('package type', pkg.type === 'module')
  check('package engines.node', typeof pkg.engines?.node === 'string')
  check('package repository', typeof pkg.repository?.url === 'string')
  check('package homepage', typeof pkg.homepage === 'string')
  check('package bugs', typeof pkg.bugs?.url === 'string')
  check('package icon', exists('icon.svg'))
  check('package exports .', pkg.exports?.['.'] === './index.js')
  check('package exports ./client', pkg.exports?.['./client'] === './client.js')
  check('package exports ./icon', pkg.exports?.['./icon'] === './icon.svg')
  check('package exports locales', pkg.exports?.['./locale/*.json'] === './locale/*.json')
  check('bundle patch declared', pkg.dsh?.bundle?.patch === './cordis.patch.yml')
  check('web client declared', pkg.dsh?.client?.platform === 'web')

  const requiredFiles = [
    'index.js',
    'client.js',
    'lib/pricing.js',
    'lib/stats.js',
    'cordis.patch.yml',
    'icon.svg',
    'README.md',
    'README.zh.md',
    'LICENSE',
    'CHANGELOG.md',
    'scripts/check.mjs',
  ]
  for (const file of requiredFiles) check(`file ${file}`, exists(file), `missing required file: ${file}`)

  if (exists('cordis.patch.yml')) {
    check('patch references package name', read('cordis.patch.yml').includes(`name: ${pkg.name}`), 'cordis.patch.yml does not declare the package name')
  }

  if (exists('client.js')) {
    const client = read('client.js')
    const loader = client.match(/__ModuleLoader__\.load\(\{\s*id:\s*['"]([^'"]+)['"]/)
    check('client loader id', loader?.[1] === pkg.name, `client loader id is ${loader?.[1] ?? 'missing'}, expected ${pkg.name}`)
    check('client plugin name', client.includes(`name: '${pkg.name}'`), 'client plugin object does not declare the package name')
  }
}

for (const locale of ['en', 'zh']) {
  const file = `locale/${locale}.json`
  if (!exists(file)) continue
  const dict = parseJson(file)
  check(`${file} meta.title`, typeof dict?.meta?.title === 'string' && dict.meta.title.length > 0)
  check(`${file} meta.description`, typeof dict?.meta?.description === 'string' && dict.meta.description.length > 10)
}

if (exists('icon.svg')) {
  const icon = fs.statSync(path.join(root, 'icon.svg'))
  const svg = read('icon.svg').trimStart()
  check('icon is SVG', svg.startsWith('<svg'))
  check('icon size limit', icon.size <= 256 * 1024, `icon.svg is ${icon.size} bytes; the limit is 262144`)
}

const jsFiles = []
walk(root, (file) => {
  if (file.endsWith('.js') || file.endsWith('.mjs')) jsFiles.push(file)
  const name = path.basename(file)
  const temporary = /^(?:\.tmp-|.*\.(?:tmp|bak|log)$|Thumbs\.db|\.DS_Store)$/.test(name) || name.startsWith('.env') && name !== '.env.example'
  if (temporary) failures.push(`temporary or local file present: ${path.relative(root, file)}`)
  if (name.endsWith('.local')) failures.push(`local-only file present: ${path.relative(root, file)}`)
})

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'ignore' })
  if (result.error) {
    failures.push(`syntax: ${path.relative(root, file)}: ${result.error.message}`)
  } else if (result.status !== 0) {
    failures.push(`syntax: ${path.relative(root, file)} failed node --check`)
  }
}

const failed = failures.length > 0
for (const failure of failures) console.error(`✗ ${failure}`)
if (failed) {
  console.error(`\n${failures.length} check(s) failed.`)
  process.exit(1)
}

console.log(`✓ ${checks.length} checks passed; ${jsFiles.length} JavaScript files parsed; no temporary files found.`)
