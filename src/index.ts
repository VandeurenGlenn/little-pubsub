export type Handler<T = any> = (value: T, oldValue?: T) => void

export interface HandlerEntry<T = any> {
  original: Handler<T>
  bound: Handler<T>
}

export interface Subscriber<T = any> {
  value?: T
  handlers: HandlerEntry<T>[]
}

export interface SubscribeOptions {
  context?: object
}

export interface UnsubscribeOptions {
  keepValue?: boolean
  context?: object
}

export interface OnceOptions extends UnsubscribeOptions {
  timeout?: number
}

export default class LittlePubSub {
  subscribers: Map<string, Subscriber> = new Map()
  verbose: boolean

  constructor(verbose?: boolean) {
    this.verbose = verbose ?? false
  }

  hasSubscribers(event: string): boolean {
    return this.subscribers.has(event)
  }

  subscriberCount(event: string): number {
    return this.subscribers.get(event)?.handlers.length ?? 0
  }

  clear(): void {
    this.subscribers.clear()
  }

  getValue<T = any>(event: string): T | undefined {
    return this.subscribers.get(event)?.value
  }

  subscribe<T = any>(
    event: string,
    handler: Handler<T>,
    options?: SubscribeOptions
  ): () => void {
    let subscriber = this.subscribers.get(event)
    if (subscriber === undefined) {
      subscriber = { handlers: [], value: undefined }
      this.subscribers.set(event, subscriber)
    }

    // Only bind if context is provided
    const context = options?.context
    const boundHandler = context
      ? (handler.bind(context) as Handler<T>)
      : handler

    subscriber.handlers.push({ original: handler, bound: boundHandler })

    // Call handler immediately if value already exists
    if (subscriber.value !== undefined) {
      boundHandler(subscriber.value, undefined)
    }

    // Return unsubscribe function
    return () => this.unsubscribe(event, handler, options)
  }

  unsubscribe<T = any>(
    event: string,
    handler: Handler<T>,
    options?: UnsubscribeOptions
  ): void {
    const subscriber = this.subscribers.get(event)
    if (subscriber === undefined) return

    const handlers = subscriber.handlers

    // Find and remove handler by original reference
    for (let i = 0, len = handlers.length; i < len; i++) {
      if (handlers[i].original === handler) {
        handlers.splice(i, 1)
        break
      }
    }

    // Delete event if no handlers left (unless keepValue is true)
    if (handlers.length === 0 && !options?.keepValue) {
      this.subscribers.delete(event)
    }
  }

  publish<T = any>(event: string, value: T, verbose?: boolean): void {
    let subscriber = this.subscribers.get(event)
    if (subscriber === undefined) {
      subscriber = { handlers: [], value: undefined }
      this.subscribers.set(event, subscriber)
    }

    const oldValue = subscriber.value

    // Only trigger handlers if verbose or value changed
    if (this.verbose || verbose || oldValue !== value) {
      subscriber.value = value
      const handlers = subscriber.handlers
      const len = handlers.length
      for (let i = 0; i < len; i++) {
        handlers[i].bound(value, oldValue)
      }
    }
  }

  publishVerbose<T = any>(event: string, value: T): void {
    this.publish(event, value, true)
  }

  once<T = any>(event: string, options?: OnceOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined

      const handler: Handler<T> = (value) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId)
        resolve(value)
        this.unsubscribe(event, handler, options)
      }

      this.subscribe(event, handler, options)

      if (options?.timeout !== undefined) {
        timeoutId = setTimeout(() => {
          this.unsubscribe(event, handler, options)
          reject(new Error(`Timeout waiting for event "${event}"`))
        }, options.timeout)
      }
    })
  }
}
