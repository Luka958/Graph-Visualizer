import * as Matrix from '../../models/MatrixModel.js';
import * as Defaults from '../../models/ClientDefaultsModel.js';
import * as InsertGraph from './insert_graph.js';
import {getVertexFromID} from "../../models/DrawingHelperModel.js";
import {vertexIDCounter} from "../../models/VertexModel.js";

let prefix = 'incidence-matrix-';
Matrix.setMatrix(prefix, 0, 1, false);

let insertIncMatrixBtn = document.querySelector('#insert-incidence-matrix');
// part of the matrix with the values greater than 0, not the whole matrix
insertIncMatrixBtn.addEventListener('click', () => {
    let incMatrix, vertexCount, edgeCount;
    let offset = vertexIDCounter === 0 ? 0 : vertexIDCounter;
    [incMatrix, vertexCount, edgeCount] = Matrix.getIncMatrixValues(prefix, offset);

    if (checkForErrorsFailed(vertexCount, edgeCount)) {
        return;
    }
    drawGraphFromIncMatrix(incMatrix, vertexCount);
});

const clickDrawEdge = () => document.querySelector('#draw-edge').click();

function drawGraphFromIncMatrix(incMatrix, vertexCount) {
    let bounds = document.querySelector('.canvas').getBoundingClientRect();
    let [x, y] = Defaults.insertGraphCenter(bounds.left, bounds.top, canvas.clientWidth, canvas.clientHeight);

    InsertGraph.createNull(x, y, Defaults.insertGraphRadius, vertexCount, Defaults.clickOptions, - Math.PI / 2);
    clickDrawEdge();
    incMatrix.forEach(pair => {
        let v1 = getVertexFromID(pair[0]);
        let v2 = getVertexFromID(pair[1]);
        InsertGraph.connect(v1, v2);
    });
}

function checkForErrorsFailed(m, n) {
    const prefix = 'incidence-matrix-table-input';
    const elements = Array.from(document.querySelectorAll(`[id^="${ prefix }"]`));
    const values = elements.map(el => { return el.value === '' ? 0 : parseInt(el.value) });
    const wrongInputs = [];
    let checkFailed = false;

    for (let j = 0; j < n; j++) {
        let cnt = 0;

        for (let i = 0; i < m; i++) {
            let value = values[i * n + j];
            if (value === 1) {
                cnt++;
            }
        }

        if (cnt !== 2 && cnt !== 0) {
            checkFailed = true;
            for (let k = 0; k < m; k++) {
                wrongInputs.push(
                    document.querySelector(`#${ prefix + '-' + k.toString() + '-' + j.toString() }`)
                );
            }
            wrongInputs.forEach(el => {
                el.style.backgroundColor = 'red';
                el.style.color = 'white';
            });
        }
    }

    if (checkFailed) {
        setTimeout(() => {
            wrongInputs.forEach(el => {
                el.style.backgroundColor = 'white';
                el.style.color = 'black';
            });
        }, 3000);
    }
    return checkFailed;
}