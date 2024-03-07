export const insertGraphRadius = 230;
export const insertGraphCenter = (leftOffset, topOffset, width, height) => {
    return [leftOffset + width / 2, topOffset + height / 2 - 25];
}
export const clickOptions = {
    'view': window,
    'bubbles': true,    // the event is going up through the DOM tree
    'cancelable': true, // event can be canceled
    'clientX': undefined,
    'clientY': undefined
}