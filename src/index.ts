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

  subscribe(
    event: string,
    handler: Function,
    options?: { context?: Function }
  ): void {
    if (!this.hasSubscribers(event))
      this.subscribers[event] = { handlers: [], value: undefined }

    const context = this._handleContext(handler, options?.context)
    const _handler = handler.bind(context)

    this.subscribers[event].handlers.push(_handler)

    if (this.subscribers[event].value !== undefined)
      _handler(this.subscribers[event].value, undefined)
  }

  unsubscribe(
    event: string,
    handler: Function,
    options?: { keepValue?: boolean; context?: Function }
  ): void {
    if (!options) options = { keepValue: false }
    if (!this.hasSubscribers(event)) return

    const context = this._handleContext(handler, options.context)
    const index = this.subscribers[event].handlers.indexOf(
      handler.bind(context)
    )
    this.subscribers[event].handlers.splice(index)
    // delete event if no handlers left but supports keeping value for later use
    // (like when unsubscribing from a value that is still needed because others might subscibe to it)
    if (this.subscribers[event].handlers.length === 0 && !options.keepValue)
      delete this.subscribers[event]
  }

  publish(event: string, value: any, verbose?: boolean): void {
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

  publishVerbose(event: string, value: any) {
    this.publish(event, value, true)
  }

  once(
    event: string,
    options?: { keepValue?: boolean; context?: Function }
  ): Promise<any> {
    return new Promise((resolve) => {
      const cb = (value: any) => {
        resolve(value)
        this.unsubscribe(event, cb, options)
      }
      this.subscribe(event, cb, options)
    })
  }
}
