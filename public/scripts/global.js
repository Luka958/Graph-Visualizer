/**
 * @typedef {Object} _ lodash - library
 */

const SVG_CANVAS = document.querySelector('.canvas');
const SVG_CANVAS_BOUNDS = SVG_CANVAS.getBoundingClientRect();
const SVG_NS_URI = 'http://www.w3.org/2000/svg';
const ADDITIONAL_CANVAS_OFFSET_X = 5;
const ADDITIONAL_CANVAS_OFFSET_Y = 5;

function isPointWithinSVGCanvas(x, y) {
    return !(x < SVG_CANVAS_BOUNDS.left || x > SVG_CANVAS_BOUNDS.right - ADDITIONAL_CANVAS_OFFSET_X ||
        y < SVG_CANVAS_BOUNDS.top || y > SVG_CANVAS_BOUNDS.bottom - ADDITIONAL_CANVAS_OFFSET_Y);
}

function setVisible(element) {
    element.style.visibility = 'visible';
}

function setInvisible(element) {
    element.style.visibility = 'hidden';
}

function setClickable(element) {
    element.style.pointerEvents = 'none';
}

function setNonClickable(element) {
    element.style.pointerEvents = 'auto';
}