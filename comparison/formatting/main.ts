import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseArgs } from 'node:util'
import { runTestSuite, listTestCases, testCases } from './test-cases.js'
import type { LoggerAdapter } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const loggersDir = join(__dirname, 'loggers')

async function loadAdapters(): Promise<LoggerAdapter[]> {
  const files = await readdir(loggersDir)
  const loggerFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.js'))
  const adapters: LoggerAdapter[] = []

  for (const file of loggerFiles) {
    const modulePath = join(loggersDir, file)
    try {
      const mod = await import(modulePath)

      // Support both `adapters` array and single `adapter` export
      if (mod.adapters && Array.isArray(mod.adapters)) {
        adapters.push(...mod.adapters)
      } else if (mod.adapter) {
        adapters.push(mod.adapter)
      } else {
        console.log(`[SKIP] ${file}: no 'adapter' or 'adapters' export found`)
      }
    } catch (err) {
      console.log(`[ERROR] Failed to load ${file}:`, err)
    }
  }

  return adapters
}

function printHelp(): void {
  console.log(`
Logger Formatting Comparison Tool

Usage: pnpm format-test [options]

Options:
  --help, -h              Show this help message
  --list-loggers          List available loggers
  --list-cases            List available test cases
  --loggers=name1,name2   Run only specified loggers (comma-separated)
  --cases=1,2,3           Run only specified test cases (comma-separated IDs)

Examples:
  pnpm format-test                              Run all loggers with all test cases
  pnpm format-test --list-loggers               List available loggers
  pnpm format-test --list-cases                 List available test cases
  pnpm format-test --loggers=pino,winston       Run only pino and winston
  pnpm format-test --loggers=pino-pretty        Run only pino with pretty output
  pnpm format-test --cases=1,4,6                Run only test cases 1, 4, and 6
  pnpm format-test --loggers=pino --cases=1     Run pino with only test case 1
`)
}

function listLoggers(adapters: LoggerAdapter[]): void {
  console.log('\nAvailable loggers:\n')
  for (const adapter of adapters) {
    const suffix = adapter.name.endsWith('-pretty') ? ' (pretty)' : ''
    console.log(`  - ${adapter.name}${suffix}`)
  }
  console.log('')
}

async function main() {
  const { values } = parseArgs({
    options: {
      help: { type: 'boolean', short: 'h', default: false },
      'list-loggers': { type: 'boolean', default: false },
      'list-cases': { type: 'boolean', default: false },
      loggers: { type: 'string', default: '' },
      cases: { type: 'string', default: '' },
    },
    strict: true,
  })

  if (values.help) {
    printHelp()
    return
  }

  if (values['list-cases']) {
    listTestCases()
    return
  }

  const allAdapters = await loadAdapters()

  if (values['list-loggers']) {
    listLoggers(allAdapters)
    return
  }

  // Filter loggers
  const loggerFilter = values.loggers
    ? values.loggers.split(',').map(s => s.trim().toLowerCase())
    : null
  const adaptersToRun = loggerFilter
    ? allAdapters.filter(a => loggerFilter.includes(a.name.toLowerCase()))
    : allAdapters

  // Parse case IDs
  const caseIds = values.cases
    ? values.cases
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n))
    : undefined

  if (adaptersToRun.length === 0) {
    console.log('No matching loggers found.')
    console.log('Available loggers:', allAdapters.map(a => a.name).join(', '))
    return
  }

  if (caseIds && caseIds.length > 0) {
    const validIds = testCases.map(tc => tc.id)
    const invalidIds = caseIds.filter(id => !validIds.includes(id))
    if (invalidIds.length > 0) {
      console.log(`Warning: Invalid case IDs ignored: ${invalidIds.join(', ')}`)
    }
  }

  const W = 70
  const content = W - 4 // width inside ║  ...  ║
  const loggersList = adaptersToRun.map(a => a.name).join(', ')
  const casesList = caseIds ? caseIds.join(', ') : 'all'

  console.log(`\n╔${'═'.repeat(W - 2)}╗`)
  console.log(`║  ${'LOGGER FORMATTING COMPARISON'.padEnd(content)}║`)
  console.log(
    `║  ${('Loggers: ' + loggersList).substring(0, content).padEnd(content)}║`
  )
  console.log(
    `║  ${('Cases: ' + casesList).substring(0, content).padEnd(content)}║`
  )
  console.log(`╚${'═'.repeat(W - 2)}╝`)

  for (let i = 0; i < adaptersToRun.length; i++) {
    const adapter = adaptersToRun[i]
    await runTestSuite(adapter, { caseIds })

    // Separator between loggers
    if (i < adaptersToRun.length - 1) {
      console.log(`\n${'─'.repeat(W)}\n`)
    }
  }

  console.log(`\n╔${'═'.repeat(W - 2)}╗`)
  console.log(`║  ${'COMPARISON COMPLETE'.padEnd(content)}║`)
  console.log(`╚${'═'.repeat(W - 2)}╝\n`)
}

main().catch(console.error)
