export default class LittlePubSub {
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
    getValue(event) {
        if (this.subscribers[event])
            return this.subscribers[event].value;
        return undefined;
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
    publish(event, value, verbose) {
        // always set value even when having no subscribers
        if (!this.hasSubscribers(event))
            this.subscribers[event] = {
                handlers: []
            };
        const oldValue = this.subscribers[event]?.value;
        if (this.verbose || verbose || oldValue !== value) {
            this.subscribers[event].value = value;
            for (const handler of this.subscribers[event].handlers) {
                handler(value, oldValue);
            }
        }
    }
    publishVerbose(event, value) {
        this.publish(event, value, true);
    }
    once(event) {
        return new Promise((resolve) => {
            const cb = (value) => {
                resolve(value);
                this.unsubscribe(event, cb);
            };
            this.subscribe(event, cb);
        });
    }
}
