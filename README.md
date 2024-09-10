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

### pubsub([options])

`verbose`: when false only fires after value change<br>

```js
pubsub = new PubSub({
  verbose: false // default: true
})
```

#### subscribe

`name`: name of the channel to subscribe to<br>
`handler`: method<br>
`context`: context<br>

subscribing to an event will also return it's initial value

```js
pubsub.subscribe('event-name', (data) => {
  console.log(data)
})
```

#### unsubscribe

`name`: name of the channel to unsubscribe<br>
`handler`: method<br>
`context`: context<br>
`keepValue`: boolean<br>

```js
pubsub.unsubscribe(
  'event-name',
  (data) => {
    console.log(data)
  },
  false // default
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

`name`: name of the channel to publish to<br>

```js
pubsub.hasSubscribers('event-name')
```
