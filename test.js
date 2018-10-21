const test = require('tape')
const PubSub  = require('.');

test('pubsub is defined', tape => {
  tape.plan(1)
  const pubsub = new PubSub()
  tape.ok(typeof pubsub === 'object')

  test('pubsub subscribes', tape => {
    tape.plan(1)
    pubsub.subscribe('on', (value) => tape.ok(value))
    pubsub.publish('on', 5)
  })
});
