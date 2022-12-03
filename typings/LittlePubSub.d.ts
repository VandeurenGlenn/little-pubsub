declare interface littlePubSub {
  subscribers: {}
  verbose: boolean

  hasSubscribers(event: string): boolean
  
  /**
   * @param {String|Number} event
   * @param {Function} handler
   * @param {Function} context
   */
   subscribe(event: string, handler: Function, context: Function): void

   /**
   * @param {String} event
   * @param {Function} handler
   * @param {Function} context
   */
  unsubscribe(event: string, handler: Function, context: Function): void

  /**
   * @param {String} event
   * @param {String|Number|Boolean|Object|Array} change
   */
   publish(event: string, change: string | boolean | object | Array<any>): void

   /**
    * 
    * @param {String|Number} event
    */
   once(event: string): Promise<string | number | boolean | object | Array<any>>
}

declare module '@vandeurenglenn/little-pubsub' {
  export default littlePubSub
}