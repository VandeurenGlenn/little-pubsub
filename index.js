class LittlePubSub {
    subscribers = {};
    verbose;
    constructor(verbose) {
        this.verbose = verbose;
    }
    _handleContext(handler, context) {
        if (typeof context === 'undefined') {
            context = handler;
        }
        return context;
    }
    hasSubscribers(event) {
        return this.subscribers[event] ? true : false;
    }
    subscribe(event, handler, context) {
        if (!this.hasSubscribers(event))
            this.subscribers[event] = { handlers: [], value: undefined };
        context = this._handleContext(handler, context);
        this.subscribers[event].handlers.push(handler.bind(context));
    }
    unsubscribe(event, handler, context) {
        if (!this.hasSubscribers(event))
            return;
        context = this._handleContext(handler, context);
        const index = this.subscribers[event].handlers.indexOf(handler.bind(context));
        this.subscribers[event].handlers.splice(index);
        if (this.subscribers[event].handlers.length === 0)
            delete this.subscribers[event];
    }
    publish(event, change) {
        if (this.verbose && this.hasSubscribers(event) || this.subscribers?.[event].value !== change) {
            this.subscribers[event].value = change;
            this.subscribers[event].handlers.forEach((handler) => {
                handler(change, this.subscribers[event].value);
            });
        }
    }
    once(event) {
        return new Promise((resolve) => {
            const cb = (value) => {
                this.unsubscribe(event, cb);
                resolve(value);
            };
            this.subscribe(event, cb);
        });
    }
}

export { LittlePubSub as default };
