/* little-pubsub version 0.2.5 */
'use strict';

const ENVIRONMENT = {version: '0.2.5', production: true};

class PubSub {

  /**
   * Creates handlers
   */
  constructor() {
    this.subscribers = {};
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
    this.subscribers[event] = this.subscribers[event] || { handlers: [], value: null};
    this.subscribers[event].handlers.push(handler.bind(context));
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
    const index = this.subscribers[event].handlers.indexOf(handler.bind(context));
    this.subscribers[event].handlers.splice(index);
    if (this.subscribers[event].handlers.length === 0) delete this.subscribers[event];
  }

  /**
   * @param {String} event
   * @param {String|Number|Boolean|Object|Array} change
   */
  publish(event, change) {
    if (this.subscribers[event] && this.subscribers[event].value !== change) {
      this.subscribers[event].handlers.forEach(handler => {
        handler(change, this.subscribers[event].value);
      });
      this.subscribers[event].value = change;
    }
  }
}

module.exports = PubSub;
