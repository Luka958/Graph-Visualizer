import * as VM from './models/VertexModel.js';
import * as EM from './models/EdgeModel.js';
import AlgorithmModel from './models/AlgorithmModel.js';
import * as DeleteEdgeModel from './models/DeleteEdgeModel.js';
import { Tool, toolActive } from './models/ToolEnumModel.js';
import * as Help from './models/DrawingHelperModel.js';
import { replacer, reviver } from './models/JSONExtensionModel.js';
import {addToVertexIDCounter, addToEdgeIDCounter} from "./models/VertexModel.js";
import {
    isAllowedByArrowSize,
    isAllowedByVertexSize,
    isAllowedByWeightItemSize
} from "./models/DrawingConstraintModel.js";
import {ShrinkManager} from './helpers/shrink.js';
import {ColorManager} from "./helpers/color.js";
import {SketchManager} from "./helpers/sketch.js";
import {ScreenshotManager} from "./models/ScreenshotModel.js";
import {toggleButtonsExcept} from "./models/DrawingHelperModel.js";

VM.Vertex.initVertexSVG();
EM.Edge.initEdgeSVG();
console.log(VM.Vertex.vertexSVG, EM.Edge.edgeSVG);

// an arrow scaling formula for adjustment of the arrow size depending on edge width
const SCALE_ARROW = 0.5 * (Math.log(parseInt(EM.Edge.edgeSVG['stroke-width'].toString()) + 0.5) / Math.log(2.5));

document.querySelector('#save-vertex').onclick = () => {
    document.querySelector('#vertex-properties').style.visibility = 'hidden';
    VM.Vertex.updateVertexSVG();
};
document.querySelector('#save-edge').onclick = () => {
    document.querySelector('#edge-properties').style.visibility = 'hidden';
    EM.Edge.updateEdgeSVG();
};

/**
 * storing all vertices that are visible in canvas
 * @type {Map<any, any>} - key: vertex, value: drawEdge function
 */
let map = new Map();
/**
 * contains vertices which drawEdge listeners must be removed before drawing edges
 * because they will get the new ones, after drawing edge functionality is activated
 * @type {Map<any, any>} - key: old vertex, value: [new vertex, drawEdge]
 */
let keysToRemove = new Map();

/**
 * used for mechanism of preventing addition of
 * multiple rotate event listeners of the same kind
 * @type {Map<any, any>} key: loop id, value: rotate event listener
 */
let map2 = new Map();

// storing all vertices and edges
let vertexContainer = [], edgeContainer = [];

function getVertexContainer() {
    vertexContainer = Array.from(map.keys());
    return vertexContainer;
}

function getEdgeContainer() {
    return edgeContainer;
}

function getFromContainer(ID, container) {
    console.assert(!isNaN(ID));

    let element = null;
    container.forEach(el => {
        if (el.id === ID) element = el;
    });
    return element;
}

function removeFromContainer(ID, container) {
    console.assert(!isNaN(ID));
    container.splice(container.findIndex(el => el.id === ID) , 1);
}

let updateVerticesPos = () => {
    keysToRemove.forEach((value, key) => {
        map.delete(key);
        map.set(value[0], value[1]);
    });
    keysToRemove.clear();
}

let canvas = document.querySelector('.canvas');
let connector = { v1: undefined, v2: undefined };     // v1, v2 - vertices that are going to be connected

// ------------ listening for graph type changes ------------ //
let graphType1 = document.querySelector('#select-graph-type-1');
let isDirected;
graphType1.value === 'directed' ? isDirected = true : isDirected = false;
graphType1.addEventListener('change', () => {
    graphType1.value === 'directed' ? isDirected = true : isDirected = false;
});
let graphType2 = document.querySelector('#select-graph-type-2');
let isWeighted;
graphType2.value === 'weighted' ? isWeighted = true : isWeighted = false;
graphType2.addEventListener('change', () => {
    graphType2.value === 'weighted' ? isWeighted = true : isWeighted = false;
});
let weightSaved = false;
// ---------------------------------------------------------- //

let vertexBtn = document.querySelector('#draw-vertex');
let edgeBtn = document.querySelector('#draw-edge');
let moveBtn = document.querySelector('#operation-img-1');
let rotateBtn = document.querySelector('#operation-img-2');
let clearBtn = document.querySelector('#operation-img-3');
let deleteBtn = document.querySelector('#operation-img-4');
let reverseBtn = document.querySelector('#operation-img-5');
let weightBtn = document.querySelector('#operation-img-6');
let shrinkBtn = document.querySelector('#operation-img-7');
let expandBtn = document.querySelector('#operation-img-8');
let screenshotBtn = document.querySelector('#operation-img-9');
let sketchBtn = document.querySelector('#operation-img-10');
let colorBtn = document.querySelector('#operation-img-11');

