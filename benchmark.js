import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import PubSub from './index.js'

const formatNumber = (num) => num.toLocaleString()
const formatOps = (ops) => `${formatNumber(Math.round(ops))} ops/sec`
const formatTime = (ms) =>
  ms < 1 ? `${(ms * 1000).toFixed(2)}µs` : `${ms.toFixed(2)}ms`

// Force GC if available (run with --expose-gc for best accuracy)
function tryGC() {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc()
  }
}

function benchmark(name, fn, options = {}) {
  const {
    minIterations = 10000,
    maxIterations = 1000000,
    targetTimeMs = 100, // Target time per sample
    samples = 5, // Number of samples to collect
    warmupIterations = 5000
  } = options

  // Extended warmup for JIT optimization
  for (let i = 0; i < warmupIterations; i++) fn()

  // Calibration run to determine iteration count
  tryGC()
  const calibrationStart = performance.now()
  for (let i = 0; i < 1000; i++) fn()
  const calibrationTime = performance.now() - calibrationStart

  // Calculate iterations needed for target time
  let iterations = Math.round((targetTimeMs / calibrationTime) * 1000)
  iterations = Math.max(minIterations, Math.min(maxIterations, iterations))

  // Collect multiple samples
  const sampleResults = []

  for (let s = 0; s < samples; s++) {
    tryGC()

    const start = performance.now()
    for (let i = 0; i < iterations; i++) fn()
    const end = performance.now()

    const totalMs = end - start
    const opsPerSec = (iterations / totalMs) * 1000
    sampleResults.push({ totalMs, opsPerSec })
  }

  // Sort by ops/sec and remove outliers (fastest and slowest)
  sampleResults.sort((a, b) => a.opsPerSec - b.opsPerSec)
  const trimmed =
    samples > 3
      ? sampleResults.slice(1, -1) // Remove min and max
      : sampleResults

  // Calculate statistics
  const opsValues = trimmed.map((r) => r.opsPerSec)
  const avgOpsPerSec = opsValues.reduce((a, b) => a + b, 0) / opsValues.length
  const minOps = Math.min(...opsValues)
  const maxOps = Math.max(...opsValues)
  const medianOps = opsValues[Math.floor(opsValues.length / 2)]

  // Standard deviation
  const variance =
    opsValues.reduce((acc, val) => acc + Math.pow(val - avgOpsPerSec, 2), 0) /
    opsValues.length
  const stdDev = Math.sqrt(variance)
  const relativeStdDev = (stdDev / avgOpsPerSec) * 100 // as percentage

  const avgTimePerOp = 1000 / avgOpsPerSec // in ms

  return {
    name,
    iterations,
    samples,
    opsPerSec: avgOpsPerSec,
    medianOps,
    minOps,
    maxOps,
    stdDev,
    relativeStdDev,
    avgTimePerOp,
    margin: relativeStdDev // ±% margin of error
  }
}

function runBenchmarks() {
  const results = []

  // Subscribe benchmark
  results.push(
    benchmark('subscribe', () => {
      const pubsub = new PubSub()
      pubsub.subscribe('event', () => {})
    })
  )

  // Publish with 1 subscriber
  const pubsub1 = new PubSub(true)
  pubsub1.subscribe('event', () => {})
  let c1 = 0
  results.push(
    benchmark('publish (1 subscriber)', () => {
      pubsub1.publish('event', c1++)
    })
  )

  // Publish with 10 subscribers
  const pubsub10 = new PubSub(true)
  for (let j = 0; j < 10; j++) pubsub10.subscribe('event', () => {})
  let c10 = 0
  results.push(
    benchmark('publish (10 subscribers)', () => {
      pubsub10.publish('event', c10++)
    })
  )

  // Publish with 100 subscribers
  const pubsub100 = new PubSub(true)
  for (let j = 0; j < 100; j++) pubsub100.subscribe('event', () => {})
  let c100 = 0
  results.push(
    benchmark(
      'publish (100 subscribers)',
      () => {
        pubsub100.publish('event', c100++)
      },
      { minIterations: 5000, targetTimeMs: 50 }
    )
  )

  // getValue
  const pubsubGet = new PubSub()
  pubsubGet.subscribe('event', () => {})
  pubsubGet.publish('event', 'test-value')
  results.push(
    benchmark('getValue', () => {
      pubsubGet.getValue('event')
    })
  )

  // hasSubscribers
  const pubsubHas = new PubSub()
  pubsubHas.subscribe('event', () => {})
  results.push(
    benchmark('hasSubscribers', () => {
      pubsubHas.hasSubscribers('event')
    })
  )

  // subscriberCount
  const pubsubCount = new PubSub()
  pubsubCount.subscribe('event', () => {})
  pubsubCount.subscribe('event', () => {})
  results.push(
    benchmark('subscriberCount', () => {
      pubsubCount.subscriberCount('event')
    })
  )

  // Full cycle
  results.push(
    benchmark(
      'full cycle (sub+pub+unsub)',
      () => {
        const pubsub = new PubSub()
        const handler = () => {}
        pubsub.subscribe('event', handler)
        pubsub.publish('event', 'value')
        pubsub.unsubscribe('event', handler)
      },
      { minIterations: 10000, targetTimeMs: 50 }
    )
  )

  // Lookup in many events
  const pubsubMany = new PubSub()
  for (let i = 0; i < 1000; i++) {
    pubsubMany.subscribe(`event-${i}`, () => {})
  }
  let idx = 0
  results.push(
    benchmark('lookup (1000 events)', () => {
      pubsubMany.getValue(`event-${idx++ % 1000}`)
    })
  )

  // Unsubscribe via returned function
  results.push(
    benchmark('unsubscribe (returned fn)', () => {
      const pubsub = new PubSub()
      const unsub = pubsub.subscribe('event', () => {})
      unsub()
    })
  )

  return results
}

