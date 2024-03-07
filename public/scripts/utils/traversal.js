import {getAllEdges, getConnection} from "../models/DrawingHelperModel.js";

// source: https://www.codeproject.com/Articles/1158232/Enumerating-All-Cycles-in-an-Undirected-Graph
export function fundamentalCycleSet(vertexContainer, v0) {
    const vertices = structuredClone(vertexContainer);
    const cycles = [];

    function traverse(v, start, visited, path) {
        v.visited = true;
        path.push(v.id);

        if (path.length > 2 && start.neighbours.includes(v.id)) {
            cycles.push([...path]); // cycle

        } else {
            for (const u of vertices) {
                if (u.neighbours.includes(v.id) && !u.visited && u.id !== start.id) {
                    traverse(u, start, visited, path);
                }
            }
        }
        path.pop();
        v.visited = false;
    }

    const visited = new Array(vertices.length).fill(false);
    const path = [];
    traverse(v0, v0, visited, path);

    removeDuplicates(cycles);
    return removeSupersets(cycles);
}

function removeDuplicates(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            if (_.isEqual(_.sortBy(arr[i]), _.sortBy(arr[j]))) {     // _.sortBy() doesn't mutate the arr
                arr.splice(i, 1);
                break;
            }
        }
    }
}

function removeSupersets(arr) {
    const result = [];

    for (let i = 0; i < arr.length; i++) {
        let isSuperset = false;

        for (let j = 0; j < arr.length; j++) {
            if (i === j) {
                continue;
            }
            if (arr[j].every(el => arr[i].includes(el))) {
                isSuperset = true;
                break;
            }
        }
        if (!isSuperset) {
            result.push(arr[i]);
        }
    }
    return result;
}

// source: http://paulbourke.net/geometry/pointlineplane/
export function distanceFromLine(x1, y1, x2, y2, x, y) {
    const u = Math.max(0,
        Math.min(1,
            ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) /
            (Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2))
        )
    );
    return Math.sqrt(Math.pow(x1 + u * (x2 - x1) - x, 2) + Math.pow(y1 + u * (y2 - y1) - y, 2));
}

// source: https://wrfranklin.org/Research/Short_Notes/pnpoly.html
export function rayCasting(polygon, x, y) {
    const n = polygon.length;
    let inside = false;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// source: https://en.wikipedia.org/wiki/Shoelace_formula
export function shoelace(polygon) {
    const n = polygon.length;
    let area = 0;

    for (let i = 0; i < n; i++) {
        const x1 = polygon[i][0];
        const y1 = polygon[i][1];
        const x2 = polygon[(i + 1) % n][0];
        const y2 = polygon[(i + 1) % n][1];

        area += x1 * y2 - y1 * x2;
    }
    return Math.abs(area) / 2;
}

export function isSimpleGraph() {
    const connections = getAllEdges().map(edge => getConnection(edge));

    for (let i = 0; i < connections.length; i++) {
        if (connections[i][0] === connections[i][1]) {
            return false;   // loop
        }
        for (let j = i + 1; j < connections.length; j++) {
            if ((connections[i][0] === connections[j][0] && connections[i][1] === connections[j][1]) ||
                (connections[i][0] === connections[j][1] && connections[i][1] === connections[j][0])) {
                return false;   // multiple edges
            }
        }
    }
    return true;
}

export function isConnectedGraph(vertexContainer) {
    if (vertexContainer.length === 0) {
        return false;
    }
    const stack = [vertexContainer[0]];
    const visited = [];

    while (stack.length > 0) {
        const v = stack.pop();

        for (let u of v.neighbours) {
            u = vertexContainer.find(el => el.id === u);

            if (!visited.includes(u)) {
                visited.push(u);
                stack.push(u);
            }
        }
    }
    return vertexContainer.length === visited.length;
}