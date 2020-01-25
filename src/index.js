import classIs from 'class-is';

export default classIs(class LittlePubSub {

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
    if (this.subscribers[event]) {
      const index = this.subscribers[event].handlers.indexOf(handler.bind(context));
      this.subscribers[event].handlers.splice(index);
      if (this.subscribers[event].handlers.length === 0) delete this.subscribers[event];  
    }
    
  }

  /**
   * @param {String} event
   * @param {String|Number|Boolean|Object|Array} change
   */
  publish(event, change) {
    if (this.subscribers[event] && this.subscribers[event].value !== change) {
      this.subscribers[event].handlers.forEach(handler => {
        handler(change, this.subscribers[event].value)
      })
      this.subscribers[event].value = change;
    }
  }
}, {
  className: 'LittlePubSub',
  symbolName: 'little-pubsub/index'
})