function saveResults(results) {
  const timestamp = new Date().toISOString()
  const nodeVersion = process.version
  const platform = process.platform
  const arch = process.arch

  const benchmarkData = {
    timestamp,
    nodeVersion,
    platform,
    arch,
    results: results.map((r) => ({
      name: r.name,
      iterations: r.iterations,
      samples: r.samples,
      opsPerSec: r.opsPerSec,
      medianOps: r.medianOps,
      minOps: r.minOps,
      maxOps: r.maxOps,
      margin: r.margin,
      avgTimePerOp: r.avgTimePerOp
    }))
  }

  // Load existing history or create new
  const historyFile = 'benchmark-history.json'
  let history = []

  if (existsSync(historyFile)) {
    try {
      history = JSON.parse(readFileSync(historyFile, 'utf-8'))
    } catch {
      history = []
    }
  }

  history.push(benchmarkData)
  writeFileSync(historyFile, JSON.stringify(history, null, 2))

  return { current: benchmarkData, history }
}

function printResults(results) {
  console.log('\n' + '='.repeat(85))
  console.log('📈 PERFORMANCE BENCHMARK RESULTS')
  console.log('='.repeat(85))
  console.log(`Date: ${new Date().toISOString()}`)
  console.log(
    `Node: ${process.version} | Platform: ${process.platform} | Arch: ${process.arch}`
  )
  console.log('='.repeat(85))
  console.log(
    `${'Operation'.padEnd(28)} | ${'Ops/sec'.padStart(18)} | ${'±%'.padStart(
      6
    )} | ${'Avg Time'.padStart(12)} | ${'Samples'.padStart(7)}`
  )
  console.log('-'.repeat(85))

  for (const r of results) {
    const marginStr = `±${r.margin.toFixed(1)}%`
    console.log(
      `${r.name.padEnd(28)} | ${formatOps(r.opsPerSec).padStart(
        18
      )} | ${marginStr.padStart(6)} | ${formatTime(r.avgTimePerOp).padStart(
        12
      )} | ${String(r.samples).padStart(7)}`
    )
  }

  console.log('='.repeat(85))
}

function printComparison(current, previous) {
  if (!previous) {
    console.log('\n📊 No previous benchmark to compare against.')
    return
  }

  console.log('\n' + '='.repeat(85))
  console.log('📊 COMPARISON WITH PREVIOUS RUN')
  console.log('='.repeat(85))
  console.log(`Previous: ${previous.timestamp}`)
  console.log(`Current:  ${current.timestamp}`)
  console.log('-'.repeat(85))
  console.log(
    `${'Operation'.padEnd(28)} | ${'Previous'.padStart(
      15
    )} | ${'Current'.padStart(15)} | ${'Change'.padStart(
      10
    )} | ${'Status'.padStart(10)}`
  )
  console.log('-'.repeat(85))

  for (const curr of current.results) {
    const prev = previous.results.find((r) => r.name === curr.name)
    if (prev) {
      const change = ((curr.opsPerSec - prev.opsPerSec) / prev.opsPerSec) * 100
      const changeStr = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`

      // Consider margin of error for status
      const margin = Math.max(curr.margin || 0, prev.margin || 0)
      const significant = Math.abs(change) > margin * 2

      let status
      if (!significant) {
        status = '⚪ ~same'
      } else if (change > 5) {
        status = '🟢 faster'
      } else if (change < -5) {
        status = '🔴 slower'
      } else {
        status = '🟡 ~same'
      }

      console.log(
        `${curr.name.padEnd(28)} | ${formatNumber(
          Math.round(prev.opsPerSec)
        ).padStart(15)} | ${formatNumber(Math.round(curr.opsPerSec)).padStart(
          15
        )} | ${changeStr.padStart(10)} | ${status.padStart(10)}`
      )
    }
  }

  console.log('='.repeat(85))
}

// Run benchmarks
console.log('🚀 Running benchmarks...\n')
const results = runBenchmarks()
printResults(results)

const { current, history } = saveResults(results)
const previous = history.length > 1 ? history[history.length - 2] : null
printComparison(current, previous)

console.log(
  `\n✅ Results saved to benchmark-history.json (${history.length} entries)`
)
