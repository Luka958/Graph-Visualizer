import {restore, Vertex} from "../models/VertexModel.js";
import {
    createFace,
    getAll, getAllEdges, getAllVertices,
    getArrowFromID, getCenter,
    getConnection,
    getIDFromEdge, getPointsFromLine,
    getTextFromID,
    getVertexFromID, getWeightItemFromID, restoreAll
} from "../models/DrawingHelperModel.js";
import * as defaults from "../models/ClientDefaultsModel.js";
import {Edge} from "../models/EdgeModel.js";
import {
    distanceFromLine,
    fundamentalCycleSet, shoelace,
    rayCasting, isConnectedGraph, isSimpleGraph
} from "../utils/traversal.js";
import FaceTracker from "../models/FaceTrackerModel.js";

class ColorManager {

    tool;
    initialized = false;
    save = false;
    onModeCloses = [];
    onToolCloses = [];

    static instance = new ColorManager();

    static getInstance() {
        return ColorManager.instance;
    }

    init(onExit) {
        const brush = document.querySelector('#color-tool-brush');
        const eraser = document.querySelector('#color-tool-eraser');
        const colorToolbar = document.querySelector('#color-toolbar');
        const select = document.querySelector('#color-toolbar-select');
        const exitBtn = document.querySelector('#color-tool-exit');
        const saveColorCheckbox = document.querySelector('#save-color-state');
        const faceColoring = document.querySelector('#face-coloring-option');
        this.palette = document.querySelector('#color-toolbar-color-palette');

        faceColoring.disabled = !(isSimpleGraph() && isConnectedGraph(this.vertexContainer));

        if (this.initialized) {
            setVisible(colorToolbar);
            select.selectedIndex = 0;   // default to vertex coloring
            this.updateColorMode(select.value);
            return;
        }
        setVisible(colorToolbar);

        exitBtn.addEventListener('click', () => {
            this.runModeCloses();
            this.runToolCloses();
            setInvisible(colorToolbar);
            ColorUtil.removeEdgeWrappers();
            onExit();
        });

        saveColorCheckbox.addEventListener('change', () => {
            this.save = saveColorCheckbox.checked;
        });
        this.initialized = true;
        this.save = saveColorCheckbox.checked;
        this.onModeCloses = [];
        this.onToolCloses = [];

        brush.addEventListener('click', () => {
            this.tool = 'brush';
            this.runToolCloses();
            this.updateColorMode(select.value);
            brush.style.border = '1px solid white';
            eraser.style.border = 'none';
            EraseUtil.disableErase();
        });
        eraser.addEventListener('click', () => {
            this.tool = 'eraser';
            this.runToolCloses();
            eraser.style.border = '1px solid white';
            brush.style.border = 'none';
            EraseUtil.enableErase();
        });
        select.addEventListener('change', e => {
            this.runModeCloses();

            if (this.tool === 'brush') {
                this.updateColorMode(e.target.value);
            }
        });
        FaceTracker.init();
    }

    updateColorMode(coloring) {
        if (coloring === 'vertex') {
            this.updateCallbacks(ColorUtil.colorVertices);

        } else if (coloring === 'edge') {
            this.updateCallbacks(ColorUtil.colorEdges);

        } else {
            this.updateCallbacks(ColorUtil.colorFaces);
        }
    }

    updateCallbacks(colorMethod) {
        const callbacks = colorMethod(this.palette);

        this.onModeCloses = callbacks.onModeCloses;
        this.onToolCloses = this.onToolCloses.concat(...callbacks.onToolCloses);
    }

    isSaveActive() {
        return this.save;
    }

    setVertexContainer(vertexContainer) {
        this.vertexContainer = vertexContainer;
    }

    getVertexContainer() {
        return this.vertexContainer;
    }

    runModeCloses() {
        if (this.onModeCloses !== undefined) {
            this.onModeCloses.forEach(cb => cb());
        }
    }

    runToolCloses() {
        if (this.onToolCloses !== undefined) {
            this.onToolCloses.forEach(cb => cb());
        }
    }
}

class ColorUtil {

    static colorVertices(palette) {
        const vertices = getAllVertices();
        const onModeCloses = [];
        const onToolCloses = [];

        vertices.forEach(v => {
            const cbs = ColorUtil.colorVertex(v, palette);
            onModeCloses.push(cbs.onModeClose);
            onToolCloses.push(cbs.onToolClose);
        });

        return { onModeCloses, onToolCloses };
    }

