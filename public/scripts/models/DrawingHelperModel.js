// browser angle is 0 at 3 o'clock while CSS transform angle is at 12 o'clock,
// so adjustments are needed when combining these two approaches
const BROWSER_VS_CSS_OFFSET = 270;
const ROTATE_CIRCLE_OFFSET = 15;
const TEXT_Y_OFFSET = 1.8;
const TEXT_R_L_OFFSET = 2.5;
const PATH_DIFFERENTIAL = 0.01;

// regular expressions for 'd' attribute of the SVG elements
const PATH_START_REGEX = new RegExp(/M\s\d+(\.\d+)?\s\d+(\.\d+)?\s/);  // path's first coordinate
const FLOAT_REGEX = new RegExp(/[+-]?\d+(\.\d+)?/);
const LINE_REGEX = getLineRegex();
const LOOP_REGEX = getLoopRegex();
const ARROW_REGEX = getArrowRegex();
const HELP_TRIANGLE_REGEX = getHelpTriangleRegex();

function concatRegExp(exp1, exp2) {     // source : https://masteringjs.io/tutorials/fundamentals/concat-regexp
    let flags = exp1.flags + exp2.flags;
    flags = Array.from(new Set(flags.split(''))).join();
    return new RegExp(exp1.source + exp2.source, flags);
}

function getLineRegex() {
    let floatWithSpace = concatRegExp(FLOAT_REGEX, /\s/);
    let lineRegex = addRegexNTimes(/M\s/, floatWithSpace, 2);
    lineRegex = concatRegExp(lineRegex, /l\s/);
    lineRegex = concatRegExp(lineRegex, floatWithSpace);
    lineRegex = concatRegExp(lineRegex, FLOAT_REGEX);
    return lineRegex;
}

function getLoopRegex() {
    let floatWithSpace = concatRegExp(FLOAT_REGEX, /\s/);
    let loopRegex = addRegexNTimes(/M\s/, floatWithSpace, 2);
    let isLast = false;
    for (let i = 0; i < 4; i++) {
        if (i === 3) {
            isLast = true;
        }
        loopRegex = concatRegExp(loopRegex, /a\s/);
        loopRegex = addRegexNTimes(loopRegex, floatWithSpace, 7, isLast);
    }
    return loopRegex;
}

function getArrowRegex() {
    let floatWithSpace = concatRegExp(FLOAT_REGEX, /\s/);
    let loopRegex = addRegexNTimes(/M\s/, floatWithSpace, 2);
    let isLast = false;
    for (let i = 0; i < 5; i++) {
        if (i === 4) {
            isLast = true;
        }
        loopRegex = concatRegExp(loopRegex, /l\s/);
        loopRegex = addRegexNTimes(loopRegex, floatWithSpace, 2, isLast);
    }
    return loopRegex;
}

function getHelpTriangleRegex() {
    let floatWithSpace = concatRegExp(FLOAT_REGEX, /\s/);
    // help triangle is similar to an arrow, but it has one more letter 'l' and two floats
    let loopRegex = getArrowRegex();
    loopRegex = concatRegExp(loopRegex, /\sl\s/);
    loopRegex = concatRegExp(loopRegex, floatWithSpace);
    loopRegex = concatRegExp(loopRegex, FLOAT_REGEX);
    return loopRegex;
}

function addRegexNTimes(source, addition, n, isLast) {
    for (let i = 0; i < n; i++) {
        if (isLast && (i === (n - 1))) {
            addition = FLOAT_REGEX;
        }
        source = concatRegExp(source, addition);
    }
    return source;
}

/**
 * @returns array of all elements in drawing canvas instead of NodeList
 */