// not part of the toolbar
let confirmExportBtn = document.querySelector('#confirm-export-button');

let buttons = [
    vertexBtn, edgeBtn, moveBtn, rotateBtn, clearBtn, deleteBtn,
    reverseBtn, weightBtn, shrinkBtn, expandBtn, screenshotBtn,
    sketchBtn, colorBtn
];

// the following are menu buttons, they are not part of the toolbar as the buttons above
let cancelWeightBtn = document.querySelector('#cancel-weight-button');
let saveWeightBtn = document.querySelector('#save-weight-button');

/**
 * set color of activatedButton that was clicked last
 * @param activatedButton
 */
let setButtonColor = (activatedButton) => {
    buttons.forEach(button =>
        button !== activatedButton ?
            button.style.backgroundColor = '#fedbcd' : button.style.backgroundColor = 'white');
}

// do something when toolActive.current changes
toolActive.registerListener(() => {
    if (toolActive.current === Tool.UNDEFINED) {
        setButtonColor(null);
    }
    // update vertices position whenever you are done with moving them
    if (toolActive.current !== Tool.MOVE && toolActive.previous === Tool.MOVE) {
        updateVerticesPos();
    }
    if (toolActive.current !== Tool.DRAW_EDGE && connector.v1 !== undefined) {
        connector.v1 = undefined;
    }
    if (toolActive.current !== Tool.ROTATE && toolActive.previous === Tool.ROTATE) {
        let helpTriangle = Help.getAll('[id^="triangle-rotate-"]');
        let helpCircle = Help.getAll('[id^="circle-rotate-"]');
        if (helpTriangle !== null) helpTriangle.forEach(el => el.remove());
        if (helpCircle !== null) helpCircle.forEach(el => el.remove());
        let loops = Help.getAll('[CA-type*="loop"]');
        loops.forEach(loop => {
            Help.loopToVertex(loop)
                .removeEventListener('click', map2.get(Help.getIDFromEdge(loop)));
        });
        map2.clear();
    }
    if (toolActive.current !== Tool.WEIGHT && toolActive.previous === Tool.WEIGHT) {
        // remove all elements from table
        let table = document.querySelector('#weight-table');
        while (table.firstChild) {
            table.removeChild(table.firstChild);
        }
    }
    if (toolActive.current !== Tool.DELETE && toolActive.previous === Tool.DELETE) {
        DeleteEdgeModel.removeWrappers();
    }
});

/**
 * creating new Vertex object, SVGVertexElement, SVGTextElement and
 * listener for drawing edges with given event (click)
 * @param event
 */
let drawVertexListener = (event) => {
    if (toolActive.current !== Tool.DRAW_VERTEX) return;

    const canvasOffset = canvas.getBoundingClientRect();
    const x = event.clientX - canvasOffset.left;    // taking care of canvas offset
    const y = event.clientY - canvasOffset.top;

    let vertex = new VM.Vertex(x, y, VM.Vertex.updateVertexSVG());
    if (vertex.shape === 'circle') {    // (cx, cy) are exact coordinates
        vertex.SVG['cx'] = x;
        vertex.SVG['cy'] = y;

    } else if (vertex.shape === 'rect') {
        // (x, y) are inner top left coordinates, offset is not needed
        vertex.SVG['x'] = x - parseInt(VM.Vertex.vertexSVG.width) / 2;
        vertex.SVG['y'] = y - parseInt(VM.Vertex.vertexSVG.height) / 2;

    } else {  // includes polygon and triangle
        vertex.SVG.points = Help.findPolygonPoints(x, y, vertex.SVG['polygon-base'], vertex.SVG['number-of-angles']);
    }
    let drawEdge = event => drawEdgeListener(event, vertex);
    map.set(vertex, drawEdge);

    let SVGVertexElement = vertex.createVertex();
    canvas.appendChild(SVGVertexElement);

    let SVGTextElement = vertex.addText();
    canvas.appendChild(SVGTextElement);

    console.log(SVGVertexElement);
}

canvas.addEventListener('click', drawVertexListener);

/**
 * drawing edges using connector object that consists of two vertices,
 * we are assigning vertices to undefined values, otherwise create edge
 * @param event
 * @param vertex - vertex that got clicked after choosing tool for drawing edges
 */
