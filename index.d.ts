export default class LittlePubSub {
    subscribers: {
        [index: string]: {
            value?: any;
            handlers?: Function[];
        };
    };
    verbose: boolean;
    constructor(verbose?: boolean);
    _handleContext(handler: Function, context?: Function): Function;
    hasSubscribers(event: string): boolean;
    subscribe(event: string, handler: Function, context?: Function): void;
    unsubscribe(event: string, handler: Function, context?: Function): void;
    publish(event: string, value: string | number | boolean | object | Array<any>, verbose?: boolean): void;
    publishVerbose(event: string, value: string | number | boolean | object | Array<any>): void;
    once(event: string): Promise<string | number | boolean | object | Array<any>>;
}
