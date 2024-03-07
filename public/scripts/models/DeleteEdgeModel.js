import * as Help from './DrawingHelperModel.js';
import * as defaults from '../models/ClientDefaultsModel.js';
import {restore} from "./VertexModel.js";

/**
 * creates the SVG elements that are initially invisible, once an
 * element with an id <code>delete-upper-edge-[number]</code> gets
 * hovered, it remains invisible, but the element with the id
 * <code>delete-lower-edge-[number]</code> shows up as the
 * dashed-like line following an edge
 *
 * when the upper element gets clicked, both of the elements will
 * be removed and the operation of removing the edge and
 * belonging vertices will be performed
 *
 * wrappers are created and removed when entering and leaving
 * <code>Tool.DELETE</code> mode, this behaviour is managed
 * in the drawing.js
 * @param edgeContainer
 */
function setWrappers(edgeContainer) {
    edgeContainer.forEach(edge => {
        let SVGEdgeElement = Help.getEdgeFromID(edge.id);

        let SVGEdgeDelete = SVGEdgeElement.cloneNode(false);
        SVGEdgeDelete.setAttribute('id', 'delete-' + SVGEdgeElement.id);
        SVGEdgeDelete.setAttribute('stroke-width', '10');
        SVGEdgeDelete.style.strokeOpacity = '0';

        let oldStroke = SVGEdgeElement.getAttribute('stroke');
        let oldStrokeWidth = SVGEdgeElement.getAttribute('stroke-width');

        SVGEdgeDelete.onmouseover = () => {
            SVGEdgeElement.setAttribute('stroke', 'red');
            SVGEdgeElement.setAttribute('stroke-width', '10');
            SVGEdgeElement.setAttribute('stroke-dasharray', '5,2.5');
        }
        SVGEdgeDelete.onmouseout = () => {
            SVGEdgeElement.setAttribute('stroke', oldStroke);
            SVGEdgeElement.setAttribute('stroke-width', oldStrokeWidth);
            SVGEdgeElement.removeAttribute('stroke-dasharray');
        }
        SVGEdgeDelete.onclick = () => {
            let event = new MouseEvent('click', defaults.clickOptions);
            SVGEdgeElement.dispatchEvent(event);
        }
        document.querySelector('.canvas').append(SVGEdgeDelete);

        restore(
            Help.getVertexFromID(edge.connection[0]),
            Help.getVertexFromID(edge.connection[1]),
            Help.getTextFromID(edge.connection[0]),
            Help.getTextFromID(edge.connection[1])
        );
    });
}

function removeWrappers() {
    Help.getAll('[id^="delete-edge-id-"]').forEach(del => del.remove());
}

export { setWrappers, removeWrappers }