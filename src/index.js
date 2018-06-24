export default class PubSub {

  /**
   * Creates handlers
   */
  constructor() {
    this.subscribers = {};
    this.values = [];
  }

  /**
   * @param {String} event
   * @param {Method} handler
   * @param {HTMLElement} context
   */
  subscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    this.subscribers[event] = this.subscribers[event] || { handlers: []};
    this.subscribers[event].handlers.push(handler.bind(context))
  }

  /**
   * @param {String} event
   * @param {Method} handler
   * @param {HTMLElement} context
   */
  unsubscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    const i = this.subscribers[event].handlers.indexOf(handler.bind(context));
    this.subscribers[event].handlers.splice(i);
  }

  /**
   * @param {String} event
   * @param {String|Number|Boolean|Object|Array} change
   */
  publish(event, change) {
    if (this.subscribers[event]) this.subscribers[event].handlers.forEach(handler => {
      if (this.values[event] !== change)
        handler(change, this.values[event])
        this.values[event] = change;
      });
  }
}