function getAll(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
function getAllVertices() { return getAll('[id^="vertex-id-"]'); }
function getAllEdges() { return getAll('[id^="edge-id-"]'); }
function getAllTexts() { return getAll('[id^="text-id-"]'); }
function getAllArrows() { return getAll('[id^="arrow-id-"]'); }
function getAllWeightItems() { return getAll('[id^="weight-item-id-"]'); }
function getAllWeightTexts() { return getAll('[id^="weight-text-id-"]'); }

function getVertexFromID(id) { return document.querySelector(`#vertex-id-${ id }`); }
function getEdgeFromID(id) { return document.querySelector(`#edge-id-${ id }`); }
function getTextFromID(id) { return document.querySelector(`#text-id-${ id }`); }
function getArrowFromID(id) { return document.querySelector(`#arrow-id-${ id }`); }
function getWeightItemFromID(id) { return document.querySelector(`#weight-item-id-${ id }`); }
function getWeightTextFromID(id) { return document.querySelector(`#weight-text-id-${ id }`); }
function getWeightInputFromID(id) { return document.querySelector(`#weight-table-input-${ id }`); }
function getDeleteEdgeFromID(id) { return document.querySelector(`#delete-edge-id-${ id }`); }

function getIDFromVertex(el) { return parseInt(el.getAttribute('id').split('vertex-id-')[1]); }
function getIDFromEdge(el) { return parseInt(el.getAttribute('id').split('edge-id-')[1]); }
function getIDFromText(el) { return parseInt(el.getAttribute('id').split('text-id-')[1]); }
function getIDFromArrow(el) { return parseInt(el.getAttribute('id').split('arrow-id-')[1]); }
function getIDFromWeightText(el) { return parseInt(el.getAttribute('id').split('weight-text-id-')[1]); }

function loopToVertex(loop) {
    return getVertexFromID(parseInt(loop.getAttribute('CA-connection').split(',')[0]));
}

function getPointsFromLine(line) {
    let d = line.getAttribute('d').split(' ');
    return [parseFloat(d[1]), parseFloat(d[2]), parseFloat(d[4]), parseFloat(d[5])];
}

function getPointsFromArc(arc) {
    let d = arc.getAttribute('d').split(' ');
    return [parseFloat(d[1]), parseFloat(d[2]), parseFloat(d[6]), parseFloat(d[7])];
}

function getConnection(edge) {
    return edge.getAttribute('CA-connection').split(',').map(id => parseInt(id));
}

function getConnectionCount(v1ID, v2ID) {
    return getAllEdges().filter(edge => _.sortBy(getConnection(edge)) === _.sortBy([v1ID, v2ID])).length;
}

function getCenter(vertex) {
    return {
        x: parseFloat(vertex.getAttribute('CA-center-x')),
        y: parseFloat(vertex.getAttribute('CA-center-y'))
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function getDistance(p, q) {
    return Math.sqrt(Math.pow(q.x - p.x, 2) + Math.pow(q.y - p.y, 2));
}

function getAngleFromSlope(p, q) {
    let angle = Math.atan2(p.y - q.y, p.x - q.x);
    if (angle < 0) angle += 2 * Math.PI;
    return angle % (2 * Math.PI);
}

/**
 * get angle from 3 points where one of them is the origin (0,0) of coordinate system,
 * while coordinates of other points (p and q) are relative to the origin
 * @param p
 * @param q
 * @returns {number}
 */
function getAngleFrom3Points(p, q) {
    return Math.acos((p.x * q.x + p.y * q.y) / (
            Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2)) * 
            Math.sqrt(Math.pow(q.x, 2) + Math.pow(q.y, 2))
    ));
}

function normalize(angle) {
    if (angle < 0) angle += 2 * Math.PI;
    return angle % (2 * Math.PI);
}

function getPointOnCircle(p1, p2, angle) {
    angle += BROWSER_VS_CSS_OFFSET;    // difference between JS and CSS
    angle < 0 ? angle %= 360 : undefined;
    angle *= Math.PI / 180;
    let d = getDistance(p1, p2);
    return new Point(d * Math.cos(angle) + p1.x, d * Math.sin(angle) + p1.y);
}

/**
 * get specific point on given path
 * @param path
 * @param lengthDivisor - ex. if it is 2, returned point will be at the half of total length
 * @returns {Point}
 */
function getPartOfPath(path, lengthDivisor) {
    const p = path.getPointAtLength(path.getTotalLength() / lengthDivisor);
    return new Point(p.x, p.y);
}

/**
 * rotates relative part of the SVG 'd' attribute
 * @param el - 'd' attribute of an element must contain lowercase 'l' (relative lineTo)
 * letters followed by two numbers only
 * @param angle - angle in radians
 * @returns {string}
 */
function rotateLineElement(el, angle) {
    let arr1 = el.getAttribute('d').trim().split(' ');
    let arr2 = [];
    arr1 = _.drop(arr1, 3);   // remove first 3 elements from an array

    console.assert(arr1.length % 3 === 0);
    for (let i = 0; i < arr1.length; i++) {
        if ((i + 1) % 3 === 1) {
            // arr1[i] is 'l'
            arr2[i] = arr1[i];
        }
        else if ((i + 1) % 3 === 2) {
            // arr1[i] is x-axis coordinate
            arr2[i] = (arr1[i] * Math.cos(angle) - arr1[i + 1] * Math.sin(angle)).toString();
        }
        else {
            // arr1[i] is y-axis coordinate
            arr2[i] = (arr1[i - 1] * Math.sin(angle) + arr1[i] * Math.cos(angle)).toString();
        }
    }
    return arr2.join(' ');
}

function rotateLoopElement(el, angle) {
    let d = el.getAttribute('d');

    console.assert(d.match(LOOP_REGEX)[0] === d);
    let arr1 = d.split(' ');
    let arr2 = [];
    arr1 = _.drop(arr1, 3);   // remove first 3 elements from an array

    console.assert(arr1.length % 8 === 0);
    for (let i = 0; i < arr1.length; i++) {
        if (1 <= ((i + 1) % 8) && ((i + 1) % 8) <= 6) {
            // arr1[i] is 'l'
            arr2[i] = arr1[i];
        }
        else if ((i + 1) % 8 === 7) {
            // arr1[i] is x-axis coordinate
            // toFixed(4) - rounding on four decimals in order to avoid scientific notation (avoid
            // console.assert error when comparing the 'd' attribute with the regex)
            arr2[i] = (arr1[i] * Math.cos(angle) - arr1[i + 1] * Math.sin(angle)).toFixed(4).toString();
        }
        else if ((i + 1) % 8 === 0) {
            // arr1[i] is y-axis coordinate
            arr2[i] = (arr1[i - 1] * Math.sin(angle) + arr1[i] * Math.cos(angle)).toFixed(4).toString();
        }
    }
    return arr2.join(' ');
}

function getRestOfRegex(el) {
    let d = el.getAttribute('d').trim();
    let elStart = d.match(PATH_START_REGEX)[0];
    return d.replace(elStart, '');
}

/**
 * checking whether two arrays have the only one common element
 * @param arr1
 * @param arr2
 * @returns {number}
 */
function countCommonElements(arr1, arr2) {
    let count = 0;
    arr1.forEach(el1 =>  arr2.forEach(el2 => { if (el1 === el2) count++; }));
    return count;
}

/**
 * calculates n points of polygon from given coordinates and returns them as a string
 * @param x - cursor coordinate
 * @param y - cursor coordinate
 * @param a - polygon base
 * @param n - number of angles
 * @returns {string} points are separated by comma
 */
let findPolygonPoints = (x, y, a, n) => {
    let beta = (2 * Math.PI) / n;
    let r = a / (2 * Math.sin(beta / 2));
    let points = "";

    for (let i = 0; i < n; i++) {
        let theta = -Math.PI / 2 + (2 * Math.PI * i) / n;
        points += `${(x + r * Math.cos(theta)) + ',' +
        (y + r * Math.sin(theta)) + ' '}`;
    }
    return points;
}

let moveLoop = (edge, relativeX, relativeY) => {
    let edgeStart = edge.getAttribute('d').match(PATH_START_REGEX)[0];
    let edgeRest = edge.getAttribute('d').replace(edgeStart, '');
    edge.setAttribute('d', `M ${ relativeX } ${ relativeY } ` + edgeRest);
}

/**
 * updates arrow position right after the arrow was created
 * for both types of edges (line and loop)
 */
let updateArrowOnCreate = (id) => {
    let arrow = getArrowFromID(id);
    let edge = getEdgeFromID(id);
    let p = getPartOfPath(edge, 2);
    let q = getPartOfPath(edge, 2 + PATH_DIFFERENTIAL);
    let angle = normalize(Math.atan2(p.y - q.y, p.x - q.x));
    // if we are in 1st or 4th quadrant, we have to add PI, otherwise
    // an arrow would be pointed in the wrong direction
    if ((0 <= angle <= Math.PI) || (((3 * Math.PI) / 2) <= angle <= (2 * Math.PI))) {
        angle += Math.PI;
    }
    angle %= 2 * Math.PI;

    arrow.setAttribute('d', `M ${ p.x } ${ p.y } ` + rotateLineElement(arrow, angle));
    arrow.setAttribute('prev-angle', angle.toString());
}

let updateArrowOnLineMove = (id, isWeighted) => {
    let p, q;
    let edge = getEdgeFromID(id);
    let arrow = getArrowFromID(id);

    if (isWeighted) {
        p = getPartOfPath(edge, 4);
        q = getPartOfPath(edge, 4 + PATH_DIFFERENTIAL);
    } else {
        p = getPartOfPath(edge, 2);
        q = getPartOfPath(edge, 2 + PATH_DIFFERENTIAL);
    }
    let angle = normalize(Math.atan2(p.y - q.y, p.x - q.x));
    if ((0 <= angle <= Math.PI) || (((3 * Math.PI) / 2) <= angle <= (2 * Math.PI))) {
        angle += Math.PI;
        angle %= 2 * Math.PI;
    }
    let diff = 0;
    let prevAngle = arrow.getAttribute('prev-angle');
    if (prevAngle !== null) {
        diff = angle - parseFloat(prevAngle);
    }
    arrow.setAttribute('d', `M ${ p.x } ${ p.y } ` + rotateLineElement(arrow, diff));
    arrow.setAttribute('prev-angle', angle.toString());
}

/**
 * updates arrow position if edge is a loop
 */
let updateArrowOnLoopMove = (id, isDirected, isWeighted) => {
    let p;
    let edge = getEdgeFromID(id);
    let arrow = getArrowFromID(id);

    isDirected && isWeighted ? p = getPartOfPath(edge, 4) : p = getPartOfPath(edge, 2);

    let arrowStart = arrow.getAttribute('d').match(PATH_START_REGEX)[0];
    let arrowEnd = arrow.getAttribute('d').replace(arrowStart, '');
    arrow.setAttribute('d', `M ${ p.x } ${ p.y } ` + arrowEnd);
}

let rotateLoopSetup = (vertex, edge) => {
    // coordinates of center of any shape
    let x = 0, y = 0;
    let r = ROTATE_CIRCLE_OFFSET;  // radius for helper circle
    let shape = vertex.getAttribute('shape');
    let id = getIDFromVertex(vertex);

    switch (shape) {
        case 'circle':
            r += parseFloat(vertex.getAttribute('r'));
            x = parseFloat(vertex.getAttribute('cx'));
            y = parseFloat(vertex.getAttribute('cy'));
            break;
        case 'square':
            let width = parseFloat(vertex.getAttribute('width'));
            r += (width * Math.sqrt(2)) / 2;
            x = parseFloat(vertex.getAttribute('x')) + width / 2;
            y = parseFloat(vertex.getAttribute('y')) + width / 2;
            break;
        case 'rectangle':
            let width2 = parseFloat(vertex.getAttribute('width'));
            let height = parseFloat(vertex.getAttribute('height'));
            x = parseFloat(vertex.getAttribute('x')) + width2 / 2;
            y = parseFloat(vertex.getAttribute('y')) + height / 2;
            r += (Math.sqrt(
                Math.pow(width2, 2) +
                Math.pow(height, 2)
            )) / 2;
            break;
        case 'triangle':
            r += (Math.sqrt(3) / 3) * parseFloat(vertex.getAttribute('polygon-base'));
            break;
        case 'polygon':
            let alpha = (2 * Math.PI) / parseFloat(vertex.getAttribute('number-of-angles'));
            r += parseFloat(vertex.getAttribute('polygon-base')) / (2 * Math.sin(alpha / 2));
            break;
    }

    if (shape === 'polygon' || shape === 'triangle') {
        let n = parseFloat(vertex.getAttribute('number-of-angles'));
        let points = vertex.getAttribute('points').replaceAll(',', ' ').split(' ');

        points = points.filter(point => { return point !== '' });
        points = points.map(point => { return parseFloat(point) });

        for (let i = 0; i < points.length; i++) {
            i % 2 === 0 ? x += points[i] : y += points[i];
        }
        x /= n;
        y /= n;
    }
    let helpCircle = document.createElementNS(SVG_NS_URI, 'circle');
    let attrs = ['id', 'cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray'];
    let values = [`circle-rotate-${ id }`, `${ x }`, `${ y }`, `${ r }`,'none', 'midnightblue', '1', '2'];
    for (let i = 0; i < attrs.length; i++) {
        helpCircle.setAttribute(attrs[i], values[i]);
    }
    let helpTriangle = document.createElementNS(SVG_NS_URI, 'path');
    attrs = ['id', 'fill', 'stroke', 'stroke-width', 'd'];
    values = [
        `triangle-rotate-${ id }`,
        'none', 'midnightblue', '5',
        `M ${ x } ${ y - r } l 0 -5.196 l 6 0 l -6 10.39 l -6 -10.39 l 12 0 l -6 10.39`
    ];
    for (let i = 0; i < attrs.length; i++) {
        helpTriangle.setAttribute(attrs[i], values[i]);
    }

    // 'prev-angle' is set in rotateLoop (if the loop gets rotated by rotate tool)
    let angle = edge.getAttribute('prev-angle');
    if (angle !== null) {
        let edgeStart = edge.getAttribute('d').trim().match(PATH_START_REGEX)[0];
        edgeStart = edgeStart.trim().split(' ');
        edgeStart = new Point(parseFloat(edgeStart[1]), parseFloat(edgeStart[2]));

        helpTriangle.setAttribute('d',
            `M ${r * Math.cos(angle) + edgeStart.x} ${r * Math.sin(angle) + edgeStart.y} ` +
            rotateLineElement(helpTriangle, angle - 3 / 2 * Math.PI)
        );
    }
    return [helpCircle, helpTriangle];
}

let rotateLoop = (id, clientX, clientY, helpTriangle, helpCircle, isDirected, isWeighted) => {
    let edge = getEdgeFromID(id);
    let center = edge.getPointAtLength(0);
    let p = new Point(clientX, clientY);
    let q = new Point(center.x, center.y);
    let r = parseFloat(helpCircle.getAttribute('r'));

    let angle = normalize(Math.atan2(p.y - q.y, p.x - q.x));

    let diff;
    let prevAngle = edge.getAttribute('prev-angle');
    if (prevAngle === null) {
        p = getPartOfPath(edge, 2)
        let angle2 = Math.atan2(p.y - q.y, p.x - q.x);
        if (angle2 < 0) angle2 += 2 * Math.PI;
        angle2 %= 2 * Math.PI;
        diff = angle - angle2;
    }
    else {
        diff = angle - parseFloat(prevAngle);
    }
    edge.setAttribute('d', edge.getAttribute('d').trim().match(PATH_START_REGEX)[0] + rotateLoopElement(edge, diff));
    edge.setAttribute('prev-angle', angle.toString());

    let edgeStart = edge.getAttribute('d').trim().match(PATH_START_REGEX)[0];
    edgeStart = edgeStart.trim().split(' ');
    edgeStart = new Point(parseFloat(edgeStart[1]), parseFloat(edgeStart[2]));

    helpTriangle.setAttribute('d',
        `M ${ r * Math.cos(angle) + edgeStart.x } ${ r * Math.sin(angle) + edgeStart.y } ` +
        rotateLineElement(helpTriangle, diff)
    );

    if (isDirected) {
        let arrow = getArrowFromID(id);
        let p = getPartOfPath(edge, 2);
        let angle2 = normalize(Math.atan2(p.y - q.y, p.x - q.x));

        let diff = 0;
        let prevAngle = arrow.getAttribute('prev-angle');
        if (prevAngle !== null) {
            diff = angle2 - parseFloat(prevAngle);
        }
        if (isWeighted) {
            let t = getPartOfPath(edge, 4);
            let q = edge.getPointAtLength(0);
            q = new Point(q.x, q.y);
            t.x -= q.x;
            t.y -= q.y;
            q.x = q.y = 0;

            diff = getAngleFromSlope(q, t);
            if (prevAngle !== null) {
                diff -= parseFloat(prevAngle);
            }
            diff = (diff + Math.PI) % (2 * Math.PI);
            p = getPartOfPath(edge, 4);
            angle2 = normalize(Math.atan2(t.y - q.y, t.x - q.x));
        }
        arrow.setAttribute('d', `M ${ p.x } ${ p.y } ` + rotateLineElement(arrow, diff));
        arrow.setAttribute('prev-angle', angle2.toString());
    }
}

/**
 * rotate arrow for 180 degrees
 * @param id
 */
let changeArrowDirection = (id) => {
    let arrow = getArrowFromID(id);
    let arrowStart = arrow.getAttribute('d').trim().match(PATH_START_REGEX)[0];
    arrow.setAttribute('d', arrowStart + rotateLineElement(arrow, Math.PI));
}

let getWeightSpans = () => {
    let span1 = document.createElement('span');
    span1.innerHTML = 'Edge id';
    let span2 = document.createElement('span');
    span2.innerHTML = 'Weight';

    return [span1, span2];
}

let getWeightInputs = (id, weight) => {
    let label = document.createElement('label');
    label.setAttribute('id', `weight-table-label-${ id }`);
    label.innerHTML = id;

    let input = document.createElement('input');
    input.setAttribute('id', `weight-table-input-${ id }`);
    input.setAttribute('type', 'number');
    input.setAttribute('min', '0');
    input.setAttribute('oninput', 'validity.valid||(value=\'\');');
    input.setAttribute('value', weight);
    input.style.textAlign = 'center';
    input.style.fontFamily = 'EncodeSans-Regular, serif';

    return [label, input];
}

/**
 * center of the straight line, works only for the paths
 * @param edgeID
 * @returns {Point}
 */
let getLineCenter = (edgeID) => {
    let svg = getEdgeFromID(edgeID);
    let SVGPoint = getPartOfPath(svg, 2);
    return new Point(SVGPoint.x, SVGPoint.y);
}

/**
 *  half of the loop length, not geometric center
 * @param edgeID
 * @returns {Point}
 */
let getLoopCenter = (edgeID) => {
    let svg = getEdgeFromID(edgeID);
    let SVGPoint = getPartOfPath(svg, 2);
    let transform = svg.getAttribute('transform');

    if (transform === null) return new Point(SVGPoint.x, SVGPoint.y);
    let angle = parseFloat(transform.match(/-*\d+\.*\d*/)[0]);
    let p1 = svg.getPointAtLength(0);  // vertex center (beginning of the loop)
    let p2 = getPartOfPath(svg, 2);    // loop center

    return getPointOnCircle(p1, p2, angle);
}

let addWeightText = (edgeID, weight, isLine) => {
    let point;
    isLine === true ? point = getLineCenter(edgeID) : point = getLoopCenter(edgeID);

    let weightText = document.createElementNS(SVG_NS_URI, 'text');
    let properties = [
        "id", "x", "y", "dominant-baseline", "text-anchor",
        "font-size", "font-weight", "fill", "pointer-events"
    ];
    let values = [
        `weight-text-id-${ edgeID }`, `${ point.x }`, `${ point.y + TEXT_Y_OFFSET }`,
        "middle", "middle", "15px", "normal", "white", "none"
    ];
    for (let i = 0; i < properties.length; i++) {
        weightText.setAttribute(properties[i], values[i]);
    }
    weightText.style.userSelect = 'none';
    weightText.textContent = `${ edgeID };${ weight }`;
    return weightText;
}

let addWeightItem = (edgeID, weightText, fill, isLine) => {
    let weightItem = document.createElementNS(SVG_NS_URI, 'path');
    weightItem.setAttribute('id', `weight-item-id-${ edgeID }`);
    weightItem.setAttribute('fill', fill);

    let textLength, halfWidth;

    let resize = () => {
        textLength = weightText.getComputedTextLength();
        halfWidth = textLength / 2 + TEXT_R_L_OFFSET;
        if (halfWidth < 12.5) halfWidth = 12.5;

        let point = isLine === true ? getLineCenter(edgeID) : getLoopCenter(edgeID);

        weightItem.setAttribute('d', `M ${ point.x } ${ point.y } ` +
            `l 0 -12.5 l ${ halfWidth } 0 ` +
            `l 0 25 l ${ - halfWidth * 2 } 0 ` +
            `l 0 -25 l ${ halfWidth } 0`
        );
    }
    // setting weight item size for the first time
    resize();

    // setting weight item size whenever the weight gets changed
    const observer = new MutationObserver(() => resize());
    observer.observe(weightText, {
        characterData: false,
        attributes: false,
        childList: true,
        subtree: false
    });
    return weightItem;
}

let updateWeightOnMove = (id) => {
    let edge = getEdgeFromID(id);
    let wItem = getWeightItemFromID(id);
    let wText = getWeightTextFromID(id);
    let p = getPartOfPath(edge, 2);
    let matched = wItem.getAttribute('d').split(PATH_START_REGEX);

    wItem.setAttribute('d', `M ${ p.x } ${ p.y } ` + matched[matched.length - 1]);
    wText.setAttribute('x', p.x.toString());
    wText.setAttribute('y', (p.y + TEXT_Y_OFFSET).toString());
}

let moveArrowForWeight = (id, arrowBody) => {
    let arrow = getArrowFromID(id);
    let edge = getEdgeFromID(id);
    let p = getPartOfPath(edge, 4);

    if (edge.getAttribute('CA-type') === 'loop') {
        arrow.setAttribute('d', `M ${ p.x } ${ p.y } ` + arrowBody);

        let q = edge.getPointAtLength(0);
        // assigning new instance of the Point object because returned SVGPoint object is immutable
        q = new Point(q.x, q.y);
        // make p relative to q
        p.x -= q.x;
        p.y -= q.y;
        // set q as the origin of coordinate system in order to find proper angle
        q.x = q.y = 0;

        let angle = getAngleFromSlope(q, p);
        angle = (angle + Math.PI) % (2 * Math.PI);
        arrow.setAttribute('d', arrow.getAttribute('d').match(PATH_START_REGEX)[0] +
            rotateLineElement(arrow, angle)
        );
        arrow.setAttribute('prev-angle', angle.toString());
    }
    else {
        arrow.setAttribute('d', `M ${ p.x } ${ p.y } ` + getRestOfRegex(arrow));
    }
}

let removeWeights = (ids) => {
    ids.forEach(id => {
        let weightItem = getWeightItemFromID(id);
        let textItem = getWeightTextFromID(id);
        if (weightItem !== null) {
            weightItem.remove();
        }
        if (textItem !== null) {
            textItem.remove();
        }
    });
}

let getWeightData = (ids) => {
    let data = new Map();
    ids.forEach(id => {
        let weightInput = getWeightInputFromID(id);
        if (weightInput !== null) {
            data.set(id, weightInput.value === '' ? 0 : parseFloat(weightInput.value));
        }
    });
    return data;
}

let setWeightData = (data) => {
    data.forEach((weight, id) => getWeightTextFromID(id).textContent = `${ id };${ weight }`);
}

// -------- RECONSTRUCT IMPORT SECTION -------- //
// returns regex for provided name of the HTML element
function getHTMLRegex(name) {
    // regex must contain 'g', otherwise matchAll() won't work
    // [^>] is considered a character class, it matches everything other than '>'
    name = new RegExp(name.trim());
    // return new RegExp(/<path[^>]*><\/path>/g);
    let result = concatRegExp(/</, name);
    result = concatRegExp(result, /[^>]*>[^<]*<\//);
    result = concatRegExp(result, name);
    return concatRegExp(result, />/g);
}
// different layers in canvas (edges, vertices, text)
const LAYER_COUNT = 3;
// reconstruction of imported data
let recon = (imported) => {
    imported = imported.replaceAll('&lt;', '<');
    imported = imported.replaceAll('&gt;', '>');

    // has to be updated if we decide to add something else in the future
    let names = ['text', 'circle', 'polygon', 'rect', 'path'];
    let hasInnerHTML = ['text', 'path'];
    let regExps = names.map(name => getHTMLRegex(name));

    let items = [];
    regExps.forEach((regex, i) => {
        for (let match of imported.matchAll(regex)) {
            let name = '';
            name = names[i];    // initialized like this to avoid editor warning

            let customRegex = concatRegExp(new RegExp(/>[^<]*<\//g), new RegExp(name + '>'));
            let str = match[0]
                .replace('<' + name + ' ', '')
                .replace(customRegex, '')   // ('><\/' + name + '>', '') works only without value between ><
                .replaceAll('\\"', '"');

            let attrs = [];
            let values = [];
            // attributes are bounded by zero or one space and one quotation mark
            for (let attr of str.matchAll(/\s?[^"]*=/g)) {
                attrs.push(attr[0].replaceAll(' ', '').replaceAll('=', ''));
            }
            // values are bounded by two quotation marks
            for (let value of str.matchAll(/"(.*?)"/g)) {
                values.push(value[0].replaceAll('\"', ''));
            }
            console.assert(attrs.length === values.length);
            let item = document.createElementNS(SVG_NS_URI, name);
            for (let j = 0; j < attrs.length; j++) {
                item.setAttribute(attrs[j], values[j]);
            }
            if (hasInnerHTML.includes(item.tagName.toLowerCase())) {
                item.innerHTML = match[0]
                    .match(/>[^<]*</)[0]
                    .replace('<', '')
                    .replace('>', '');
            }
            items.push(item);
        }
    });
    // items must be sorted properly: 1. edges (path), 2. vertices (circle, polygon, rect), 3. text
    let temp = [];
    for (let i = 0; i < LAYER_COUNT; i++) {
        let arr = [];
        temp.push(arr);
    }
    for (let i = 0; i < items.length; i++) {
        let tagName = items[i].tagName.toLowerCase();
        if (tagName === 'path') {
            temp[0].push(items[i]);     // layer 1
        }
        else if (['circle', 'polygon', 'rect'].includes(tagName)) {
            temp[1].push(items[i]);     // layer 2
        }
        else {
            console.assert(tagName === 'text');
            temp[2].push(items[i]);     // layer 3
        }
    }
    items = [];
    temp.forEach(arr => arr.forEach(el => items.push(el)));
    return items;
}
// -------------------------------------------- //
/**
 * shrink vertex and save its original look before shrinking, so it can be
 * returned to the original state in the expand function, hide text
 * @param vertexObj
 * @param r
 * @returns {{}}
 */
let shrink = (vertexObj, r) => {
    let id = vertexObj.id;
    getTextFromID(id).style.visibility = 'hidden';

    let vertex = getVertexFromID(id);
    let name = vertex.tagName.toLowerCase();
    let originalLook = {};

    switch (name) {
        case 'circle':
            originalLook['r'] = vertex.getAttribute('r');
            vertex.setAttribute('r', r.toString());
            break;
        case 'rect':
            originalLook['width'] = vertex.getAttribute('width');
            originalLook['height'] = vertex.getAttribute('height');
            let ratio = parseFloat(originalLook['width']) / parseFloat(originalLook['height']);
            vertex.setAttribute('width', r.toString());
            vertex.setAttribute('height', `${ r / ratio }`);
            break;
        case 'polygon':
            originalLook['polygon-base'] = vertex.getAttribute('polygon-base');
            originalLook['points'] = vertex.getAttribute('points');
            let a = r.toString();
            let n = parseFloat(vertex.getAttribute('number-of-angles'));
            let x = 0, y = 0;
            originalLook['points'].trim().split(' ').forEach(point => {
                point = point.split(',');
                x += parseFloat(point[0]);
                y += parseFloat(point[1]);
            });
            x /= n;
            y /= n;
            vertexObj.SVG['polygon-base'] = a;
            vertex.setAttribute('polygon-base', a);
            vertex.setAttribute('points', vertexObj.SVG['points'] = findPolygonPoints(x, y, a, n));
            break;
    }
    return originalLook;
}

/**
 * restore vertex's look before shrinking, make text visible again
 * @param originalLookMap
 */
let expand = (originalLookMap) => {
    originalLookMap.forEach((originalLook, vertexObj) => {
        let attrs = Object.keys(originalLook);
        let values = Object.values(originalLook);

        console.assert(attrs.length === values.length);
        let vertex = getVertexFromID(vertexObj.id);
        let text = getTextFromID(vertexObj.id);

        for (let i = 0; i < attrs.length; i++) {
            // update object's SVG attribute
            vertexObj.SVG[`${ attrs[i] }`] = values[i];
            // update SVG itself
            vertex.setAttribute(`${ attrs[i] }`, values[i].toString());
        }
        text.style.visibility = 'visible';
    });
}

let createFace = (polygon, vertices, fill) => {
    const points = polygon.map(coordinates => coordinates.join(',')).join(' ');
    const face = document.createElementNS(SVG_NS_URI, 'polygon');

    face.setAttribute('class', 'face');
    face.setAttribute('fill', fill);
    face.setAttribute('points', points);
    face.setAttribute('vertices', vertices.join(','));

    return face;
}

let restore = (elements) => {
    if (elements !== null && elements !== undefined) {
        elements.forEach(el => {
            SVG_CANVAS.removeChild(el);
            SVG_CANVAS.appendChild(el);
        });
    }
}

let restoreAll = () => {
    restore(getAllEdges());
    restore(getAllArrows());
    restore(getAllWeightItems());
    restore(getAllWeightTexts());
    restore(getAllVertices());
    restore(getAllTexts());
};

let toggleButtonsExcept = (affectedButtons, nonAffectedButtons) => {
    const diff = _.difference(affectedButtons, nonAffectedButtons);
    const activate = () => diff.forEach(btn => setClickable(btn));
    const deactivate = () => diff.forEach(btn => setNonClickable(btn));

    return { activate, deactivate }
};

export {
    getAll, getAllVertices, getAllEdges,
    getVertexFromID, getEdgeFromID, getTextFromID, getArrowFromID, getWeightItemFromID,  getWeightTextFromID,
    getIDFromVertex, getIDFromEdge, getIDFromText, getIDFromArrow, getIDFromWeightText, getDeleteEdgeFromID,
    getPointsFromLine, getPointsFromArc, getConnection, getConnectionCount, getCenter,
    loopToVertex,
    countCommonElements, findPolygonPoints,
    updateArrowOnCreate,
    updateArrowOnLineMove, updateArrowOnLoopMove,
    rotateLoopSetup, rotateLoop, moveLoop,
    changeArrowDirection,
    getWeightSpans, getWeightInputs,
    getLineCenter, getLoopCenter, addWeightText, addWeightItem,
    updateWeightOnMove, moveArrowForWeight,
    removeWeights, getWeightData, setWeightData,
    recon, shrink, expand, restoreAll, createFace, toggleButtonsExcept,
    PATH_START_REGEX
};