let drawEdgeListener = (event, vertex) => {
    if (toolActive.current !== Tool.DRAW_EDGE) return;

    if (connector.v1 === undefined) {
        connector.v1 = vertex;
    }
    else if (connector.v2 === undefined) {
        connector.v2 = vertex;
        let edge = VM.createEdge(connector.v1, connector.v2, EM.Edge.edgeSVG, isDirected, isWeighted);
        canvas.append(edge);

        VM.restore(
            Help.getVertexFromID(connector.v1.id), Help.getVertexFromID(connector.v2.id),
            Help.getTextFromID(connector.v1.id), Help.getTextFromID(connector.v2.id)
        );
        // creating ordinary (non-SVG) Edge object (needed for algorithms, not DOM manipulation)
        let edgeObjType;
        connector.v1 === connector.v2
            ?
            (isDirected ?
                edgeObjType = EM.Type.DIRECTED_LOOP :
                edgeObjType = EM.Type.UNDIRECTED_LOOP)
            :
            (isDirected ?
                edgeObjType = EM.Type.DIRECTED_LINE :
                edgeObjType = EM.Type.UNDIRECTED_LINE);

        let edgeObj = new EM.Edge(
            parseInt(edge.getAttribute('id').split('edge-id-')[1]),
            edgeObjType,
            false,
            edge.getAttribute('CA-connection').split(',').map(Number),
        );

        getEdgeContainer().forEach(obj => {
            // sets adjacency, but it won't set the loop to be adjacent to itself,
            // because it is impossible by the definition
            if (Help.countCommonElements(obj.connection, edgeObj.connection) > 0) {
               // adding ids to adjacency of both edges
               edgeObj.addAdjacent(obj.id);
               obj.addAdjacent(edgeObj.id);
            }
        });
        edgeContainer.push(edgeObj);

        // creating arrow if graph is directed
        if (edgeObj.type === EM.Type.DIRECTED_LOOP) {
            canvas.append(VM.getArrowForLoop(
                edgeObj.id,
                connector.v1.x, connector.v1.y,
                EM.Edge.edgeSVG,
                SCALE_ARROW));
        }
        else if (edgeObj.type === EM.Type.DIRECTED_LINE) {
            canvas.append(VM.getArrowForLine(
                edgeObj.id,
                connector.v1.x, connector.v1.y,
                connector.v2.x, connector.v2.y,
                EM.Edge.edgeSVG,
                SCALE_ARROW));
            Help.updateArrowOnCreate(edgeObj.id);
            Help.updateArrowOnLineMove(edgeObj.id, isWeighted);
        }
        // reset connector
        connector = {v1: undefined, v2: undefined};
        // whenever new edge is added, we are missing weight for that edge
        if (isWeighted) {
            weightSaved = false;
        }
        console.log(edge);
    }
}

vertexBtn.addEventListener('click', () => {
    toolActive.current = Tool.DRAW_VERTEX;
    setButtonColor(vertexBtn);

    map.forEach((value, key) => {
        Help.getVertexFromID(key.id).removeEventListener('click', value);
    });
});

edgeBtn.addEventListener('click', () => {
    toolActive.current = Tool.DRAW_EDGE;
    setButtonColor(edgeBtn);

    map.forEach((value, key) => {
        Help.getVertexFromID(key.id).addEventListener('click', value);
    });
});

