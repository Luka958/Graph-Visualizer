// source: https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
// these functions are enabling JSON.stringify() and JSON.parse() to work with Map objects
// second argument for JSON.stringify()
function replacer(key, value) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    }
    return value;
}

// second argument for JSON.parse()
function reviver(key, value) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

export { replacer, reviver }