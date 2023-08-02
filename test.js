import test from 'tape'
import PubSub  from './index.js'

test('pubsub is defined', tape => {
  tape.plan(1)
  const pubsub = new PubSub()
  tape.ok(typeof pubsub === 'object')

  test('pubsub subscribes & publishes', tape => {
    tape.plan(1)
    pubsub.subscribe('on', (value) => tape.ok(value))
    pubsub.publish('on', 5)
  })
  
  test('pubsub unsubscribes', tape => {
    tape.plan(1)
    pubsub.unsubscribe('on', (value) => tape.ok(value))
    tape.ok(Boolean(Object.keys(pubsub.subscribers).length === 0))    
  })

  test('pubsub once', async (tape) => {
    tape.plan(1)
    setTimeout(() => pubsub.publish('on', true) ,1000)
    let value = await pubsub.once('on')
    tape.ok((value === true))
  })
});
