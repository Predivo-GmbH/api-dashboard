#!/usr/bin/env node

/**
 * Feature Coverage Checker
 *
 * Reads docs/FEATURES.md and verifies that every feature has at least one
 * test file that actually exists on disk.
 *
 * Exit codes:
 *   0 — all features covered
 *   1 — one or more features missing test files
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const featuresPath = resolve(ROOT, 'docs/FEATURES.md')
if (!existsSync(featuresPath)) {
  console.error('ERROR: docs/FEATURES.md not found')
  process.exit(1)
}

const content = readFileSync(featuresPath, 'utf-8')

// Parse features: each starts with "## F-NNN: Title"
const featureRegex = /^## (F-\d{3}): (.+)$/gm
const testLineRegex = /^\- \*\*Tests?\*\*:\s*(.+)$/gm

const features = []
let match

while ((match = featureRegex.exec(content)) !== null) {
  features.push({ id: match[1], name: match[2], offset: match.index })
}

// For each feature, find the Tests line in its section
const uncovered = []
const covered = []

for (let i = 0; i < features.length; i++) {
  const feature = features[i]
  const sectionStart = feature.offset
  const sectionEnd = i + 1 < features.length ? features[i + 1].offset : content.length
  const section = content.slice(sectionStart, sectionEnd)

  const testMatch = /^\- \*\*Tests?\*\*:\s*(.+)$/m.exec(section)
  if (!testMatch) {
    uncovered.push({ ...feature, reason: 'No **Tests** line in FEATURES.md' })
    continue
  }

  const testPaths = testMatch[1]
    .split(',')
    .map((p) => p.replace(/`/g, '').trim())
    .filter(Boolean)

  const existingPaths = testPaths.filter((p) => existsSync(resolve(ROOT, p)))

  if (existingPaths.length === 0) {
    uncovered.push({
      ...feature,
      reason: `Test file(s) not found: ${testPaths.join(', ')}`,
    })
  } else {
    covered.push({ ...feature, tests: existingPaths })
  }
}

// Report
console.log('\n=== Feature Coverage Report ===\n')
console.log(`Total features: ${features.length}`)
console.log(`Covered:        ${covered.length}`)
console.log(`Uncovered:      ${uncovered.length}`)

if (covered.length > 0) {
  console.log('\nCovered features:')
  for (const f of covered) {
    console.log(`  ${f.id}: ${f.name}`)
    for (const t of f.tests) {
      console.log(`    -> ${t}`)
    }
  }
}

if (uncovered.length > 0) {
  console.log('\nUncovered features:')
  for (const f of uncovered) {
    console.log(`  ${f.id}: ${f.name}`)
    console.log(`    Reason: ${f.reason}`)
  }
  console.log('')
  process.exit(1)
}

console.log('\nAll features have test coverage.\n')
process.exit(0)
