export default class LittlePubSub  {
  subscribers: {[index: string]: { value?: any, handlers?: Function[] }} = {}
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

  publish(event: string, value: string | number | boolean | object | Array<any>): void {
    // always set value even when having no subscribers
    if (!this.hasSubscribers(event)) this.subscribers[event] = {}
    const oldValue = this.subscribers[event]?.value
    this.subscribers[event].value = value;
    
    if (this.verbose || oldValue !== value) 
      for (const handler of this.subscribers[event].handlers) {
        handler(value, oldValue)
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
