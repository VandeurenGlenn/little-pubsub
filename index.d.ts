export default class LittlePubSub {
    subscribers: {};
    verbose: boolean;
    constructor(verbose?: boolean);
    _handleContext(handler: Function, context?: Function): Function;
    hasSubscribers(event: string): boolean;
    subscribe(event: string, handler: Function, context?: Function): void;
    unsubscribe(event: string, handler: Function, context?: Function): void;
    publish(event: string, change: string | number | boolean | object | Array<any>): void;
    once(event: string): Promise<string | number | boolean | object | Array<any>>;
}
