import {
    getConnection,
    getEdgeFromID,
    getIDFromVertex,
    getVertexFromID,
    PATH_START_REGEX
} from "../../models/DrawingHelperModel.js";
import VertexModel from "../../../../models/DefaultsModel.js";
import EdgeModel from "../../../../models/DefaultsModel.js";

const COLOR = '#FFFF00';
const BASE_TIME = 1000;     // time in ms

export class TimeManager {

    time = BASE_TIME;

    static instance = new TimeManager();

    static getInstance() {
        return TimeManager.instance;
    }

    updateTime(factor) {
        this.time *= factor;
    }

    getTime() {
        return this.time;
    }

    async delay() {
        return new Promise((resolve) => setTimeout(resolve, this.time));
    }
}

export function Animate(target, name, descriptor) {
    const defaultDescriptor = descriptor.value;

    descriptor.value = function(...args) {
        const generator = defaultDescriptor.apply(this, args);

        function* f() {
            while (true) {
                const result = generator.next();
                iteration(result);

                if (result.done) {
                    return result.value;
                }
                yield result.value;
            }
        }
        return f();
    };
    return descriptor;
}

function iteration({value, done}) {
    if (done) {
        setTimeout(() => {
            value.vertexContainer.forEach(v => defaultColorVertexByAttr(getVertexFromID(v.id)));
            value.edgeContainer.forEach(e => defaultColorEdgeByAttr(getEdgeFromID(e.id)));
            removeLabelTexts();                                         // specific

        }, TimeManager.getInstance().getTime());
        return;
    }

    const v = value.v;                                                // specific
    const idsInS = [...value.S].map(el => el.id);                 // specific

    for (let edgeId of value.E) {
        const edge = getEdgeFromID(edgeId);
        const connection = getConnection(edge);
        const v1Id = connection[0];
        const v2Id = connection[1];

        const reversed = !idsInS.includes(v1Id) || v1Id === v.id;
        drawEdgeByAnimation(edge, reversed);

        const chosen = value.pair.includes(v1Id) && value.pair.includes(v2Id);    // specific
        chosen ? colorEdgeByAttr(edge) : colorEdgeByAnimation(edge);
    }

    setTimeout(() => {
        const vertex = getVertexFromID(v.id);
        colorVertexByAttr(vertex);

        addLabelText(vertex, value.d);

    }, (value.i === 0) ? 0 : TimeManager.getInstance().getTime());
}

function addLabelText(vertex, data) {
    const x = vertex.getAttribute('CA-center-x');
    const y = vertex.getAttribute('CA-center-y');
    const bounds = vertex.getBoundingClientRect();
    const offsetY = (bounds.bottom - bounds.top) / 2;

    const text = document.createElementNS(SVG_NS_URI, "text");
    text.setAttribute('id', `text-algorithm-${ getIDFromVertex(vertex) }`);
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '15px');
    text.setAttribute('font-weight', 'normal');
    text.setAttribute('fill', 'white');
    text.setAttribute('pointer-events', 'none');

    text.style.userSelect = 'none';
    text.textContent = data.toString();

    SVG_CANVAS.appendChild(text);
    const textBounds = text.getBoundingClientRect();
    SVG_CANVAS.removeChild(text);

    const offsetTextY = (textBounds.bottom - textBounds.top) / 2;
    text.setAttribute('x', x);
    text.setAttribute('y', `${ parseInt(y) - offsetY - offsetTextY }`);
    SVG_CANVAS.appendChild(text);
}

function removeLabelTexts() {
    const labels = document.querySelectorAll('[id^="text-algorithm-"]');
    if (labels) {
        labels.forEach(el => SVG_CANVAS.removeChild(el));
    }
}

/**
 * animation for drawing the edge
 * @param edge the edge which coordinates will be used for drawing
 * @param reversed <b>true</b> if the abs and rel coords are defined
 * in a way that matches a direction of the drawing, <b>false</b>
 * otherwise (coords must be inverted in order to draw in wanted direction)
 */
function drawEdgeByAnimation(edge, reversed) {
    const d = edge.getAttribute('d');
    const matched = d.match(PATH_START_REGEX);

    const animate = document.createElementNS(SVG_NS_URI, 'animate');
    animate.setAttribute('attributeName', 'd');
    animate.setAttribute('dur', `${ TimeManager.getInstance().getTime() / 1000 }s`);
    animate.setAttribute('repeatCount', '1');
    animate.setAttribute('begin', 'indefinite'); // prevent start on append

    if (reversed) {
        const d0 = matched[0];
        const d1 = d.substring(d0.length);
        const d0Arr = d0.trim().split(' ').slice(1).map(el => parseInt(el));
        const d1Arr = d1.trim().split(' ').slice(1).map(el => parseInt(el));

        console.assert(d0Arr.length === 2 && d1Arr.length === 2);

        const dR0 = `M ${ d0Arr[0] + d1Arr[0] } ${ d0Arr[1] + d1Arr[1] } `;
        const dR11 = 'l 0 0';
        const dR12 = `l ${ -d1Arr[0] } ${ -d1Arr[1] }`;

        animate.setAttribute('values', dR0 + dR11 + '; ' + dR0 + dR12);
        // todo loop (not needed for dijkstra)

    } else {
        const d0 = matched[0];
        const d1 = 'l 0 0';
        animate.setAttribute('values', d0 + d1 + '; ' + d);
    }

    animate.addEventListener('endEvent', () => {
        edge.removeChild(animate);
    });
    edge.appendChild(animate);
    animate.beginElement();
}

function colorEdgeByAnimation(edge) {
    const animate = document.createElementNS(SVG_NS_URI, 'animate');
    animate.setAttribute('attributeName', 'stroke');
    animate.setAttribute('dur', `${ TimeManager.getInstance().getTime() / 1000 }s`);
    animate.setAttribute('repeatCount', '1');
    animate.setAttribute('begin', 'indefinite');
    animate.setAttribute('values', COLOR);

    animate.addEventListener('endEvent', () => edge.removeChild(animate));
    edge.appendChild(animate);
    animate.beginElement();
}

function colorEdgeByAttr(edge) {
    edge.setAttribute('stroke', COLOR);
}

function defaultColorEdgeByAttr(edge) {
    edge.setAttribute('stroke', EdgeModel.edgeSVG.stroke);
}

function colorVertexByAttr(vertex) {
    vertex.setAttribute('stroke', COLOR);
}

function defaultColorVertexByAttr(vertex) {
    vertex.setAttribute('stroke', VertexModel.vertexSVG.stroke);
}