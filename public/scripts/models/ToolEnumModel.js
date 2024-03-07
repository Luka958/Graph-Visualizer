const Tool = {
    UNDEFINED: 0,
    DRAW_VERTEX: 1,
    DRAW_EDGE: 2,
    MOVE: 3,
    ROTATE: 4,
    CLEAR: 5,
    DELETE: 6,
    DIRECTION: 7,
    WEIGHT: 8,
    SHRINK: 9,
    EXPAND: 10,
    SCREENSHOT: 11,
    SKETCH: 12,
    COLOR: 13
};
Object.freeze(Tool);
// simulating enumeration in javascript by freezing an object
// because it isn't supported natively


// source: https://stackoverflow.com/questions/1759987/listening-for-variable-changes-in-javascript
// listening for a variable to change in order to make code more readable and less redundant
const toolActive = {
    currentInternal: 0,     // default values
    previousInternal: null,

    currentListener: function(val) {},
    set current(val) {
        this.previousInternal = this.currentInternal;
        this.currentInternal = val;
        this.currentListener(val);
    },
    get current() {
        return this.currentInternal;
    },
    get previous() {
        return this.previousInternal;
    },
    registerListener: function(listener) {
        this.currentListener = listener;
    }
}

export { Tool, toolActive };