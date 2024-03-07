import * as defaults from '../models/ClientDefaultsModel.js';
import {getIDFromEdge, getWeightItemFromID, updateArrowOnLineMove, updateWeightOnMove} from "./DrawingHelperModel.js";

const START_VERTEX_ID_COUNTER = 1;
const START_EDGE_ID_COUNTER = 1;

let vertexIDCounter = START_VERTEX_ID_COUNTER;
let edgeIDCounter = START_EDGE_ID_COUNTER;
// SVG namespace - needed for creating SVG elements dynamically
const TEXT_Y_OFFSET = 1.975;
const CIRCLE_SIZE = 75;
const ARC_SPACING = 75;

function getIDCounters() {
    return [vertexIDCounter, edgeIDCounter];
}

function setIDCounters(arr) {
    vertexIDCounter = arr[0];
    edgeIDCounter = arr[1];
}

/**
 * neighbours - array which contains id's of all neighbour vertices
 * SVG - array which contains SVG properties
 */
class Vertex {
    id;
    neighbours;
    x;
    y;
    SVG;
    shape;
    helper;

    static vertexSVG;

    constructor(x, y, SVG) {
        // option for empty constructor (we can't have multiple constructors in js)
        if (x === undefined && y === undefined && SVG === undefined) return this;
        this.id = vertexIDCounter++;
        this.neighbours = [];
        this.x = x;
        this.y = y;

        if (SVG.shape === 'triangle') {
            this.shape = 'polygon';

        } else if (SVG.shape === 'square' || SVG.shape === 'rectangle') {
            this.shape = 'rect';

        } else {
            this.shape = SVG.shape;
        }
        this.SVG = SVG;
        this.SVG['id'] = `vertex-id-${ this.id }`;
        this.helper = {};
    }

    /**
     * Creates vertex of specified shape as SVG element.
     * @returns {*}
     */
    createVertex() {
        let vertex = document.createElementNS(SVG_NS_URI, this.shape);
        for (const [key, value] of Object.entries(this.SVG)) {
            vertex.setAttribute(`${ key }`, `${ value }`);
        }
        // set custom attributes CA-center-x and CA-center-y
        vertex.setAttribute('CA-center-x', `${ this.x }`);
        vertex.setAttribute('CA-center-y', `${ this.y }`);
        return vertex;
    }

    addText() {
        let text = document.createElementNS(SVG_NS_URI, "text");
        // font-weight = {normal | bold | bolder | lighter}
        // dominant-baseline = middle -> center vertically
        // text-anchor = middle -> center horizontally
        // pointer-events = none -> make SVGText elements not clickable
        let props = [
            "id", "x", "y",
            "dominant-baseline",
            "text-anchor",
            "font-size",
            "font-weight",
            "fill",
            "pointer-events"];
        // added custom offset to y-axis because numbers are taking middle and upper part of the line
        // ex. letter j is taking middle and lower part in SVG
        let propsValues = [
            `text-id-${ this.id }`, `${ this.x }`, `${ this.y + TEXT_Y_OFFSET }`,
            "middle",
            "middle",
            "15px",
            "normal",
            "white",
            "none"];
        for (let i = 0; i < props.length; i++) {
            text.setAttribute(props[i], propsValues[i]);
        }
        text.style.userSelect = 'none';
        text.textContent = `${ this.id }`;
        return text;
    }

    static initVertexSVG() {
        let saveVertexBtn = document.querySelector('#save-vertex');
        let event = new MouseEvent('click', defaults.clickOptions);
        saveVertexBtn.dispatchEvent(event);

        return this.updateVertexSVG();
    }

    static updateVertexSVG() {
        let formData = new FormData(document.querySelector('#vertex-properties form'));
        let shape = formData.get('select-vertex-shape').toLowerCase();

        this.vertexSVG = {
            'shape': shape,
            'fill': formData.get('vertex-fill'),
            'stroke': formData.get('vertex-border'),
            'stroke-width': formData.get('vertex-border-width'),

            // spread operator (...) for conditional adding of the attributes
            ...(shape === 'circle') && {'r': formData.get('circle-radius')},
            ...(shape === 'square') && {
                'width': formData.get('square-base'),
                'height': formData.get('square-base')
            },
            ...(shape === 'rectangle') && {
                'width': formData.get('rectangle-width'),
                'height': formData.get('rectangle-height')
            },
            ...(shape === 'triangle') && {
                'polygon-base': formData.get('triangle-base'),
                'number-of-angles': '3',
                'fill-rule': 'nonzero'     // available only to polygons (like triangle)
            },
            ...(shape === 'polygon') && {
                'polygon-base': formData.get('polygon-base'),
                'number-of-angles': formData.get('number-of-angles'),
                'fill-rule': 'nonzero'
            }
        }
        const request = new Request('/vertex', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.vertexSVG)
        });
        // async function
        fetch(request).then();
        return this.vertexSVG;
    }
}

