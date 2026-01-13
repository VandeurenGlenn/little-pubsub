# little-pubsub

> Small publish & subscribe class

## INSTALL

#### npm

```sh
npm i --save @vandeurenglenn/little-pubsub
```

## USAGE

```js
import PubSub from '@vandeurenglenn/little-pubsub'
const pubsub = new PubSub()
```

## Breaking Changes

### v1.5.0

`subscribe[context]` & `unsubscribe[context]` -> `subscribe[options({keepValue, context})]`

```js
// before
pusbub.subscribe(topic, handler, context)

// now
pusbub.subscribe(topic, handler, { context })
```

## Example

```js
import PubSub from '@vandeurenglenn/little-pubsub'
const pubsub = new PubSub()

pubsub.subscribe('event', (value) => {
  console.log(value)
})

pubsub.publish('event', 'hello')
// always runs handler
// (can use to overide littlePubsub.verbose setting without changing the behavior of the rest)
pubsub.publishVerbose('event', 'hello')

pubsub.unsubscribe('event', (value) => {
  console.log(value)
})

pubsub.hasSubscribers('event')

await pubsub.once('event')
```

## API

### pubsub(verbose?)

`verbose`: when false only fires after value change (default: false)<br>

```js
const pubsub = new PubSub() // verbose defaults to false
const pubsub = new PubSub(true) // always trigger handlers
```

#### subscribe

`name`: name of the channel to subscribe to<br>
`handler`: method<br>
`options`: { context }<br>

Subscribing to an event returns an unsubscribe function. If value already exists, handler is called immediately.

```js
const unsubscribe = pubsub.subscribe('event-name', (data) => {
  console.log(data)
})

// Later: clean unsubscribe
unsubscribe()
```

#### unsubscribe

`name`: name of the channel to unsubscribe<br>
`handler`: method<br>
`options`: { context, keepValue }<br>

```js
pubsub.unsubscribe(
  'event-name',
  (data) => {
    console.log(data)
  },
  { keepValue: false } // default
)
```

#### publish

`name`: name of the channel to publish to<br>
`handler`: method<br>
`verbose`: boolean<br>

```js
pubsub.publish('event-name', 'data')
```

#### publish

`name`: name of the channel to publish to<br>
`handler`: method<br>

```js
pubsub.publishVerbose('event-name', 'data')
```

#### once

`name`: name of the channel to get the value from<br>

```js
pubsub.getValue('event-name')
```

#### once

`name`: name of the channel to publish to<br>

```js
await pubsub.once('event-name')
```

#### hasSubscribers

`name`: name of the channel to check<br>

```js
pubsub.hasSubscribers('event-name') // true or false
```

#### subscriberCount

`name`: name of the channel to count<br>

```js
pubsub.subscriberCount('event-name') // number of handlers
```

#### clear

Removes all subscribers and values.

```js
pubsub.clear()
```
