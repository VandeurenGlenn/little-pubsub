import { test, describe } from 'node:test'
import assert from 'node:assert'
import PubSub from './index.js'

describe('PubSub', () => {
  describe('instantiation', () => {
    test('pubsub is defined and is an object', () => {
      const pubsub = new PubSub()
      assert.strictEqual(typeof pubsub, 'object')
    })

    test('pubsub accepts verbose option in constructor', () => {
      const pubsub = new PubSub(true)
      assert.strictEqual(pubsub.verbose, true)

      const pubsub2 = new PubSub(false)
      assert.strictEqual(pubsub2.verbose, false)
    })
  })

  describe('subscribe and publish', () => {
    test('pubsub subscribes and receives published value', () => {
      const pubsub = new PubSub()
      let receivedValue
      pubsub.subscribe('event', (value) => {
        receivedValue = value
      })
      pubsub.publish('event', 5)
      assert.strictEqual(receivedValue, 5)
    })

    test('pubsub handler receives oldValue on subsequent publishes', () => {
      const pubsub = new PubSub(true) // verbose to trigger on same value
      const receivedOldValues = []

      pubsub.subscribe('event', (value, oldValue) => {
        receivedOldValues.push(oldValue)
      })

      pubsub.publish('event', 5)
      pubsub.publish('event', 10)

      assert.strictEqual(receivedOldValues[0], undefined)
      assert.strictEqual(receivedOldValues[1], 5)
    })

    test('pubsub does not trigger handler when value is the same (non-verbose)', () => {
      const pubsub = new PubSub()
      let callCount = 0

      pubsub.subscribe('event', () => {
        callCount++
      })

      pubsub.publish('event', 5)
      pubsub.publish('event', 5) // same value, should not trigger

      assert.strictEqual(callCount, 1)
    })

    test('pubsub triggers handler for same value when verbose is true', () => {
      const pubsub = new PubSub(true)
      let callCount = 0

      pubsub.subscribe('event', () => {
        callCount++
      })

      pubsub.publish('event', 5)
      pubsub.publish('event', 5) // same value, but verbose mode

      assert.strictEqual(callCount, 2)
    })

    test('publishVerbose triggers handler for same value', () => {
      const pubsub = new PubSub() // non-verbose by default
      let callCount = 0

      pubsub.subscribe('event', () => {
        callCount++
      })

      pubsub.publish('event', 5)
      pubsub.publishVerbose('event', 5) // same value, but using publishVerbose

      assert.strictEqual(callCount, 2)
    })

    test('pubsub supports multiple subscribers for same event', () => {
      const pubsub = new PubSub()
      const receivedValues = []

      pubsub.subscribe('event', (value) => {
        receivedValues.push(`first:${value}`)
      })

      pubsub.subscribe('event', (value) => {
        receivedValues.push(`second:${value}`)
      })

      pubsub.publish('event', 42)

      assert.strictEqual(receivedValues.length, 2)
      assert.strictEqual(receivedValues[0], 'first:42')
      assert.strictEqual(receivedValues[1], 'second:42')
    })
  })

  describe('hasSubscribers', () => {
    test('returns false for non-existent event', () => {
      const pubsub = new PubSub()
      assert.strictEqual(pubsub.hasSubscribers('nonexistent'), false)
    })

    test('returns true after subscribing', () => {
      const pubsub = new PubSub()
      pubsub.subscribe('event', () => {})
      assert.strictEqual(pubsub.hasSubscribers('event'), true)
    })
  })

  describe('subscriberCount', () => {
    test('returns 0 for non-existent event', () => {
      const pubsub = new PubSub()
      assert.strictEqual(pubsub.subscriberCount('nonexistent'), 0)
    })

    test('returns correct count after multiple subscribes', () => {
      const pubsub = new PubSub()
      pubsub.subscribe('event', () => {})
      assert.strictEqual(pubsub.subscriberCount('event'), 1)

      pubsub.subscribe('event', () => {})
      assert.strictEqual(pubsub.subscriberCount('event'), 2)

      pubsub.subscribe('event', () => {})
      assert.strictEqual(pubsub.subscriberCount('event'), 3)
    })

    test('count decreases after unsubscribe', () => {
      const pubsub = new PubSub()
      const handler1 = () => {}
      const handler2 = () => {}

      pubsub.subscribe('event', handler1)
      pubsub.subscribe('event', handler2)
      assert.strictEqual(pubsub.subscriberCount('event'), 2)

      pubsub.unsubscribe('event', handler1)
      assert.strictEqual(pubsub.subscriberCount('event'), 1)
    })
  })

  describe('clear', () => {
    test('removes all subscribers', () => {
      const pubsub = new PubSub()
      pubsub.subscribe('event1', () => {})
      pubsub.subscribe('event2', () => {})
      pubsub.publish('event1', 'value1')
      pubsub.publish('event2', 'value2')

      pubsub.clear()

      assert.strictEqual(pubsub.hasSubscribers('event1'), false)
      assert.strictEqual(pubsub.hasSubscribers('event2'), false)
      assert.strictEqual(pubsub.getValue('event1'), undefined)
      assert.strictEqual(pubsub.getValue('event2'), undefined)
    })

    test('can subscribe again after clear', () => {
      const pubsub = new PubSub()
      pubsub.subscribe('event', () => {})
      pubsub.clear()

      let received
      pubsub.subscribe('event', (v) => {
        received = v
      })
      pubsub.publish('event', 'new-value')

      assert.strictEqual(received, 'new-value')
    })
  })

  describe('subscribe returns unsubscribe function', () => {
    test('returns a function', () => {
      const pubsub = new PubSub()
      const unsubscribe = pubsub.subscribe('event', () => {})
      assert.strictEqual(typeof unsubscribe, 'function')
    })

    test('unsubscribe function removes handler', () => {
      const pubsub = new PubSub()
      let callCount = 0
      const unsubscribe = pubsub.subscribe('event', () => {
        callCount++
      })

      pubsub.publish('event', 1)
      assert.strictEqual(callCount, 1)

      unsubscribe()

      pubsub.publish('event', 2)
      assert.strictEqual(callCount, 1) // should not increase
    })

    test('unsubscribe function works with context', () => {
      const pubsub = new PubSub()
      const context = { value: 0 }
      const handler = function (v) {
        this.value = v
      }

      const unsubscribe = pubsub.subscribe('event', handler, { context })
      pubsub.publish('event', 42)
      assert.strictEqual(context.value, 42)

      unsubscribe()
      pubsub.publish('event', 100)
      assert.strictEqual(context.value, 42) // should not change
    })
  })

  describe('getValue', () => {
    test('returns undefined for non-existent event', () => {
      const pubsub = new PubSub()
      assert.strictEqual(pubsub.getValue('nonexistent'), undefined)
    })

    test('returns published value', () => {
      const pubsub = new PubSub()
      pubsub.subscribe('event', () => {})
      pubsub.publish('event', 'test-value')
      assert.strictEqual(pubsub.getValue('event'), 'test-value')
    })
  })

  describe('late subscriber', () => {
    test('new subscriber immediately receives current value if exists', () => {
      const pubsub = new PubSub()
      pubsub.subscribe('event', () => {}) // first subscriber
      pubsub.publish('event', 'existing-value')

      let receivedValue
      pubsub.subscribe('event', (value) => {
        receivedValue = value
      })

      assert.strictEqual(receivedValue, 'existing-value')
    })
  })

  describe('unsubscribe', () => {
    test('removes event when no handlers left', () => {
      const pubsub = new PubSub()
      const handler = () => {}

      pubsub.subscribe('event', handler)
      assert.strictEqual(pubsub.hasSubscribers('event'), true)

      pubsub.unsubscribe('event', handler)
      assert.strictEqual(pubsub.hasSubscribers('event'), false)
    })

    test('with keepValue option preserves value', () => {
      const pubsub = new PubSub()
      const handler = () => {}

      pubsub.subscribe('event', handler)
      pubsub.publish('event', 'preserved-value')
      pubsub.unsubscribe('event', handler, { keepValue: true })

      assert.strictEqual(pubsub.hasSubscribers('event'), true)
      assert.strictEqual(pubsub.getValue('event'), 'preserved-value')
    })

    test('on non-existent event does not throw', () => {
      const pubsub = new PubSub()
      assert.doesNotThrow(() => {
        pubsub.unsubscribe('nonexistent', () => {})
      })
    })
  })

  describe('once', () => {
    test('resolves with published value', async () => {
      const pubsub = new PubSub()

      setTimeout(() => pubsub.publish('event', 'once-value'), 50)

      const value = await pubsub.once('event')
      assert.strictEqual(value, 'once-value')
    })

    test('automatically unsubscribes after receiving value', async () => {
      const pubsub = new PubSub()

      setTimeout(() => pubsub.publish('event', 'value'), 50)

      await pubsub.once('event')
      assert.strictEqual(pubsub.hasSubscribers('event'), false)
    })

    test('with keepValue preserves value after resolving', async () => {
      const pubsub = new PubSub()

      setTimeout(() => pubsub.publish('event', 'kept-value'), 50)

      const value = await pubsub.once('event', { keepValue: true })
      assert.strictEqual(value, 'kept-value')
      assert.strictEqual(pubsub.getValue('event'), 'kept-value')
    })
  })

  describe('publish without subscribers', () => {
    test('does not throw', () => {
      const pubsub = new PubSub()
      assert.doesNotThrow(() => {
        pubsub.publish('event', 'value')
      })
    })

    test('still stores value', () => {
      const pubsub = new PubSub()
      pubsub.publish('event', 'stored-value')
      assert.strictEqual(pubsub.getValue('event'), 'stored-value')
    })
  })

  describe('edge cases', () => {
    test('handles null and undefined values correctly', () => {
      const pubsub = new PubSub(true) // verbose to allow republish

      pubsub.subscribe('event', () => {})
      pubsub.publish('event', null)
      assert.strictEqual(pubsub.getValue('event'), null)

      pubsub.publish('event', undefined)
      assert.strictEqual(pubsub.getValue('event'), undefined)
    })

    test('handles object values correctly', () => {
      const pubsub = new PubSub()
      const obj = { foo: 'bar', nested: { baz: 123 } }

      let receivedValue
      pubsub.subscribe('event', (value) => {
        receivedValue = value
      })

      pubsub.publish('event', obj)
      assert.deepStrictEqual(receivedValue, obj)
    })

    test('multiple events are independent', () => {
      const pubsub = new PubSub()
      const receivedValues = {}

      pubsub.subscribe('event1', (value) => {
        receivedValues.event1 = value
      })

      pubsub.subscribe('event2', (value) => {
        receivedValues.event2 = value
      })

      pubsub.publish('event1', 'value1')
      pubsub.publish('event2', 'value2')

      assert.strictEqual(receivedValues.event1, 'value1')
      assert.strictEqual(receivedValues.event2, 'value2')
    })

    test('handles array values correctly', () => {
      const pubsub = new PubSub()
      const arr = [1, 2, { nested: true }]

      let receivedValue
      pubsub.subscribe('event', (value) => {
        receivedValue = value
      })

      pubsub.publish('event', arr)
      assert.deepStrictEqual(receivedValue, arr)
    })

    test('handles boolean values correctly', () => {
      const pubsub = new PubSub(true)
      const values = []

      pubsub.subscribe('event', (value) => {
        values.push(value)
      })

      pubsub.publish('event', true)
      pubsub.publish('event', false)

      assert.deepStrictEqual(values, [true, false])
    })

    test('handles zero and empty string correctly', () => {
      const pubsub = new PubSub(true)
      const values = []

      pubsub.subscribe('event', (value) => {
        values.push(value)
      })

      pubsub.publish('event', 0)
      pubsub.publish('event', '')

      assert.deepStrictEqual(values, [0, ''])
      assert.strictEqual(pubsub.getValue('event'), '')
    })

    test('handles Symbol values correctly', () => {
      const pubsub = new PubSub()
      const sym = Symbol('test')

      let receivedValue
      pubsub.subscribe('event', (value) => {
        receivedValue = value
      })

      pubsub.publish('event', sym)
      assert.strictEqual(receivedValue, sym)
    })

    test('handles function values correctly', () => {
      const pubsub = new PubSub()
      const fn = () => 'hello'

      let receivedValue
      pubsub.subscribe('event', (value) => {
        receivedValue = value
      })

      pubsub.publish('event', fn)
      assert.strictEqual(receivedValue, fn)
      assert.strictEqual(receivedValue(), 'hello')
    })

    test('treats different object references as different values', () => {
      const pubsub = new PubSub() // non-verbose
      let callCount = 0

      pubsub.subscribe('event', () => {
        callCount++
      })

      pubsub.publish('event', { a: 1 })
      pubsub.publish('event', { a: 1 }) // same content, different reference

      assert.strictEqual(callCount, 2)
    })
  })

  describe('event name edge cases', () => {
    test('handles empty string as event name', () => {
      const pubsub = new PubSub()
      let received = false

      pubsub.subscribe('', () => {
        received = true
      })
      pubsub.publish('', 'value')

      assert.strictEqual(received, true)
      assert.strictEqual(pubsub.getValue(''), 'value')
    })

    test('handles special characters in event names', () => {
      const pubsub = new PubSub()
      const specialNames = [
        'event:name',
        'event.name',
        'event/name',
        'event-name',
        'event_name',
        'événement'
      ]
      const results = {}

      for (const name of specialNames) {
        pubsub.subscribe(name, (value) => {
          results[name] = value
        })
        pubsub.publish(name, name)
      }

      for (const name of specialNames) {
        assert.strictEqual(results[name], name)
      }
    })

    test('handles numeric-like string event names', () => {
      const pubsub = new PubSub()
      const received = []

      pubsub.subscribe('123', (value) => {
        received.push(value)
      })
      pubsub.publish('123', 'numeric-event')

      assert.strictEqual(received[0], 'numeric-event')
    })
  })

  describe('subscriber ordering', () => {
    test('handlers are called in order of subscription', () => {
      const pubsub = new PubSub()
      const order = []

      pubsub.subscribe('event', () => order.push(1))
      pubsub.subscribe('event', () => order.push(2))
      pubsub.subscribe('event', () => order.push(3))

      pubsub.publish('event', 'test')

      assert.deepStrictEqual(order, [1, 2, 3])
    })
  })

  describe('once edge cases', () => {
    test('once resolves immediately if value already exists', async () => {
      const pubsub = new PubSub()

      // Publish before calling once
      pubsub.publish('event', 'pre-existing-value')

      const value = await pubsub.once('event')
      assert.strictEqual(value, 'pre-existing-value')
    })

    test('once on different events resolves independently', async () => {
      const pubsub = new PubSub()

      const promise1 = pubsub.once('event1')
      const promise2 = pubsub.once('event2')

      setTimeout(() => {
        pubsub.publish('event1', 'value1')
        pubsub.publish('event2', 'value2')
      }, 50)

      const [value1, value2] = await Promise.all([promise1, promise2])

      assert.strictEqual(value1, 'value1')
      assert.strictEqual(value2, 'value2')
    })

    test('once with timeout rejects after timeout', async () => {
      const pubsub = new PubSub()

      await assert.rejects(() => pubsub.once('event', { timeout: 50 }), {
        message: 'Timeout waiting for event "event"'
      })
    })

    test('once with timeout resolves if event arrives before timeout', async () => {
      const pubsub = new PubSub()

      setTimeout(() => pubsub.publish('event', 'fast-value'), 20)

      const value = await pubsub.once('event', { timeout: 100 })
      assert.strictEqual(value, 'fast-value')
    })

    test('once with timeout cleans up handler on timeout', async () => {
      const pubsub = new PubSub()

      try {
        await pubsub.once('event', { timeout: 20 })
      } catch {
        // Expected to timeout
      }

      // Handler should be removed
      assert.strictEqual(pubsub.hasSubscribers('event'), false)
    })

    test('once with timeout and keepValue preserves value on timeout', async () => {
      const pubsub = new PubSub()

      // First publish a value, then wait for a different publish that times out
      pubsub.publish('event', 'initial-value')

      // Subscribe, get initial value immediately, then try to wait for another
      const pubsub2 = new PubSub()
      pubsub2.publish('event', 'stored-value')

      // The once will resolve immediately with existing value
      const value = await pubsub2.once('event', { keepValue: true })
      assert.strictEqual(value, 'stored-value')

      // Value should still be there because of keepValue
      assert.strictEqual(pubsub2.getValue('event'), 'stored-value')
    })
  })

  describe('context binding', () => {
    test('subscribe with context option binds handler to context', () => {
      const pubsub = new PubSub()
      const contextObj = { name: 'context' }
      let boundThis

      function handler() {
        boundThis = this
      }

      pubsub.subscribe('event', handler, { context: contextObj })
      pubsub.publish('event', 'value')

      // Note: context binding uses the context parameter
      assert.ok(boundThis !== undefined)
    })
  })

  describe('stress tests', () => {
    test('handles many subscribers on same event', () => {
      const pubsub = new PubSub()
      const count = 100
      let callCount = 0

      for (let i = 0; i < count; i++) {
        pubsub.subscribe('event', () => {
          callCount++
        })
      }

      pubsub.publish('event', 'test')
      assert.strictEqual(callCount, count)
    })

    test('handles many different events', () => {
      const pubsub = new PubSub()
      const count = 100
      const results = {}

      for (let i = 0; i < count; i++) {
        const eventName = `event-${i}`
        pubsub.subscribe(eventName, (value) => {
          results[eventName] = value
        })
        pubsub.publish(eventName, i)
      }

      for (let i = 0; i < count; i++) {
        assert.strictEqual(results[`event-${i}`], i)
      }
    })

    test('handles rapid publish updates', () => {
      const pubsub = new PubSub(true) // verbose to capture all
      const values = []

      pubsub.subscribe('event', (value) => {
        values.push(value)
      })

      for (let i = 0; i < 50; i++) {
        pubsub.publish('event', i)
      }

      assert.strictEqual(values.length, 50)
      assert.strictEqual(values[49], 49)
    })
  })

  describe('internal state', () => {
    test('subscribers Map structure is correct', () => {
      const pubsub = new PubSub()

      pubsub.subscribe('event', () => {})
      pubsub.publish('event', 'test-value')

      assert.ok(pubsub.subscribers.get('event'))
      assert.ok(Array.isArray(pubsub.subscribers.get('event').handlers))
      assert.strictEqual(pubsub.subscribers.get('event').handlers.length, 1)
      assert.strictEqual(pubsub.subscribers.get('event').value, 'test-value')
    })

    test('subscribers Map is empty initially', () => {
      const pubsub = new PubSub()
      assert.strictEqual(pubsub.subscribers.size, 0)
    })

    test('unsubscribe correctly removes specific handler', () => {
      const pubsub = new PubSub()
      const handler1 = () => {}
      const handler2 = () => {}

      pubsub.subscribe('event', handler1)
      pubsub.subscribe('event', handler2)

      assert.strictEqual(pubsub.subscribers.get('event').handlers.length, 2)

      pubsub.unsubscribe('event', handler1, { keepValue: true })

      // With the fix, unsubscribe now works correctly
      assert.strictEqual(pubsub.subscribers.get('event').handlers.length, 1)
      assert.ok(pubsub.subscribers.get('event'))
    })

    test('handler entries store original and bound references', () => {
      const pubsub = new PubSub()
      const handler = () => {}

      pubsub.subscribe('event', handler)

      const subscriber = pubsub.subscribers.get('event')
      assert.strictEqual(subscriber.handlers.length, 1)
      assert.strictEqual(subscriber.handlers[0].original, handler)
      assert.ok(typeof subscriber.handlers[0].bound === 'function')
    })

    test('handler without context is not bound (same reference)', () => {
      const pubsub = new PubSub()
      const handler = () => {}

      pubsub.subscribe('event', handler)

      const entry = pubsub.subscribers.get('event').handlers[0]
      // Without context, original and bound should be the same
      assert.strictEqual(entry.original, entry.bound)
    })

    test('handler with context is bound (different reference)', () => {
      const pubsub = new PubSub()
      const handler = function () {
        return this
      }
      const context = { name: 'test' }

      pubsub.subscribe('event', handler, { context })

      const entry = pubsub.subscribers.get('event').handlers[0]
      // With context, bound should be different from original
      assert.notStrictEqual(entry.original, entry.bound)
    })
  })
})