/**
 * returns string for creating loop for undirected graph
 * @param x - vertex center x-axis coordinate
 * @param y - vertex center y-axis coordinate
 * @param scaleLoop - factor for scaling size of the loop
 * @param circleSize - it must be multiplied by scaleLoop before calling method
 * @returns {*}
 */
let getUndirectedLoop = (x, y, scaleLoop, circleSize) => {
    return `M ${ x } ${ y } ` +
        `a 400 400 0 0 1 ${ - 75 * scaleLoop } ${ - 200 * scaleLoop } ` +
        `a ${ circleSize } ${ circleSize } 0 0 1 ${ circleSize } -${ circleSize } ` +
        `a ${ circleSize } ${ circleSize } 0 0 1 ${ circleSize } ${ circleSize } ` +
        `a 400 400 0 0 1 ${ - 75 * scaleLoop } ${ 200 * scaleLoop }`;
}

/**
 * returns string for creating straight edge for undirected graph
 * @param x1 - 1st vertex center x-axis coordinate
 * @param y1 - 1st vertex center y-axis coordinate
 * @param x2 - 2nd vertex center x-axis coordinate
 * @param y2 - 2nd vertex center y-axis coordinate
 * @returns {`M ${string} ${string} l ${string} ${string}`}
 */
let getUndirectedLine = (x1, y1, x2, y2) => {
    return `M ${ x1 } ${ y1 } l ${ x2 } ${ y2 }`;
}

let getUndirectedArc = (x1, y1, x2, y2, h, inv) => {
    // midpoint and slope formulas are different from the standard
    // ones because (x2, y2) is relative to (x1, y1)
    const xp = x1 + x2 / 2;
    const yp = y1 + y2 / 2;

    const k = -x2 / y2;
    let xc, yc;

    if (inv) {
        h = -h;
    }

    if (k === Number.POSITIVE_INFINITY) {
        xc = xp;
        yc = yp - h;

    } else if (k === Number.NEGATIVE_INFINITY) {
        xc = xp;
        yc = yp + h;

    } else if (Object.is(k, 0)) {
        xc = xp + h;
        yc = yp;

    } else if (Object.is(k, -0)) {
        xc = xp - h;
        yc = yp;

    } else {
        const l = yp - k * xp;
        const a = 1 + Math.pow(k, 2);
        const b = -2 * xp + 2 * k * (l - yp);
        const c = Math.pow(xp, 2) + Math.pow(l - yp, 2) - Math.pow(h, 2);
        const root = Math.sqrt(Math.pow(b, 2) - 4 * a * c);

        xc = (x2 > 0 && y2 < 0) || (x2 < 0 && y2 < 0) ? (-b + root) : (-b - root);  // 3rd and 4th quadrant

        const xc1 = (-b + root)
        const xc2 = (-b - root)
        if (xc === xc1) {
            if (inv) {
                xc = xc2
            }

        } else {
            if (inv) {
                xc = xc1
            }
        }
        xc /= (2 * a);
        yc = k * xc + l;
    }
    return `M ${ x1 } ${ y1 } q ${ xc - x1 } ${ yc - y1 } ${ x2 } ${ y2 }`;
}

/**
 * returns string for creating body of an arrow, only starting position is
 * different between directed loop and directed line because coordinates
 * in getArrowBody are relative to starting ones
 * @param scaleArrow
 * @returns {*}
 */
let getArrowBody = (scaleArrow) => {
    return `l ${ -14 * scaleArrow } ${ 0 } ` +
        `l ${ 25  * scaleArrow } ${ -12.5 * scaleArrow } ` +
        `l ${ -5  * scaleArrow } ${ 12.5  * scaleArrow } ` +
        `l ${ 5   * scaleArrow } ${ 12.5  * scaleArrow } ` +
        `l ${ -25 * scaleArrow } ${ -12.5 * scaleArrow }`;
}

/**
 * returns string for creating loop for directed graph (with arrow),
 * everything else than scaleArrow works the same as in getUndirectedLoop
 * scaleArrow - factor for scaling size of the arrow
 */
let getArrowForLoop = (id, x, y, edgeSVG, scaleArrow) => {
    let scaleLoop = edgeSVG['scale-loop'], circleSize = scaleLoop * CIRCLE_SIZE;

    let arrow = document.createElementNS(SVG_NS_URI, 'path');
    arrow.setAttribute('id', `arrow-id-${ id }`);
    arrow.setAttribute('fill', edgeSVG['stroke']);

    let centerX = x - 75 * scaleLoop + circleSize;
    let centerY = y - 200 * scaleLoop - circleSize;
    arrow.setAttribute('d', `M ${ centerX } ${ centerY } ` + getArrowBody(scaleArrow));
    return arrow;
}

/**
 * returns string for creating straight edge for directed graph (with arrow),
 * arrow is center on the half of length of the edge, all parameters are described before
 */