    static colorEdges(palette) {
        const edges = getAllEdges();
        const onModeCloses = [];
        const onToolCloses = [];

        edges.forEach(e => {
            ColorUtil.addEdgeWrapper(e);
            const cbs = ColorUtil.colorEdge(e, palette);
            onModeCloses.push(cbs.onModeClose);
            onToolCloses.push(cbs.onToolClose);
        });
        return { onModeCloses, onToolCloses };
    }

    static colorFaces(palette) {
        const onModeCloses = [];
        const onToolCloses = [];

        const onClick = (e) => {
            if (e.target.tagName !== 'svg') {
                return;
            }
            const bounds = SVG_CANVAS.getBoundingClientRect();
            const x = e.clientX - bounds.x;
            const y = e.clientY - bounds.y;

            let closestEdge = null;
            let min = Number.MAX_VALUE;

            getAllEdges().forEach(edge => {
                // getting points from the line only because the arcs
                // and the loops aren't present in a simple graph
                const points = getPointsFromLine(edge);
                const x1 = points[0];
                const y1 = points[1];
                const x2 = x1 + points[2];
                const y2 = y1 + points[3];

                const d = distanceFromLine(x1, y1, x2, y2, x, y);
                if (d < min) {
                    min = d;
                    closestEdge = edge;
                }
            });
            const v0 = ColorManager.getInstance().getVertexContainer().find(v => v.id === getConnection(closestEdge)[0]);
            const cycles = fundamentalCycleSet(ColorManager.getInstance().getVertexContainer(), v0);
            // console.log(structuredClone(cycles));

            let cycle = null;
            let finalPolygon = null;
            let minArea = Number.MAX_VALUE;

            for (let i = cycles.length - 1; i >= 0; i--) {
                let polygon = [];

                for (let id of cycles[i]) {
                    let center = getCenter(getVertexFromID(id));
                    polygon.push([center.x, center.y]);
                }

                if (rayCasting(polygon, x, y)) {
                    let area = shoelace(polygon);
                    // console.log("area: ", area, " cycle: ", cycles[i]);
                    if (area < minArea) {
                        minArea = area;
                        cycle = cycles[i];
                        finalPolygon = polygon
                    }
                }
            }
            if (cycle !== null) {
                const face = createFace(finalPolygon, cycle, palette.getAttribute('color'));
                SVG_CANVAS.appendChild(face);
                restoreAll();
            }
        }
        SVG_CANVAS.addEventListener('click', onClick);

        const onClose = () => {
            SVG_CANVAS.removeEventListener('click', onClick);

            if (!ColorManager.getInstance().isSaveActive()) {
                const faces = getAll('polygon.face');
                if (faces !== null) {
                    faces.forEach(face => SVG_CANVAS.removeChild(face));
                }
            }
        }
        onModeCloses.push(onClose);
        onToolCloses.push(onClose);

        return { onModeCloses, onToolCloses };
    }

    static colorVertex(vertex, palette) {
        const defaultColor = Vertex.vertexSVG.fill;

        const enter = () => {}
        const leave = () => {}
        const click = () => {
            vertex.setAttribute('fill', palette.getAttribute('color'));
        }
        const listeners = { enter, leave, click };

        ColorUtil.addColorListeners(vertex, listeners);

        const onModeClose = () => {
            if (!ColorManager.getInstance().isSaveActive()) {
                vertex.setAttribute('fill', defaultColor);
            }
            ColorUtil.removeColorListeners(vertex, listeners);
        }
        const onToolClose = () => {
            ColorUtil.removeColorListeners(vertex, listeners);
        };

        return { onModeClose, onToolClose };
    }

