export default class LittlePubSub {
  subscribers: { [index: string]: { value?: any; handlers?: Function[] } } = {}
  verbose: boolean

  constructor(verbose?: boolean) {
    this.verbose = verbose
  }

  _handleContext(handler: Function, context?: Function): Function {
    if (typeof context === 'undefined') {
      context = handler
    }
    return context
  }

  hasSubscribers(event: string): boolean {
    return this.subscribers[event] ? true : false
  }

  getValue(event: string): any {
    if (this.subscribers[event]) return this.subscribers[event].value
    return undefined
  }

  subscribe(event: string, handler: Function, context?: Function): void {
    if (!this.hasSubscribers(event))
      this.subscribers[event] = { handlers: [], value: undefined }

    context = this._handleContext(handler, context)
    const _handler = handler.bind(context)

    this.subscribers[event].handlers.push(_handler)

    if (this.subscribers[event].value !== undefined)
      _handler(this.subscribers[event].value, undefined)
  }

  unsubscribe(
    event: string,
    handler: Function,
    context?: Function,
    keepValue?: boolean
  ): void {
    if (!this.hasSubscribers(event)) return

    context = this._handleContext(handler, context)
    const index = this.subscribers[event].handlers.indexOf(
      handler.bind(context)
    )
    this.subscribers[event].handlers.splice(index)
    // delete event if no handlers left but supports keeping value for later use
    // (like when unsubscribing from a value that is still needed because others might subscibe to it)
    if (this.subscribers[event].handlers.length === 0 && !keepValue)
      delete this.subscribers[event]
  }

  publish(
    event: string,
    value: string | number | boolean | object | Array<any>,
    verbose?: boolean
  ): void {
    // always set value even when having no subscribers
    if (!this.hasSubscribers(event))
      this.subscribers[event] = {
        handlers: []
      }
    const oldValue = this.subscribers[event]?.value

    if (this.verbose || verbose || oldValue !== value) {
      this.subscribers[event].value = value
      for (const handler of this.subscribers[event].handlers) {
        handler(value, oldValue)
      }
    }
  }

  publishVerbose(
    event: string,
    value: string | number | boolean | object | Array<any>
  ) {
    this.publish(event, value, true)
  }

  once(
    event: string
  ): Promise<string | number | boolean | object | Array<any>> {
    return new Promise((resolve) => {
      const cb = (value: string | number | boolean | object | Array<any>) => {
        resolve(value)
        this.unsubscribe(event, cb)
      }
      this.subscribe(event, cb)
    })
  }
}
