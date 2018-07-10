/* little-pubsub version 0.2.3 */
'use strict';

const ENVIRONMENT = {version: '0.2.3', production: true};

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
    const i = this.subscribers[event].handlers.indexOf(handler.bind(context));
    this.subscribers[event].handlers.splice(i);
  }

  /**
   * @param {String} event
   * @param {String|Number|Boolean|Object|Array} change
   */
  publish(event, change) {
    if (this.subscribers[event] && this.values[event] !== change)
      this.subscribers[event].handlers.forEach(handler => {
        handler(change, this.values[event]);
        this.values[event] = change;
      });
  }
}

module.exports = PubSub;