moveBtn.addEventListener('click', () => {
    toolActive.current = Tool.MOVE;
    setButtonColor(moveBtn);

    map.forEach((value, key) => {
        let SVGVertexElement = Help.getVertexFromID(key.id);
        let relativeX, relativeY;

        SVGVertexElement.addEventListener('mousedown', () => {
            if (toolActive.current !== Tool.MOVE) return;

            let incidentEdges = new Map();  // key: edge-id, value: '1' or '2' (two ends of the edge)
            // disable moving on the mouse click release
            document.onmouseup = () => document.onmouseup = document.onmousemove = null;

            // move html SVGVertexElement when the cursor moves
            document.onmousemove = (eventMove) => {
                let canvasOffset = canvas.getBoundingClientRect();
                relativeX = eventMove.clientX - canvasOffset.left;
                relativeY = eventMove.clientY - canvasOffset.top;

                // moving outside the canvas is forbidden
                if (!isAllowedByVertexSize(eventMove.clientX, eventMove.clientY, SVGVertexElement, canvasOffset)) {
                    return;
                }

                /********** update SVGEdgeElement position **********/
                let edges = Help.getAll('[id^="edge-id-"]').filter(edge => {
                    return edge
                        .getAttribute('CA-connection')  // returns IDs separated by a comma
                        .split(',')
                        .includes(`${ key.id }`);
                });
                edges.forEach(edge => {
                    let edgeID = Help.getIDFromEdge(edge);
                    let type = edge.getAttribute('CA-type');

                    if (type === 'loop') {
                        Help.moveLoop(edge, relativeX, relativeY);

                    } else if (type === 'line') {
                        // we are changing coordinates of edge that are the same as vertex we are moving
                        // i.e. don't change coordinates of wrong end
                        let [x1, y1, x2, y2] = Help.getPointsFromLine(edge);

                        // (key.x, key.y) - coordinates of the moving vertex
                        if ((x1 === key.x && y1 === key.y) || (incidentEdges.get(edgeID) === '1')) {
                            edge.setAttribute('d', VM.getUndirectedLine(
                                relativeX,
                                relativeY,
                                x2 + x1 - relativeX, // +x1 to get old abs. pos., -relativeX to get new rel. pos.
                                y2 + y1 - relativeY
                            ));
                            incidentEdges.set(edgeID, '1');

                        } else if (((x1 + x2) === key.x && (y1 + y2) === key.y) || (incidentEdges.get(edgeID) === '2')) {
                            edge.setAttribute('d', VM.getUndirectedLine(
                                x1,
                                y1,
                                relativeX - x1, // -x1 to get new rel. pos.
                                relativeY - y1
                            ));
                            incidentEdges.set(edgeID, '2');

                        } else {
                            throw new Error("Vertex and Edge coordinates of SVG components don't " +
                                "match in Tool.MOVE!");
                        }
                    } else if (type === 'arc') {
                        let [x1, y1, x2, y2] = Help.getPointsFromArc(edge);
                        // height of the control point (distance between control point and middle between vertices)
                        let h = parseFloat(edge.getAttribute('CA-h'));
                        // inverse attribute (draw arc up or down)
                        let inv = edge.getAttribute('CA-inv') === 'true';

                        if ((x1 === key.x && y1 === key.y) || (incidentEdges.get(edgeID) === '1')) {
                            edge.setAttribute('d', VM.getUndirectedArc(
                                relativeX,
                                relativeY,
                                x2 + x1 - relativeX,
                                y2 + y1 - relativeY,
                                h,
                                inv
                            ));
                            incidentEdges.set(edgeID, '1');

                        } else if (((x1 + x2) === key.x && (y1 + y2) === key.y) || (incidentEdges.get(edgeID) === '2')) {
                            edge.setAttribute('d', VM.getUndirectedArc(
                                x1,
                                y1,
                                relativeX - x1,
                                relativeY - y1,
                                h,
                                inv
                            ));
                            incidentEdges.set(edgeID, '2');

                        } else {
                            throw new Error("Vertex and Edge coordinates of SVG components don't " +
                                "match in Tool.MOVE!");
                        }
                    }
                    /********** update SVGArrowElement position **********/
                    // is graph is directed, arrow has to be both rotated and translated
                    if (isDirected) {
                        getEdgeContainer().forEach(e => {
                            if (e.id === Help.getIDFromEdge(edge)) {
                                if (e.type === EM.Type.DIRECTED_LINE) {
                                    Help.updateArrowOnLineMove(e.id, isWeighted);

                                } else {
                                    let arrowOffset = Help.getArrowFromID(edgeID).getBoundingClientRect();
                                    let loopOffset = Help.getEdgeFromID(edgeID).getBoundingClientRect();

                                    if (isAllowedByArrowSize(arrowOffset, canvasOffset, loopOffset)) {
                                        Help.updateArrowOnLoopMove(e.id, isDirected, isWeighted);
                                    }
                                }
                            }
                        });
                    }
                    /********** update WeightItems position **********/
                    if (isWeighted && weightSaved) {
                        let weightItemOffset = Help.getWeightItemFromID(edgeID).getBoundingClientRect();
                        let loopOffset = edge.getBoundingClientRect();

                        if (isAllowedByWeightItemSize(weightItemOffset, canvasOffset, loopOffset)) {
                            Help.updateWeightOnMove(edgeID);
                        }
                    }
                });
                /********** update SVGVertexElement position **********/
                switch (key.shape) {
                    case 'circle':
                        SVGVertexElement.setAttributeNS(null, 'cx', `${ relativeX }`);
                        SVGVertexElement.setAttributeNS(null, 'cy', `${ relativeY }`);
                        break;
                    case 'rect':
                        SVGVertexElement.setAttributeNS(null, 'x',
                            `${ relativeX - parseInt(VM.Vertex.vertexSVG.width) / 2 }`);
                        SVGVertexElement.setAttributeNS(null, 'y',
                            `${ relativeY - parseInt(VM.Vertex.vertexSVG.height) / 2 }`);
                        break;
                    case 'polygon':
                        SVGVertexElement.setAttributeNS(null, 'points',
                            Help.findPolygonPoints(relativeX, relativeY, key.SVG['polygon-base'],
                                key.SVG['number-of-angles']));
                        break;
                }
                /********** update SVGVertexElement center **********/
                SVGVertexElement.setAttribute('CA-center-x', `${ relativeX }`);
                SVGVertexElement.setAttribute('CA-center-y', `${ relativeY }`);
                /********** update SVGTextElement position **********/
                let text = Help.getTextFromID(key.id);
                text.setAttribute('x', `${ relativeX }`);
                text.setAttribute('y', `${ relativeY + VM.TEXT_Y_OFFSET }`);
            }

        });
        SVGVertexElement.addEventListener('mouseup', () => {
            if (toolActive.current === Tool.MOVE) {
                // shallow copy (deep copy would throw an error because of circular reference)
                let newKey = Object.assign(key);
                newKey.x = relativeX;
                newKey.y = relativeY;

                let newValue = event => drawEdgeListener(event, newKey);
                keysToRemove.set(key, [newKey, newValue]);
                // remove old drawEdgeListener because position has changed
                Help.getVertexFromID(key.id).removeEventListener('click', map.get(key));
            }
        });
    });
});

