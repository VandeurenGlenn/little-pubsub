export default class LittlePubSub  {
  subscribers: {} = {}
  verbose: boolean
  
  constructor(verbose?: boolean) {
    this.verbose = verbose
  }

  _handleContext(handler: Function, context?: Function): Function {
    if (typeof context === 'undefined') {
      context = handler;
    }
    return context
  }

  hasSubscribers(event: string): boolean {
    return this.subscribers[event] ? true : false
  }

  subscribe(event: string, handler: Function, context?: Function): void {    
    if (!this.hasSubscribers(event)) this.subscribers[event] = { handlers: [], value: undefined};

    context = this._handleContext(handler, context)
    this.subscribers[event].handlers.push(handler.bind(context))
  }

  unsubscribe(event: string, handler: Function, context?: Function): void {
    if (!this.hasSubscribers(event)) return
    
    context = this._handleContext(handler, context)
    const index = this.subscribers[event].handlers.indexOf(handler.bind(context));
    this.subscribers[event].handlers.splice(index);
    if (this.subscribers[event].handlers.length === 0) delete this.subscribers[event];    
  }

  publish(event: string, change: string | number | boolean | object | Array<any>): void {
    if (this.verbose && this.hasSubscribers(event) || this.subscribers?.[event].value !== change) {
      this.subscribers[event].value = change;
      this.subscribers[event].handlers.forEach((handler: Function) => {
        handler(change, this.subscribers[event].value)
      })
    }
  }

  once(event: string): Promise<string | number | boolean | object | Array<any>> {
    return new Promise((resolve) => {
      const cb = (value: string | number | boolean | object | Array<any>) => {
        this.unsubscribe(event, cb)
        resolve(value)
      }
      this.subscribe(event, cb)
    })
  }
}
