import * as Matrix from '../../models/MatrixModel.js';
import * as Defaults from '../../models/ClientDefaultsModel.js';
import * as InsertGraph from './insert_graph.js';
import {getVertexFromID} from "../../models/DrawingHelperModel.js";
import {vertexIDCounter} from "../../models/VertexModel.js";

let prefix = 'adjacency-matrix-';
Matrix.setMatrix(prefix, 0, 10, true);

let insertAdjMatrixBtn = document.querySelector('#insert-adjacency-matrix');
// part of the matrix with the values greater than 0, not the whole matrix
let adjMatrix, n;
insertAdjMatrixBtn.addEventListener('click', () => {
    let offset = vertexIDCounter === 0 ? 0 : vertexIDCounter;
    [adjMatrix, n] = Matrix.getAdjMatrixValues(prefix, offset);
    drawGraphFromAdjMatrix(adjMatrix, n);
});

const clickDrawEdge = () => document.querySelector('#draw-edge').click();

function drawGraphFromAdjMatrix(adjMatrix, n) {
    let bounds = document.querySelector('.canvas').getBoundingClientRect();
    let [x, y] = Defaults.insertGraphCenter(bounds.left, bounds.top, canvas.clientWidth, canvas.clientHeight);

    InsertGraph.createNull(x, y, Defaults.insertGraphRadius, n, Defaults.clickOptions, - Math.PI / 2);
    clickDrawEdge();
    adjMatrix.forEach(pair => {
        let cardE = pair[1];
        let v1 = getVertexFromID(pair[0][0]);
        let v2 = getVertexFromID(pair[0][1]);
        for (let i = 0; i < cardE; i++) {
            InsertGraph.connect(v1, v2);
        }
        // console.log(pair[0][0], pair[0][1])
        // console.log(v1, v2)
    });
}