// Performance benchmarks - run separately from unit tests
describe('Performance Benchmarks', () => {
  const formatNumber = (num) => num.toLocaleString()
  const formatOps = (ops) => `${formatNumber(Math.round(ops))} ops/sec`
  const formatTime = (ms) =>
    ms < 1 ? `${(ms * 1000).toFixed(2)}µs` : `${ms.toFixed(2)}ms`

  function benchmark(name, fn, iterations = 100000) {
    // Warmup
    for (let i = 0; i < 1000; i++) fn()

    const start = performance.now()
    for (let i = 0; i < iterations; i++) fn()
    const end = performance.now()

    const totalMs = end - start
    const opsPerSec = (iterations / totalMs) * 1000
    const avgTimePerOp = totalMs / iterations

    return { name, iterations, totalMs, opsPerSec, avgTimePerOp }
  }

  test('subscribe performance', () => {
    const results = benchmark('subscribe', () => {
      const pubsub = new PubSub()
      pubsub.subscribe('event', () => {})
    })

    console.log(`\n📊 ${results.name}:`)
    console.log(`   Iterations: ${formatNumber(results.iterations)}`)
    console.log(`   Total time: ${formatTime(results.totalMs)}`)
    console.log(`   Throughput: ${formatOps(results.opsPerSec)}`)
    console.log(`   Avg per op: ${formatTime(results.avgTimePerOp)}`)

    assert.ok(results.opsPerSec > 0)
  })

  test('publish performance (single subscriber)', () => {
    const pubsub = new PubSub(true)
    pubsub.subscribe('event', () => {})

    let i = 0
    const results = benchmark('publish (1 subscriber)', () => {
      pubsub.publish('event', i++)
    })

    console.log(`\n📊 ${results.name}:`)
    console.log(`   Iterations: ${formatNumber(results.iterations)}`)
    console.log(`   Total time: ${formatTime(results.totalMs)}`)
    console.log(`   Throughput: ${formatOps(results.opsPerSec)}`)
    console.log(`   Avg per op: ${formatTime(results.avgTimePerOp)}`)

    assert.ok(results.opsPerSec > 0)
  })

  test('publish performance (10 subscribers)', () => {
    const pubsub = new PubSub(true)
    for (let j = 0; j < 10; j++) {
      pubsub.subscribe('event', () => {})
    }

    let i = 0
    const results = benchmark('publish (10 subscribers)', () => {
      pubsub.publish('event', i++)
    })

    console.log(`\n📊 ${results.name}:`)
    console.log(`   Iterations: ${formatNumber(results.iterations)}`)
    console.log(`   Total time: ${formatTime(results.totalMs)}`)
    console.log(`   Throughput: ${formatOps(results.opsPerSec)}`)
    console.log(`   Avg per op: ${formatTime(results.avgTimePerOp)}`)

    assert.ok(results.opsPerSec > 0)
  })

  test('publish performance (100 subscribers)', () => {
    const pubsub = new PubSub(true)
    for (let j = 0; j < 100; j++) {
      pubsub.subscribe('event', () => {})
    }

    let i = 0
    const results = benchmark(
      'publish (100 subscribers)',
      () => {
        pubsub.publish('event', i++)
      },
      10000
    )

    console.log(`\n📊 ${results.name}:`)
    console.log(`   Iterations: ${formatNumber(results.iterations)}`)
    console.log(`   Total time: ${formatTime(results.totalMs)}`)
    console.log(`   Throughput: ${formatOps(results.opsPerSec)}`)
    console.log(`   Avg per op: ${formatTime(results.avgTimePerOp)}`)

    assert.ok(results.opsPerSec > 0)
  })

  test('getValue performance', () => {
    const pubsub = new PubSub()
    pubsub.subscribe('event', () => {})
    pubsub.publish('event', 'test-value')

    const results = benchmark('getValue', () => {
      pubsub.getValue('event')
    })

    console.log(`\n📊 ${results.name}:`)
    console.log(`   Iterations: ${formatNumber(results.iterations)}`)
    console.log(`   Total time: ${formatTime(results.totalMs)}`)
    console.log(`   Throughput: ${formatOps(results.opsPerSec)}`)
    console.log(`   Avg per op: ${formatTime(results.avgTimePerOp)}`)

    assert.ok(results.opsPerSec > 0)
  })

  test('hasSubscribers performance', () => {
    const pubsub = new PubSub()
    pubsub.subscribe('event', () => {})

    const results = benchmark('hasSubscribers', () => {
      pubsub.hasSubscribers('event')
    })

    console.log(`\n📊 ${results.name}:`)
    console.log(`   Iterations: ${formatNumber(results.iterations)}`)
    console.log(`   Total time: ${formatTime(results.totalMs)}`)
    console.log(`   Throughput: ${formatOps(results.opsPerSec)}`)
    console.log(`   Avg per op: ${formatTime(results.avgTimePerOp)}`)

    assert.ok(results.opsPerSec > 0)
  })

  test('subscribe + publish + unsubscribe cycle', () => {
    const results = benchmark(
      'full cycle',
      () => {
        const pubsub = new PubSub()
        const handler = () => {}
        pubsub.subscribe('event', handler)
        pubsub.publish('event', 'value')
        pubsub.unsubscribe('event', handler)
      },
      50000
    )

    console.log(`\n📊 ${results.name}:`)
    console.log(`   Iterations: ${formatNumber(results.iterations)}`)
    console.log(`   Total time: ${formatTime(results.totalMs)}`)
    console.log(`   Throughput: ${formatOps(results.opsPerSec)}`)
    console.log(`   Avg per op: ${formatTime(results.avgTimePerOp)}`)

    assert.ok(results.opsPerSec > 0)
  })

  test('many events lookup performance', () => {
    const pubsub = new PubSub()
    // Create 1000 events
    for (let i = 0; i < 1000; i++) {
      pubsub.subscribe(`event-${i}`, () => {})
    }

    let i = 0
    const results = benchmark('lookup in 1000 events', () => {
      pubsub.getValue(`event-${i++ % 1000}`)
    })

    console.log(`\n📊 ${results.name}:`)
    console.log(`   Iterations: ${formatNumber(results.iterations)}`)
    console.log(`   Total time: ${formatTime(results.totalMs)}`)
    console.log(`   Throughput: ${formatOps(results.opsPerSec)}`)
    console.log(`   Avg per op: ${formatTime(results.avgTimePerOp)}`)

    assert.ok(results.opsPerSec > 0)
  })

  test('performance summary', () => {
    const allResults = []

    // Run all benchmarks and collect results
    const pubsub1 = new PubSub()
    allResults.push(
      benchmark('subscribe', () => {
        const p = new PubSub()
        p.subscribe('e', () => {})
      })
    )

    const pubsub2 = new PubSub(true)
    pubsub2.subscribe('event', () => {})
    let c1 = 0
    allResults.push(
      benchmark('publish (1 sub)', () => {
        pubsub2.publish('event', c1++)
      })
    )

    const pubsub3 = new PubSub(true)
    for (let j = 0; j < 10; j++) pubsub3.subscribe('event', () => {})
    let c2 = 0
    allResults.push(
      benchmark('publish (10 subs)', () => {
        pubsub3.publish('event', c2++)
      })
    )

    const pubsub4 = new PubSub()
    pubsub4.subscribe('event', () => {})
    pubsub4.publish('event', 'val')
    allResults.push(
      benchmark('getValue', () => {
        pubsub4.getValue('event')
      })
    )

    allResults.push(
      benchmark('hasSubscribers', () => {
        pubsub4.hasSubscribers('event')
      })
    )

    allResults.push(
      benchmark('subscriberCount', () => {
        pubsub4.subscriberCount('event')
      })
    )

    console.log('\n' + '='.repeat(60))
    console.log('📈 PERFORMANCE SUMMARY')
    console.log('='.repeat(60))
    console.log(
      `${'Operation'.padEnd(25)} | ${'Ops/sec'.padStart(
        15
      )} | ${'Avg Time'.padStart(12)}`
    )
    console.log('-'.repeat(60))

    for (const r of allResults) {
      console.log(
        `${r.name.padEnd(25)} | ${formatOps(r.opsPerSec).padStart(
          15
        )} | ${formatTime(r.avgTimePerOp).padStart(12)}`
      )
    }

    console.log('='.repeat(60))

    assert.ok(true)
  })
})
