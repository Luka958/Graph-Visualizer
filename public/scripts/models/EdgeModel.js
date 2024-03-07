import * as defaults from "./ClientDefaultsModel.js";

const Type = {
    UNDIRECTED_LINE: 1,
    UNDIRECTED_LOOP: 2,
    DIRECTED_LINE: 3,
    DIRECTED_LOOP: 4
};
Object.freeze(Type);

class Edge {
    id;             // transferred from edgeIdCounter (VertexModel.js) -> drawing.js -> here
    adjacent;       // list of ids of adjacent edges
    type;           // EdgeType value
    weight;         // non-negative integer (undefined if isWeighted is false)
    isWeighted;     // boolean
    connection;     // ids of vertices that are connected by this edge
    helper;         // contains custom attributes used in drawing.js

    static edgeSVG;

    constructor(id, type, isWeighted, connection) {
        // option for empty constructor (we can't have multiple constructors in js)
        if (id === undefined && type === undefined && isWeighted === undefined &&
            connection === undefined) return this;
        this.id = id;
        this.adjacent = [];
        this.type = type;
        this.isWeighted = isWeighted;
        this.connection = connection;
        this.helper = {};
    }

    setWeight(weight) {
        if (this.isWeighted === true) {
            this.weight = weight;

        } else {
            throw 'Setting weight to unweighted edge is forbidden!';
        }
    }

    addAdjacent(arr) {
        this.adjacent.push(arr);
    }

    static initEdgeSVG() {
        let saveEdgeBtn = document.querySelector('#save-edge');
        let event = new MouseEvent('click', defaults.clickOptions);
        saveEdgeBtn.dispatchEvent(event);

        return this.updateEdgeSVG();
    }

    static updateEdgeSVG() {
        let formData = new FormData(document.querySelector('#edge-properties form'));
        let shape = formData.get('select-edge-shape').toLowerCase();

        this.edgeSVG = {
            ...(shape === 'line') && {
                'shape': 'path'
            },
            'stroke': formData.get('edge-border').toString(),
            'stroke-width': formData.get('edge-width'),
            'scale-loop': formData.get('scale-loop')
        }
        let request = new Request('/edge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.edgeSVG)
        });
        // async function
        fetch(request).then();
        return this.edgeSVG;
    }
}

export { Edge, Type };