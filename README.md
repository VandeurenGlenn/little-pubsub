# little-pubsub
> Small publish & subscribe class

## INSTALL

#### npm
```sh
npm i --save little-pubsub
```

#### yarn
```sh
yarn add little-pubsub
```

## USAGE

```js
import PubSub from 'little-pubsub';
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
#### subscribe
`name`: name of the channel to unsubscribe for<br>
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
