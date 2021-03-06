# little-pubsub
> Small publish & subscribe class

## INSTALL

#### npm
```sh
npm i --save little-pubsub
```

## USAGE

```js
import PubSub from 'little-pubsub';
const pubsub = new PubSub();
```

## Example

```js
import PubSub from 'little-pubsub';
const pubsub = new PubSub();

pubsub.subscribe('event', value => { console.log(value) })

pubsub.publish('event', 'hello')

pubsub.unsubscribe('event', value => { console.log(value) })

PubSub.isLittlePubSub(pubsub)
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
```js
pubsub.subscribe('event-name', data => {
  console.log(data);
})
```
#### unsubscribe
`name`: name of the channel to unsubscribe<br>
`handler`: method<br>
`context`: context<br>
```js
pubsub.unsubscribe('event-name', data => {
  console.log(data);
})
```

#### publish
`name`: name of the channel to publish to<br>
`handler`: method<br>
`context`: context<br>
```js
pubsub.publish('event-name', 'data')
```

<!-- #### isLittlePubSub
`instance`: instance to check<br>
```js
const LittlePubSub = require('little-pubsub')
const pubsub = new LittlePubSub()

LittlePubSub.isLittlePubSub(pubsub)
``` -->