let rotateListener = (vertex, loop, loopID, addedHelpCircle) => {
    if (toolActive.current !== Tool.ROTATE) return;

    let [helpCircle, helpTriangle] = Help.rotateLoopSetup(vertex, loop);

    if (!addedHelpCircle.val) {
        canvas.append(helpCircle, helpTriangle);
        addedHelpCircle.val = true;
    }
    else {
        canvas.append(helpTriangle);
    }
    helpTriangle.addEventListener('mousedown', () => {
        document.onmouseup = () => document.onmouseup = document.onmousemove = null;
        document.onmousemove = (event) => {
            let canvasOffset = canvas.getBoundingClientRect();
            Help.rotateLoop(
                loopID,
                event.clientX - canvasOffset.left,
                event.clientY - canvasOffset.top,
                helpTriangle, helpCircle, isDirected, isWeighted
            );
            if (isWeighted && weightSaved) {
                Help.updateWeightOnMove(loopID);
            }
        }
    });
}

rotateBtn.addEventListener('click', () => {
    toolActive.current = Tool.ROTATE;
    setButtonColor(rotateBtn);
    /**
     * key: vertexID, value: array of loopIDs that belong to vertex (vertex has multiple loops)
     * @type {Map<Number, Array.<Number>>}
     */
    let multiLoopMap = new Map();

    let vertexIds = getVertexContainer().map(el => { return el.id });
    vertexIds.forEach(id => {
        let loops = Help.getAll('[CA-type*="loop"]');
        loops.forEach(loop => {
            // connections are the same, so we can use any index (0 or 1)
            let vertexID = parseInt(loop.getAttribute('CA-connection').split(',')[0]);
            let loopID = Help.getIDFromEdge(loop);

            if (id === vertexID) {
                if (multiLoopMap.has(id)) {
                    let val = multiLoopMap.get(id);
                    val.push(loopID);
                    multiLoopMap.set(id, val);
                }
                else {
                    multiLoopMap.set(id, [loopID]);
                }
            }
        });
    });

    multiLoopMap.forEach((loopIDs, vertexID) => {
        let vertex = Help.getVertexFromID(vertexID);
        // using object instead of the variable because of the need to save changes
        // that are going to occur in rotateListener
        let addedHelpCircle = { val: false };

        loopIDs.forEach(loopID => {
            let loop = Help.getEdgeFromID(loopID);
            try {
                vertex.removeEventListener('click', map2.get(loopID));
            }
            catch (err) {}
            let callRotateListener = () => rotateListener(vertex, loop, loopID, addedHelpCircle);
            vertex.addEventListener('click', callRotateListener);
            map2.set(loopID, callRotateListener);
        });
    });
});

clearBtn.addEventListener('click', () => {
    toolActive.current = Tool.CLEAR;
    setButtonColor(clearBtn);

    let confirm = document.querySelector('#confirm-clear-canvas-button');
    confirm.addEventListener('click', () => {
        clearCanvas();
        toolActive.current = Tool.UNDEFINED;
    });
    let cancel = document.querySelector('#cancel-clear-canvas-button');
    cancel.addEventListener('click', () => {
        toolActive.current = Tool.UNDEFINED;
    });
});

