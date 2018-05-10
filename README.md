# socket-request
> Simple WebSocket request/response server & client

## usage

```js
import { PubSub } from 'little-pubsub';
const pubsub = new PubSub();
```

## API
### pubsub([options])
#### subscribe
`name`: name of the channel to subscribe to<br>
`handler`: method<br>
`context`: context<br>
```js
pubsub.subscribe('event-name', data => {
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
