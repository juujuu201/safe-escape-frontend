const eventBus = {
    listeners: {},

    on(key, cb) {
        if (!this.listeners[key]) this.listeners[key] = new Set();
        this.listeners[key].add(cb);
    },

    off(key, cb) {
        this.listeners[key]?.delete(cb);
        if (this.listeners[key]?.size === 0) delete this.listeners[key];
    },

    emit(key, data) {
        this.listeners[key]?.forEach(cb => cb(data));
    },
};

export default eventBus;