deleteBtn.addEventListener('click', () => {
    toolActive.current = Tool.DELETE;
    setButtonColor(deleteBtn);

    DeleteEdgeModel.setWrappers(getEdgeContainer());

    // delete vertex, incident edges and arrows after click on the vertex
    getVertexContainer().forEach(vertex => {
        if (vertex.helper.hasDeleteListener) return;

        let SVGVertexElement = Help.getVertexFromID(vertex.id);

        let deleteListener = () => {
            // we are always checking this conditions because we are not going to remove this listener
            if (toolActive.current !== Tool.DELETE) return;

            if (vertex.neighbours.length > 0) {
                Help.getAll('[id^="edge-id-"]').forEach(SVGEdgeElement => {
                    let ids = SVGEdgeElement.getAttribute('CA-connection').split(',');
                    // we are using `${ vertex.id }` because vertex.id is integer, array ids contains strings
                    if (ids.includes(`${ vertex.id }`)) {
                        let edgeID = Help.getIDFromEdge(SVGEdgeElement);
                        // removing SVGEdgeElement from canvas
                        SVGEdgeElement.remove();
                        // remove delete edge wrapper
                        Help.getDeleteEdgeFromID(edgeID).remove();

                        // update the adjacent arrays of the edges
                        // that were adjacent to the deleted edge
                        let edge = getFromContainer(edgeID, edgeContainer);
                        edge.adjacent.forEach(eID => {
                            let e = getFromContainer(eID, edgeContainer);
                            e.adjacent.splice(e.adjacent.findIndex(e => e === edgeID), 1);
                        });
                        // removing Edge object from edgeContainer
                        removeFromContainer(edgeID, edgeContainer);
                        // removing SVGArrowElement from canvas
                        if (isDirected) {
                            Help.getArrowFromID(edgeID).remove();
                        }
                        if (isWeighted) {
                            // performing null check because weights may not be added yet
                            let weightItem = Help.getWeightItemFromID(edgeID);
                            if (weightItem !== null) weightItem.remove();

                            let weightText = Help.getWeightTextFromID(edgeID);
                            if (weightText !== null) weightText.remove();
                        }
                    }
                });
            }
            SVGVertexElement.remove();      // removing SVGVertexElement from canvas
            map.delete(vertex);             // removing Vertex object from map
            // remove associated text
            Help.getTextFromID(vertex.id).remove();

            // update the neighbours arrays of the vertices that were neighbour to
            // the deleted vertex, using vertexContainer instead of getVertexContainer()
            // to avoid altering the array during iteration
            vertex.neighbours.forEach(vID => {
                let v = getFromContainer(vID, vertexContainer);
                if (v.neighbours !== null) {
                    v.neighbours.splice(v.neighbours.findIndex(v => v === vertex.id), 1);
                }
            });
            removeFromContainer(vertex.id, vertexContainer);
        }
        SVGVertexElement.addEventListener('click', deleteListener);
        vertex.helper.hasDeleteListener = true;
    });

    // delete edge and arrow after click on the edge
    getEdgeContainer().forEach(edge => {
        if (edge.helper.hasDeleteListener) return;

        let SVGEdgeElement = Help.getEdgeFromID(edge.id);

        SVGEdgeElement.addEventListener('click', () => {
            if (toolActive.current !== Tool.DELETE) return;

            if (isDirected) {
                Help.getArrowFromID(edge.id).remove();
            }
            if (isWeighted) {
                Help.getWeightItemFromID(edge.id).remove();
                Help.getWeightTextFromID(edge.id).remove();
            }
            // update neighbours of the vertices that are connected by the edge that will be deleted
            let connection = Help.getConnection(SVGEdgeElement);
            let v1ID = connection[0];
            let v2ID = connection[1];
            let v1 = getFromContainer(v1ID, vertexContainer);
            let v2 = getFromContainer(v2ID, vertexContainer);

            if (v1ID !== v2ID) {
                v1.neighbours.splice(v1.neighbours.findIndex(id => id === v2ID), 1);
            }
            v2.neighbours.splice(v2.neighbours.findIndex(id => id === v1ID), 1);

            SVGEdgeElement.remove();
            // remove delete edge wrapper
            Help.getDeleteEdgeFromID(edge.id).remove();

            edge.adjacent.forEach(eID => {
                let e = getFromContainer(eID, edgeContainer);
                e.adjacent.splice(e.adjacent.findIndex(e => e === edge.id), 1);
            });
            removeFromContainer(edge.id, edgeContainer);
        });
        edge.helper.hasDeleteListener = true;
    });
});

/**
 * array of the edge ids that already have reverse listener attached
 * @type {*[]}
 */
let arrowIDsWithReverseListener = [];
reverseBtn.addEventListener('click', () => {
    if (isDirected) {
        toolActive.current = Tool.DIRECTION;
        setButtonColor(reverseBtn);

        // removing keys from array for edges (arrows) that got deleted,
        // edge ids are always the same as arrow ids
        let allArrowIds = getEdgeContainer().map(edge => { return edge.id });
        _.difference(arrowIDsWithReverseListener, allArrowIds).forEach(key => {
            _.remove(arrowIDsWithReverseListener, id => id === key);
        });
        getEdgeContainer().forEach(edge => {
            let SVGArrowElement = Help.getArrowFromID(edge.id);
            let SVGEdgeElement = Help.getEdgeFromID(edge.id);

            let reverseListener = () => {
                Help.changeArrowDirection(edge.id);
                const type = SVGEdgeElement.getAttribute('CA-type');

                if (type === 'line' || type === 'arc') {
                    // reverse order of connections in SVG element
                    let temp = SVGEdgeElement.getAttribute('CA-connection').split(',');
                    SVGEdgeElement.setAttribute('CA-connection', temp[1] + ',' + temp[0]);
                    // reverse order of connections in JS object
                    edgeContainer[edgeContainer.indexOf(edge)].connection.reverse();
                }
            }
            if (!arrowIDsWithReverseListener.includes(edge.id)) {
                SVGArrowElement.addEventListener('click', reverseListener);
                arrowIDsWithReverseListener.push(edge.id);
            }
        });
    }
});