let getArrowForLine = (id, x1, y1, x2, y2, edgeSVG, scaleArrow) => {
    let arrow = document.createElementNS(SVG_NS_URI, 'path');
    arrow.setAttribute('id', `arrow-id-${ id }`);
    arrow.setAttribute('fill', edgeSVG['stroke']);

    let centerX = (x1 + x2) / 2;
    let centerY = (y1 + y2) / 2;
    arrow.setAttribute('d', `M ${ centerX } ${ centerY } ` + getArrowBody(scaleArrow));
    return arrow;
}
/**
 *
 * @param v1 first vertex that is going to be connected with the second vertex
 * @param v2 second vertex
 * @param edgeSVG object with SVG customisation attributes
 * @param isDirected
 * @param isWeighted
 * @returns {SVGPathElement}
 */
let createEdge = (v1, v2, edgeSVG, isDirected, isWeighted) => {
    let edge = document.createElementNS(SVG_NS_URI, "path");
    edge.setAttribute("fill", "none");
    // CA (Custom Attribute) - connection consists of ids of vertices that are connected
    edge.setAttribute('CA-connection', `${v1.id},${v2.id}`);
    edge.setAttribute('id', `edge-id-${edgeIDCounter++}`);

    if (v1 === v2) {    // loop
        edge.setAttribute("d", getUndirectedLoop(
            v1.x,
            v1.y,
            edgeSVG['scale-loop'],
            edgeSVG['scale-loop'] * CIRCLE_SIZE
        ));
        edge.setAttribute("CA-type", "loop");
        edge.setAttribute("CA-loop-angle", "0");

    } else {    // line or arc
        const args = [v1.x, v1.y, v2.x - v1.x, v2.y - v1.y];
        const query = `path[CA-connection="${ v1.id + ',' + v2.id }"], path[CA-connection="${ v2.id + ',' + v1.id }"]`;
        const edges = Array.from(document.querySelectorAll(query));
        edges.push(edge);
        const len = edges.length;

        if (len > 0) {
            let e, h, i, j = Math.floor(len / 2);

            for (i = 0; i < j; i++) {
                h = ARC_SPACING * (j - i);
                e = edges[i];
                e.setAttribute("d", getUndirectedArc(...args, h, false));
                e.setAttribute("CA-type", "arc");
                e.setAttribute("CA-h", h.toString());
                e.setAttribute("CA-inv", "false");
            }

            if (len % 2 !== 0) {
                e = edges[i];
                e.setAttribute("d", getUndirectedLine(...args));
                e.setAttribute("CA-type", "line");
            }

            for (i = Math.ceil(len / 2), j = 1; i < len; i++, j++) {
                h = ARC_SPACING * j;
                e = edges[i];
                e.setAttribute("d", getUndirectedArc(...args, h, true));
                e.setAttribute("CA-type", "arc");
                e.setAttribute("CA-h", h.toString());
                e.setAttribute("CA-inv", "true");
            }

            if (isDirected) {
                for (i = 0; i < len - 1; i++) {
                    // update all except the new one because it is at the right position,
                    // and it's not added yet so arrow can't be updated
                    updateArrowOnLineMove(getIDFromEdge(edges[i]), isWeighted);
                }

            }
            if (isWeighted) {
                for (i = 0; i < len - 1; i++) {
                    const id = getIDFromEdge(edges[i]);

                    if (getWeightItemFromID(id) !== null) {
                        // weight item may still not be placed
                        updateWeightOnMove(id);
                    }
                }
            }

        } else {
            edge.setAttribute("d", getUndirectedLine(...args));
            edge.setAttribute("CA-type", "line");
        }
    }

    for (const [key, value] of Object.entries(edgeSVG)) {
        edge.setAttribute(`${ key }`, `${ value }`);
    }
    v1.neighbours.push(v2.id);
    // don't add the same vertex twice if there is a loop
    if (v1 !== v2) {
        v2.neighbours.push(v1.id);
    }
    return edge;
}

/**
 * removing SVGVertexElements and SVGTextElements and appending them to
 * canvas again in order to create proper order (vertex have to be on
 * top of edge and text have to be on top of vertex)
 */
let restore = (v1, v2, t1, t2) => {
    SVG_CANVAS.removeChild(t1);
    SVG_CANVAS.removeChild(v1);
    if (v1 !== v2) {
        SVG_CANVAS.removeChild(t2);
        SVG_CANVAS.removeChild(v2);
    }
    SVG_CANVAS.append(v1, t1);
    if (v1 !== v2) {
        SVG_CANVAS.append(v2, t2);
    }
}

// manipulate counters from outer scripts, num can be negative
let addToVertexIDCounter = (num) => vertexIDCounter += num;
let addToEdgeIDCounter = (num) => edgeIDCounter += num;

export {
    START_VERTEX_ID_COUNTER, START_EDGE_ID_COUNTER,
    vertexIDCounter, edgeIDCounter, TEXT_Y_OFFSET, CIRCLE_SIZE,
    Vertex, createEdge, restore,
    getUndirectedLoop, getUndirectedLine, getUndirectedArc,
    getArrowForLoop, getArrowForLine, getArrowBody,
    getIDCounters, setIDCounters, addToVertexIDCounter, addToEdgeIDCounter
};