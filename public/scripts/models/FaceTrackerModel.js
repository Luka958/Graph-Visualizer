import {getAll, getIDFromVertex} from "./DrawingHelperModel.js";

export default class FaceTracker {

    static init() {
        VERTEX_OBSERVER.observe(SVG_CANVAS, { childList: true });
    }
}

const FACE_OBSERVER = new MutationObserver((mutations) => {
    const faces = getAll('polygon.face');

    if (faces === null) {
        return;
    }
    for (let mutation of mutations) {
        const id = getIDFromVertex(mutation.target);

        for (let face of faces) {
            const vertices = face.getAttribute('vertices').split(',').map(id => parseInt(id));
            const index = vertices.indexOf(id);
            if (index === -1) {
                continue;
            }
            const points = face.getAttribute('points').split(' ');
            let x, y;

            if (mutation.attributeName === 'CA-center-x') {
                x = mutation.target.getAttribute('CA-center-x');
                y = points[index].split(',')[1];

            } else {
                x = points[index].split(',')[0];
                y = mutation.target.getAttribute('CA-center-y');
            }
            points[index] = x + ',' + y;
            face.setAttribute('points', points.join(' '));
        }
    }
});

const VERTEX_OBSERVER = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        for (let added of mutation.addedNodes) {
            if (added.id.startsWith('vertex-id-')) {
                FACE_OBSERVER.observe(added, {
                    attributes: true,
                    attributeFilter: ['CA-center-x', 'CA-center-y']
                });
            }
        }
    }
});