weightBtn.addEventListener('click', () => {
    if (isWeighted) {
        toolActive.current = Tool.WEIGHT;
        setButtonColor(weightBtn);

        document.querySelector('#weight-div').style.visibility = 'visible';
        let table = document.querySelector('#weight-table');
        table.append(...Help.getWeightSpans());

        getEdgeContainer().forEach(edge => {
            if (edge.helper.hasWeightItem === true) {
                table.append(...Help.getWeightInputs(edge.id, edge.weight));
                return;
            }
            let weightItem, weightText;
            let isLine = (edge.type === EM.Type.UNDIRECTED_LINE || edge.type === EM.Type.DIRECTED_LINE);

            weightText = Help.addWeightText(edge.id, 0, isLine);
            canvas.append(weightText);
            weightItem = Help.addWeightItem(edge.id, weightText, EM.Edge.edgeSVG.stroke, isLine);

            if (isDirected) {
                Help.moveArrowForWeight(edge.id, VM.getArrowBody(SCALE_ARROW));
            }
            // text has to be appended first because getComputedTextLength() doesn't work if an element
            // isn't appended to the canvas, then we have to remove text and append it after item,
            // so it won't be hidden behind item
            weightText.remove();
            canvas.append(weightItem, weightText);
            table.append(...Help.getWeightInputs(edge.id));
            edge.helper.hasWeightItem = true;
        });
    }
});
// set toolActive.a to undefined when cancel button is clicked
cancelWeightBtn.addEventListener('click', () => {
    toolActive.current = Tool.UNDEFINED;
    getEdgeContainer().forEach(edge => edge.helper.hasWeightItem = false);
    Help.removeWeights(getEdgeContainer().map(edge => edge.id));
});

saveWeightBtn.addEventListener('click', () => {
    weightSaved = true;
    let weightMap = Help.getWeightData(getEdgeContainer().map(edge => edge.id));
    // update edge attributes
    edgeContainer.forEach(edge => {
        if (weightMap.has(edge.id)) {
            edge.weight = weightMap.get(edge.id);
            edge.isWeighted = true;
        }
    });
    Help.setWeightData(weightMap);

    // this command has to be the last one, otherwise getWeightData won't work
    toolActive.current = Tool.UNDEFINED;
});

let shrunk = false;
const originalLookMap = new Map();
shrinkBtn.addEventListener('click', () => {
    if (!shrunk) {
        toolActive.current = Tool.SHRINK;
        setButtonColor(shrinkBtn);
        // disable deleting operation when toolActive.a = Tool.SHRINK
        deleteBtn.style.pointerEvents = 'none';

        shrunk = true;
        originalLookMap.clear();
        // hide text and shrink vertex
        ShrinkManager.getInstance().open(getVertexContainer(), originalLookMap);
    }
});

expandBtn.addEventListener('click', () => {
    if (shrunk) {
        toolActive.current = Tool.EXPAND;
        setButtonColor(expandBtn);
        // enable deleting operation when toolActive.a = Tool.EXPAND
        deleteBtn.style.pointerEvents = 'initial';

        shrunk = false;
        // show text and expand vertex
        ShrinkManager.getInstance().close();
        // go back to normal state (before shrink + expand)
        toolActive.current = Tool.UNDEFINED;
    }
});

screenshotBtn.addEventListener('click', () => {
    toolActive.current = Tool.SCREENSHOT;
    setButtonColor(screenshotBtn);

    ScreenshotManager.getInstance().takeScreenshot().then(() => {
        toolActive.current = Tool.UNDEFINED;
    });
});

sketchBtn.addEventListener('click', () => {
    toolActive.current = Tool.SKETCH;
    setButtonColor(sketchBtn);

    const toggle = toggleButtonsExcept(buttons, []);
    toggle.activate();

    const onExit = () => {
        toolActive.current = Tool.UNDEFINED;
        toggle.deactivate();
    };
    SketchManager.getInstance().init(onExit);
});

colorBtn.addEventListener('click', () => {
    toolActive.current = Tool.COLOR;
    setButtonColor(colorBtn);

    const toggle = toggleButtonsExcept(buttons, []);
    toggle.activate();

    const onExit = () => {
        toolActive.current = Tool.UNDEFINED;
        toggle.deactivate();
    };
    ColorManager.getInstance().setVertexContainer(getVertexContainer());
    ColorManager.getInstance().init(onExit);
});