    static colorEdge(edge, palette) {
        const id = getIDFromEdge(edge);
        const arrow = getArrowFromID(id);
        const weightItem = getWeightItemFromID(id);
        const defaultColor = Edge.edgeSVG.stroke;
        const defaultWidth = edge.getAttribute('stroke-width');

        let prevColor = defaultColor;

        const enter = () => {
            const color = palette.getAttribute('color');
            if (prevColor === color) {
                return;
            }
            edge.setAttribute('stroke', color);
            edge.setAttribute('stroke-width', '10');
            edge.setAttribute('stroke-dasharray', '5,2.5');
        }
        const leave = () => {
            if (prevColor === palette.getAttribute('color')) {
                return;
            }
            edge.setAttribute('stroke', prevColor);
            edge.setAttribute('stroke-width', defaultWidth);
            edge.removeAttribute('stroke-dasharray');
        }
        const click = () => {
            const color = palette.getAttribute('color');
            prevColor = edge.getAttribute('stroke');

            edge.removeAttribute('stroke-dasharray');
            edge.setAttribute('stroke', color);
            edge.setAttribute('stroke-width', defaultWidth);

            if (arrow !== null) {
                arrow.setAttribute('fill', color);
            }
            if (weightItem !== null) {
                weightItem.setAttribute('fill', color);
            }
        }
        const listeners = { enter, leave, click };

        const onModeClose = () => {
            if (!ColorManager.getInstance().isSaveActive()) {
                edge.setAttribute('stroke', defaultColor);
                edge.setAttribute('stroke-width', defaultWidth);

                if (arrow !== null) {
                    arrow.setAttribute('fill', defaultColor);
                }
                if (weightItem !== null) {
                    weightItem.setAttribute('fill', defaultColor);
                }
            }
            ColorUtil.removeColorListeners(edge, listeners);
            ColorUtil.removeEdgeWrappers();
        }
        const onToolClose = () => {
            if (arrow !== null) {
                arrow.setAttribute('fill', defaultColor);
            }
            if (weightItem !== null) {
                weightItem.setAttribute('fill', defaultColor);
            }
            ColorUtil.removeColorListeners(edge, listeners);
            ColorUtil.removeEdgeWrappers();
        }

        ColorUtil.addColorListeners(edge, listeners);

        return { onModeClose, onToolClose };
    }

    static addColorListeners(el, listeners) {
        el.addEventListener('mouseenter', listeners.enter);
        el.addEventListener('mouseleave', listeners.leave);
        el.addEventListener('click', listeners.click);
    }

    static removeColorListeners(el, listeners) {
        el.removeEventListener('mouseenter', listeners.enter);
        el.removeEventListener('mouseleave', listeners.leave);
        el.removeEventListener('click', listeners.click);
    }

    static addEdgeWrapper(edge) {
        const overlay = edge.cloneNode(false);
        overlay.setAttribute('id', 'color-' + edge.getAttribute('id'));
        overlay.setAttribute('stroke-width', '10');
        overlay.style.strokeOpacity = '0';

        overlay.onmouseenter = () => edge.dispatchEvent(new MouseEvent('mouseenter', defaults.clickOptions));
        overlay.onmouseleave = () => edge.dispatchEvent(new MouseEvent('mouseleave', defaults.clickOptions));
        overlay.onclick = () => edge.dispatchEvent(new MouseEvent('click', defaults.clickOptions));

        SVG_CANVAS.append(overlay);

        const con = edge.getAttribute('CA-connection').split(',').map(el => parseInt(el));
        restore(getVertexFromID(con[0]), getVertexFromID(con[1]), getTextFromID(con[0]), getTextFromID(con[1]));
    }

    static removeEdgeWrappers() {
        getAll('[id^="color-edge-id-"]').forEach(el => el.remove());
    }
}

class EraseUtil {

    static eraseMap = new Map();

    static enableErase() {
        const vertices = getAllVertices();
        const edges = getAllEdges();
        const faces = getAll('polygon.face');

        if (vertices !== null) {
            vertices.forEach(v => EraseUtil.eraseMap.set(v, () => v.setAttribute('fill', Vertex.vertexSVG.fill)));
        }
        if (edges !== null) {
            edges.forEach(e => EraseUtil.eraseMap.set(e, () => e.setAttribute('stroke', Edge.edgeSVG.stroke)));
        }
        if (faces !== null) {
            faces.forEach(f => EraseUtil.eraseMap.set(f, () => SVG_CANVAS.removeChild(f)));
        }
        EraseUtil.eraseMap.forEach((val, key) => key.addEventListener('click', val));
    }

    static disableErase() {
        EraseUtil.eraseMap.forEach((val, key) => key.removeEventListener('click', val));
    }
}

export { ColorManager }