confirmExportBtn.addEventListener('click', () =>{
    toolActive.current = Tool.UNDEFINED;

    let str = '';
    Array.from(canvas.childNodes).forEach(el => {
        // prevent saving canvas configuration
        if (el.nodeType !== Node.TEXT_NODE && el.className.baseVal !== 'canvas-config') {
            str += el.outerHTML;
        }
        // console.log(el.outerHTML);
    });
    let obj = {
        svg: str,
        isDirected: isDirected,
        isWeighted: isWeighted,
        weightSaved: weightSaved,
        arrowIDsWithReverseListener: arrowIDsWithReverseListener,
        keysToRemove: keysToRemove,
        vertexContainer: getVertexContainer(),
        edgeContainer: getEdgeContainer(),
        vertexSVG: _.omit(VM.Vertex.vertexSVG, ['id', 'cx', 'cy', 'x', 'y', 'points']),
        edgeSVG: EM.Edge.edgeSVG,
        IDCounters: VM.getIDCounters()
    };
    obj = JSON.stringify(obj, replacer);

    let data = 'text/json;charset=utf-8,' + encodeURIComponent(obj);
    let link = document.querySelector('#export-link');
    let fileName = document.querySelector('#export-file-name').value;
    link.setAttribute('href', 'data:' + data);
    link.setAttribute('download', fileName + '.json');
});

const imported = document.querySelector('#imported');
let importProcedure = () => {
    if (imported !== null) {
        const parsed = JSON.parse(imported.innerHTML, reviver);
        console.log(parsed);

        // append reconstructed elements to the canvas
        canvas.append(...Help.recon(parsed.svg));
        // update containers and set listeners
        isDirected = parsed.isDirected;
        isWeighted = parsed.isWeighted;
        weightSaved = parsed.weightSaved;
        VM.Vertex.vertexSVG = parsed.vertexSVG;
        EM.Edge.edgeSVG = parsed.edgeSVG;
        vertexContainer = parsed.vertexContainer;
        edgeContainer = parsed.edgeContainer;
        arrowIDsWithReverseListener = parsed.arrowIDsWithReverseListener;
        keysToRemove = parsed.keysToRemove;
        VM.setIDCounters(parsed.IDCounters);

        let tempV = [], tempE = [];
        vertexContainer.forEach(vertex => {
            let obj = new VM.Vertex();
            Object.assign(obj, vertex);
            vertex.helper.hasDeleteListener = false;
            tempV.push(obj);
        });
        edgeContainer.forEach(edge => {
            let obj = new EM.Edge();
            Object.assign(obj, edge);
            edge.helper.hasDeleteListener = false;
            tempE.push(obj);
        })
        // all vertices and edges in both containers have object type 'object', so we won't be able
        // to access methods from the Vertex and Edge class without creating new instances
        // shallow copy is being used
        vertexContainer = _.clone(tempV);
        edgeContainer = _.clone(tempE);

        connector.v1 = connector.v2 = undefined;
        vertexContainer.forEach(vertex => {
            Help.getVertexFromID(vertex.id).addEventListener('click', event => {
                if (toolActive.current !== Tool.DRAW_EDGE) return;
                drawEdgeListener(event, vertex);
                // map.set(vertex, event);  // not needed line!
            });
            map.set(vertex, undefined);
        });
        // refresh graph types
        isDirected ? graphType1.value = 'directed' : graphType1.value = 'undirected';
        isWeighted ? graphType2.value = 'weighted' : graphType2.value = 'unweighted';
    }
}

if (imported.innerHTML.trim().length > 0) {
    // wait for canvas config to load to avoid placing grid over graph
    setTimeout(() => importProcedure(), 400);
}

// pass containers to the Algorithm Model
document.querySelector('#algorithm').addEventListener('click', () => {
    toolActive.current = Tool.UNDEFINED;

    AlgorithmModel.passContainers({
        vertexContainer: getVertexContainer(),
        edgeContainer: getEdgeContainer()
    });
});

let clearCanvas = () => {
    // update vertex container
    getVertexContainer();
    // remove everything except the canvas configuration elements
    let nodes = Array.from(canvas.childNodes);
    nodes = nodes.filter(childNode => { return !childNode.classList.value.includes('canvas-config')});
    nodes.forEach(childNode => childNode.remove());

    // todo new - make SEPARATE CONTAINER FOR ALL THESE STRUCTURES
    addToVertexIDCounter(vertexContainer.length * -1);
    addToEdgeIDCounter(edgeContainer.length * -1);
    vertexContainer = [];
    edgeContainer = [];
    connector = { v1: undefined, v2: undefined };
    map.clear();
    keysToRemove.clear();
    map2.clear();
    arrowIDsWithReverseListener = [];
    shrunk = false;
    originalLookMap.clear();
    toolActive.current = Tool.UNDEFINED;
}