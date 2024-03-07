import * as defaults from '../../models/ClientDefaultsModel.js';
import {START_VERTEX_ID_COUNTER} from "../../models/VertexModel.js";
import {Tool, toolActive} from "../../models/ToolEnumModel.js";

// dynamically creating HTML elements
let createItem = (imageName, headingName, specialMark) => {
    let item = document.createElement('div');
    item.className = 'grid-item';
    let str = `<div class="grid-item-main">
               <img src="images/graph/${ imageName }.png" width="140" height="105" alt="${ headingName }">`;

    if (specialMark !== undefined) {
        specialMark = specialMark.split(' ');
        str += `<div class="special-mark">${ specialMark[0] }<sub>${ specialMark[1] }</sub></div>`;
    }
    str += `</div>
        <div class="heading1-underline"></div>
        <div class="component-heading" id="${ imageName }">${ headingName }</div>`;

    item.innerHTML += str;
    return item;
}

let insertItemsToContainer = () => {
    let container = document.querySelector('#insert-graph-grid');
    // update these two arrays if you want to add/remove items from container
    let imageNames = [
        'null', 'complete', 'cycle', 'chain', 'wheel', 'complete_bipartite', 'cube',
        'petersen', 'tetrahedron', 'octahedron', 'icosahedron', 'dodecahedron',
        'heawood', 'grotzsch'
    ];
    let headingNames = [
        'Null Graph', 'Complete Graph', 'Cycle', 'Chain', 'Wheel', 'Complete Bipartite', 'Cube',
        'Petersen Graph', 'Tetrahedron', 'Octahedron', 'Icosahedron', 'Dodecahedron',
        'Heawood Graph', 'Grötzsch Graph'
    ];
    // symbols in the upper right corner
    let specialMarks = [
        'N n', 'K n', 'C n', 'P n', 'W n', 'K r,s', 'Q k'
    ];
    console.assert(imageNames.length === headingNames.length);
    for (let i = 0; i < imageNames.length; i++) {
        // specialMarks[i] undefined is handled in createItem()
        container.append(createItem(imageNames[i], headingNames[i], specialMarks[i]));
    }
}
insertItemsToContainer();

// change appearance of the item's heading and underline simultaneously on mouse hover
// (impossible to achieve in CSS)
let hoverEffects = () => {
    let headings = Array.from(document.querySelectorAll('.grid-item > .component-heading'));
    let underlines = Array.from(document.querySelectorAll('.grid-item > .heading1-underline'));

    headings.forEach((heading, index) => {
        heading.addEventListener('mouseenter', () => {
            heading.style.borderColor = heading.style.backgroundColor = '#fc8955';
            underlines[index].style.backgroundColor = 'midnightblue';
        });
        heading.addEventListener('mouseleave', () => {
            heading.style.borderColor = heading.style.backgroundColor = 'midnightblue';
            underlines[index].style.backgroundColor = '#fc8955';
        });
    });
}
hoverEffects();

let headings = Array.from(document.querySelectorAll('.grid-item > .component-heading'));

let insertInputsToContainer = () => {
    headings.forEach(heading => {
        // input element will be created depending on a special mark
        let specialMark = heading.parentElement.querySelector('sub');
        if (specialMark !== null) {
            specialMark = specialMark.innerHTML.trim();
            let bound = heading.getBoundingClientRect();
            let div = document.createElement('div');
            div.id = heading.id + '-graph-menu-input-box';
            div.style.cssText = `
                visibility: hidden;
                margin-top: 114px;
                position: absolute; 
                z-index: 5; 
                top: 0;
                width: ${bound.right - bound.left}px;
                height: 32px;
                display: flex;
                align-items: center;
                background-color: midnightblue;
                color: white;`;

            div.innerHTML +=
                `<span ` +
                    // only for the complete bipartite graph this span must be hidden because we need
                    // to make space for the checkbox
                    (div.id === 'complete_bipartite-graph-menu-input-box' ?
                        `id="complete_bipartite-data-span"` : ``) +
                `>
                    <label for="${heading.id}-input" style="margin: 0 5px 3px 5px;">${specialMark}</label>
                    <input 
                        id="${heading.id}-input" 
                        name="${heading.id}-input" 
                        type="text"
                        style="width: ${specialMark.length === 1 ? 57 : 50}px; 
                        font-family: EncodeSans-Medium, serif;">
                </span>` +

                (div.id === 'complete_bipartite-graph-menu-input-box' ?
                    `<span 
                        id="complete_bipartite-is-vertical-span" 
                        style="visibility: hidden; position: absolute; margin-left: 5px;">
                        
                        <label for="complete_bipartite-is-vertical">Vertical</label>
                        <input id="complete_bipartite-is-vertical" type="checkbox">
                    </span>` : ``) +

                `<span class="forward-backward-box">
                    <img src="/images/backward.png" alt="backward image" width="25px" height="25px"
                        class="forward-backward-img">
                    
                    <img src="/images/forward.png" alt="forward image" width="25px" height="25px"
                        class="forward-backward-img" style="margin-right: 5px;">
                </span>`;

            heading.parentElement.append(div);

            // select forward/backward images
            let images = div.querySelectorAll('img');

            images[0].addEventListener('click', () => {
                let currentDiv = images[0].parentElement.parentElement;

                if (currentDiv.id === 'complete_bipartite-graph-menu-input-box') {
                    if (currentDiv.hasAttribute('is-vertical')) {
                        currentDiv.removeAttribute('is-vertical');

                        hideElemsByIDs('#complete_bipartite-is-vertical-span');
                        unHideElemsByIDs('#complete_bipartite-data-span');
                        return;
                    }
                }
                div.style.visibility = 'hidden';
            });

            // option exclusive to the complete bipartite graph
            let isVertical = null;

            images[1].addEventListener('click', () => {let currentDiv = images[1].parentElement.parentElement;
                const input = document.querySelector(`#${ heading.id }-input`).value;

                try {
                    validateInput(heading.id, input);
                } catch (e) {
                    console.log(e)
                    return;
                }
                if (currentDiv.id === 'complete_bipartite-graph-menu-input-box') {
                    if (currentDiv.getAttribute('is-vertical') === 'active') {
                        currentDiv.removeAttribute('is-vertical');

                        hideElemsByIDs('#complete_bipartite-is-vertical-span');
                        isVertical = document.querySelector('#complete_bipartite-is-vertical').checked;

                    } else {
                        unHideElemsByIDs('#complete_bipartite-is-vertical-span');
                        hideElemsByIDs('#complete_bipartite-data-span');

                        // span for the selection is visible, the user hasn't chosen anything yet
                        currentDiv.setAttribute('is-vertical', 'active');
                        return;
                    }
                }
                div.style.visibility = 'hidden';
                hideActiveInputs();
                hideElemsByIDs('#insert-graph-div', '#graph-menu-div');
                insertItemsToCanvas(heading.id, input, isVertical);
            });

            heading.addEventListener('click', () => {
                document.querySelector('#' + heading.id + '-graph-menu-input-box').style.visibility = 'visible';

                // complete bipartite data span has to be handled manually
                if (heading.id === 'complete_bipartite') {
                    document.querySelector('#complete_bipartite-data-span').style.visibility = 'visible';
                }
            });
        }
        else {
            heading.addEventListener('click', () => {
                insertItemsToCanvas(heading.id, null);
                hideElemsByIDs('#insert-graph-div', '#graph-menu-div');
            });
        }
    });
}
insertInputsToContainer();

// hide active input boxes after closing graph menu div or generating graph
function hideActiveInputs() {
    let inputs = Array.from(document.querySelectorAll('[id$="-graph-menu-input-box"]'));
    inputs.forEach(input => {
        if (input.style.visibility === 'visible') {
            input.style.visibility = 'hidden';
        }
    });
}

function validateInput(graphType, input) {
    if (graphType === 'complete_bipartite') {
        input = input.split(',');
        if (input.length !== 2) {
            throw 'Input error!';
        }
        if (parseInt(input[0]) < 0 && input[1] < 0) {
            throw 'Input error!';
        }
    } else {
        input = parseInt(input);
        if (isNaN(input)) throw 'Input error!';

        switch (graphType) {
            case 'cycle':
                if (input < 3) throw 'Input error!';
                break;
            case 'chain':
                if (input < 2) throw 'Input error!';
                break;
            case 'wheel':
                if (input < 3) throw 'Input error!';
                break;
            default:
                if (input < 0) throw 'Input error!';
        }
    }
}

document.querySelector('#close-insert-graph').addEventListener('click', () => {
    hideActiveInputs();
});

// ------------ drawing graphs section ------------ //
const clickDrawVertex = () => document.querySelector('#draw-vertex').click();
const clickDrawEdge = () => document.querySelector('#draw-edge').click();

/**
 * inserts a graph in the canvas
 * @param algorithm name of the algorithm
 * @param input
 * @param isVertical used for the complete bipartite graph only
 */
function insertItemsToCanvas(algorithm, input, isVertical) {
    if (algorithm === 'prufer-decode') {
        // validate input
        if (input[input.length - 1] === ',') {
            throw 'Invalid input!';
        }
        if (input.includes(',')) {
            input = input.split(',');
            input.forEach(el => {
                if (isNaN(el)) {
                    throw 'Invalid input!';
                }
            });
            input = input.map(el => parseInt(el));
        } else {
            if (isNaN(input)) {
                throw 'Invalid input!';
            } else {
                input = [parseInt(input)];
            }
        }
        // validate code
        input.forEach(el => {
           if (el < START_VERTEX_ID_COUNTER ||
               (START_VERTEX_ID_COUNTER === 1 && el > input.length + 2) ||
               (START_VERTEX_ID_COUNTER === 0 && el + 1 > input.length + 2)) {
               throw 'Invalid code!';
           }
        });

    } else if (!isNaN(input)) {
        // single number detected
        input = parseInt(input);

    } else if (input.split(',').length === 2 && algorithm === 'complete_bipartite') {
        // it may be two numbers separated by a comma (ex. r,s) or incorrect input
        input = input.split(',');
        if (isNaN(input[0]) || isNaN(input[1])) {
            throw 'Invalid input!';
        }

    } else {
        throw 'Invalid input!';
    }

    let canvas = document.querySelector('.canvas');
    let bounds = canvas.getBoundingClientRect();

    let x = bounds.left + canvas.clientWidth / 2;
    let y = bounds.top + canvas.clientHeight / 2 - 25;
    // radius of imaginary circle for vertex placement
    const r = defaults.insertGraphRadius;
    const options = defaults.clickOptions;
    let n = input;
    let inputR = parseInt(input[0]), inputS = parseInt(input[1]);
    let firstVertex, lastVertex, vertices;

    switch (algorithm) {
        case 'null':
            // first vertex that is added by graph insertion
            // (there may be some vertices in the canvas already)
            createNull(x, y, r, n, options);
            break;
        case 'chain':
            firstVertex = createNull(x, y, r, n, options);
            vertices = filterVertices(firstVertex);
            createChain(firstVertex, vertices);
            break;
        case 'cycle':
            firstVertex = createNull(x, y, r, n, options);
            vertices = filterVertices(firstVertex);
            createCycle(firstVertex, createChain(firstVertex, vertices));
            break;
        case 'complete':
            firstVertex = createNull(x, y, r, n, options);
            vertices = filterVertices(firstVertex);
            createCycle(firstVertex, createChain(firstVertex, vertices));
            createComplete(vertices);
            break;
        case 'heawood':
            firstVertex = createNull(x, y, r, n = 14, options);
            vertices = filterVertices(firstVertex);
            createCycle(firstVertex, createChain(firstVertex, vertices));
            createHeawood(vertices);
            break;
        case 'tetrahedron':
            firstVertex = createNull(x, y, r, n = 3, options, - Math.PI / 2);
            vertices = filterVertices(firstVertex);
            createCycle(firstVertex, createChain(firstVertex, vertices));
            createTetrahedron(x, y, options, vertices);
            break;
        case 'grotzsch':
            firstVertex = createNull(x, y, r, n = 5, options, - Math.PI / 2);
            vertices = filterVertices(firstVertex);
            createCycle(firstVertex, createChain(firstVertex, vertices));
            createNull(x, y, r - r / 3.5, n = 5, options, - Math.PI / 2);
            vertices = filterVertices(firstVertex);     // refresh vertices
            createGrotzsch(x, y, options, vertices);
            break;
        case 'cube':
            n = Math.pow(2, n);
            firstVertex = createNull(x, y, r, n, options);
            vertices = filterVertices(firstVertex);
            createCube(vertices);
            break;
        case 'petersen':
            firstVertex = createNull(x, y, r, n = 5, options, - Math.PI / 2);
            vertices = filterVertices(firstVertex);
            createNull(x, y, r - r / 3.5, n = 5, options, - Math.PI / 2);
            vertices = filterVertices(firstVertex);
            createPetersen(vertices);
            break;
        case 'dodecahedron':
            firstVertex = createNull(x, y, r, n = 10, options);
            vertices = filterVertices(firstVertex);
            createNull(x, y, r - r / 3.5, n = 10, options);
            vertices = filterVertices(firstVertex);     // refresh vertices
            createDodecahedron(vertices);
            break;
        case 'wheel':
            firstVertex = createNull(x, y, r, n - 1, options);
            vertices = filterVertices(firstVertex);
            lastVertex = createChain(firstVertex, vertices);
            createCycle(firstVertex, lastVertex);
            createWheel(x, y, options, vertices);
            break;
        case 'complete_bipartite':
            createCompleteBipartite(x, y, r, inputR, inputS, options, isVertical);
            break;
        case 'octahedron':
            firstVertex = createNull(x, y, r, n = 3, options);
            vertices = filterVertices(firstVertex);
            lastVertex = createChain(firstVertex, vertices);
            createCycle(firstVertex, lastVertex);
            createNull(x, y, r - r / 1.25, n = 3, options, - Math.PI);
            vertices = filterVertices(firstVertex);
            createOctahedron(vertices);
            break;
        case 'icosahedron':
            firstVertex = createNull(x, y, r, n = 3, options);
            vertices = filterVertices(firstVertex);
            lastVertex = createChain(firstVertex, vertices);
            createCycle(firstVertex, lastVertex);
            createNull(x, y, r - r / 1.6, n = 6, options);
            vertices = filterVertices(firstVertex);
            createNull(x, y, r - r / 1.25, n = 3, options, - Math.PI);
            vertices = filterVertices(firstVertex);
            createIcosahedron(vertices);
            break;
        case 'prufer-decode':
            // passing n.length + 2 because the input is an array and
            // 2 because the graph represented with the prufer's sequence
            // has (n + 2) vertices
            firstVertex = createNull(x, y, r, n.length + 2, options);
            vertices = filterVertices(firstVertex);
            createPrufer(vertices, n, n.length + 2);
    }
    toolActive.current = Tool.UNDEFINED;
}

function createNull(x, y, r, n, options, angle = 0) {
    let firstVertex;
    // simulating mouse click on the draw vertex button
    clickDrawVertex();
    // simulating mouse click on the canvas
    let increment = (2 * Math.PI) / n;

    for (let i = 0; i < n; i++) {
        let offsetX = r * Math.cos(angle);
        let offsetY = r * Math.sin(angle);
        options.clientX = x + offsetX
        options.clientY = y + offsetY

        let event = new MouseEvent('click', options);
        canvas.dispatchEvent(event);
        angle += increment;
        if (i === 0) {
            let vertices = getAllVertices();
            firstVertex = vertices[vertices.length - 1];
        }
    }
    return firstVertex;
}

function createChain(firstVertex, vertices) {
    let firstVertexID = getIDFromVertex(firstVertex);
    vertices.filter(vertex => getIDFromVertex(vertex) >= firstVertexID);

    // simulating mouse click on the draw edge button
    clickDrawEdge();
    for (let i = 1; i < vertices.length; i++) {
        // clicking on the SVG elements is slightly different
        connect(vertices[i - 1], vertices[i]);
    }
    return vertices[vertices.length - 1];
}

function createCycle(firstVertex, lastVertex) {
    // createCycle is always called after createChain
    connect(firstVertex, lastVertex);
}

function createComplete(vertices) {
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 2; j < vertices.length; j++) {
            // don't connect the first and the last vertex again
            if (i === 0 && j === vertices.length - 1) break;
            connect(vertices[i], vertices[j]);
        }
    }
    // fix unwanted overlaying
    for (let i = 0; i < vertices.length; i++) {
        vertices[i].remove();
        canvas.append(vertices[i]);
        let text = getTextFromID(getIDFromVertex(vertices[i]));
        text.remove();
        canvas.append(text);
    }
}

function createWheel(x, y, options, oldVertices) {
    clickDrawVertex();
    options.clientX = x;
    options.clientY = y;
    let event = new MouseEvent('click', options);
    canvas.dispatchEvent(event);

    clickDrawEdge();
    let newVertices = getAllVertices();
    let lastVertex = newVertices[newVertices.length - 1];

    oldVertices.forEach(vertex => {
        connect(vertex, lastVertex);
    });
}

function createCompleteBipartite(x, y, r, cardR, cardS, options, isVertical) {
    let vertices = getAllVerticesSorted();

    class Point {

        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    class VertexSet {

        constructor(start, r, card) {
            this.start = start;
            this.card = card;
            this.spacing = 2 * r / (this.card + 1);
            this.points = [];

            for (let i = 1; i < this.card + 1; i++) {
                if (isVertical) {
                    this.points.push(new Point(this.start.x, this.start.y + i * this.spacing));
                } else {
                    this.points.push(new Point(this.start.x + i * this.spacing, this.start.y));
                }
            }
        }

        draw() {
            this.points.forEach(point => {
                options.clientX = point.x;
                options.clientY = point.y;
                canvas.dispatchEvent(new MouseEvent('click', options));
            });
        }
    }

    let setR = new VertexSet(
        new Point(isVertical ? x - r / 2 : x - r, isVertical ? y - r : y - r / 2), r, cardR
    );
    let setS = new VertexSet(
        new Point(isVertical ? x + r / 2 : x - r, isVertical ? y - r : y + r / 2), r, cardS
    );

    clickDrawVertex();
    setR.draw();
    setS.draw();

    vertices = _.difference(getAllVerticesSorted(), vertices);
    clickDrawEdge();
    for (let i = 0; i < cardR; i++) {
        for (let j = cardR; j < vertices.length; j++) {
            connect(vertices[i], vertices[j]);
        }
    }
}

function createCube(vertices) {
    clickDrawEdge();

    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            // convert vertex ID to binary string
            let bin1 = Number(getIDFromVertex(vertices[i]) - START_VERTEX_ID_COUNTER).toString(2);
            let bin2 = Number(getIDFromVertex(vertices[j]) - START_VERTEX_ID_COUNTER).toString(2);
            let lenDiff = bin2.length - bin1.length;

            for (let k = 0; k < lenDiff; k++) {
                bin1 = '0' + bin1;
            }
            let countDiff = 0;
            for (let k = 0; k < bin2.length; k++) {
                if (bin1[k] !== bin2[k]) {
                    countDiff++;
                }
            }
            // connecting vertices that differ by one digit
            if (countDiff === 1) {
                connect(vertices[i], vertices[j]);
            }
        }
    }
}

function createPetersen(vertices) {
    clickDrawEdge();

    for (let i = 0; i < 5; i++) {
        let j = i + 1;
        j %= 5;
        connect(vertices[i], vertices[j]);
        connect(vertices[i], vertices[i + 5]);
    }
    for (let i = 0; i < 5; i++) {
        let j = ((i + 2) % 5) + 5;
        connect(vertices[i + 5], vertices[j]);
    }
}

function createDodecahedron(vertices) {
    clickDrawEdge();

    for (let i = 0; i < 10; i++) {
        connect(vertices[i], vertices[i + 10]);
        connect(vertices[i + 10], vertices[i !== 9 ? (i + 10 + 1) % 20 : 10]);
        connect(vertices[i], vertices[(i + 2) % 10]);
    }
}

function createHeawood(vertices) {
    for (let i = 0; i < 14; i += 2) {
        connect(vertices[i], vertices[(i + 5) % 14]);
    }
}

function createGrotzsch(x, y, options, vertices) {
    clickDrawVertex();
    options.clientX = x;
    options.clientY = y;
    let event = new MouseEvent('click', options);
    canvas.dispatchEvent(event);
    let newVertices = getAllVertices();
    let lastVertex = newVertices[newVertices.length - 1];

    clickDrawEdge();
    vertices.forEach((vertex, i) => {
        if (i < 5) {
            if (i === 0) {
                connect(vertices[i], vertices[6]);
                connect(vertices[i], vertices[9]);
            }
            else {
                connect(vertices[i], vertices[i + 4]);
                i === 4 ? connect(vertices[i], vertices[i + 1]) : connect(vertices[i], vertices[i + 6]);
            }
        }
        else {
            // i in interval [5, 9]
            connect(vertex, lastVertex);
        }
    });
}

function createTetrahedron(x, y, options, vertices) {
    clickDrawVertex();
    options.clientX = x;
    options.clientY = y;
    let event = new MouseEvent('click', options);
    canvas.dispatchEvent(event);
    let newVertices = getAllVertices();
    let lastVertex = newVertices[newVertices.length - 1];

    clickDrawEdge();
    vertices.forEach(vertex => connect(vertex, lastVertex));
}

function createOctahedron(vertices) {
    clickDrawEdge();
    let index = vertices.length - 1 - 2;
    connect(vertices[index], vertices[index + 1]);
    connect(vertices[index], vertices[index + 2]);
    connect(vertices[index + 1], vertices[index + 2]);

    for (let i = 0; i < 3; i++) {
        if (i === 0) {
            connect(vertices[i], vertices[i + 4]);
            connect(vertices[i], vertices[i + 5]);
        }
        else if (i === 1) {
            connect(vertices[i], vertices[i + 2]);
            connect(vertices[i], vertices[i + 4]);
        }
        else {
            connect(vertices[i], vertices[i + 1]);
            connect(vertices[i], vertices[i + 2]);
        }
    }
}

function createIcosahedron(vertices) {
    clickDrawEdge();
    // inner connections
    let countIterOdd = 0, countIterEven = 0;
    for (let i = 3; i <= 8; i++) {
        if (i % 2 !== 0) {
            if (countIterOdd === 0) {
                connect(vertices[i], vertices[10]);
                connect(vertices[i], vertices[11]);
            }
            else if (countIterOdd === 1) {
                connect(vertices[i], vertices[9]);
                connect(vertices[i], vertices[11]);
            }
            else {
                connect(vertices[i], vertices[9]);
                connect(vertices[i], vertices[10]);
            }
            countIterOdd++;
        }
        else {
            if (countIterEven === 0) {
                connect(vertices[i], vertices[11]);
            }
            else if (countIterEven === 1) {
                connect(vertices[i], vertices[9]);
            }
            else {
                connect(vertices[i], vertices[10]);
            }
            countIterEven++;
        }
    }
    // outer connections
    let increment = 2;
    for (let i = 0; i < 3; i++) {
        for (let j = i + increment; j < i + increment + 3; j++) {
            i === 0 && j === 2 ? connect(vertices[i], vertices[8]) : connect(vertices[i], vertices[j]);
        }
        increment++;
    }
    // inner cycle
    let count = 3;
    let start = 9;
    for (let i = 0; i < count; i++) {
        connect(vertices[i + start], vertices[((i + 1) % count) + start]);
    }
    // middle cycle
    count = 6;
    start = 3;
    for (let i = 0; i < count; i++) {
        connect(vertices[i + start], vertices[((i + 1) % count) + start]);
    }
}

function createPrufer(vertices, sequence, n) {
    clickDrawEdge();
    const arr = _.range(START_VERTEX_ID_COUNTER, n, 1);

    // finds the smallest number in A that is not in B
    const findSmallestMissingNumber = (A, B) => {
        // Sort both lists in ascending order
        A = _.sortBy(A);
        B = _.sortBy(B);

        // Find the difference between A and B
        let difference = _.difference(A, B);

        // If the difference is empty, return null, otherwise return the smallest number and its index
        if (_.isEmpty(difference)) {
            return null;
        } else {
            let smallest = _.head(difference);
            let index = _.indexOf(A, smallest);
            return { smallest, index };
        }
    }
    while (!_.isEmpty(sequence)) {
        const res = findSmallestMissingNumber(arr, sequence);
        arr.splice(res.index, 1);

        const v1 = res.smallest;
        const v2 = sequence[0];
        sequence = _.drop(sequence, 1);
        connect(vertices[v1], vertices[v2]);
    }
    connect(vertices[arr[0]], vertices[arr[1]]);
}

function connect(v1, v2) {
    v1.dispatchEvent(new Event('click'));
    v2.dispatchEvent(new Event('click'));
}

function hideElemsByIDs(...IDs) { IDs.forEach(ID => document.querySelector(ID).style.visibility = 'hidden'); }
function unHideElemsByIDs(...IDs) { IDs.forEach(ID => document.querySelector(ID).style.visibility = 'visible'); }
function getIDFromVertex(el) { return parseInt(el.getAttribute('id').split('vertex-id-')[1]); }
function getTextFromID(id) { return document.querySelector(`#text-id-${ id }`); }
function getAllVertices() { return Array.from(document.querySelectorAll(`[id^='vertex-id-']`)); }

function getAllVerticesSorted() {
    return getAllVertices().sort((a, b) => getIDFromVertex(a) - getIDFromVertex(b));
}

function filterVertices(firstVertex) {
    let firstVertexID = getIDFromVertex(firstVertex);
    return getAllVertices()
        .filter(vertex => getIDFromVertex(vertex) >= firstVertexID)
        .sort((a, b) => getIDFromVertex(a) - getIDFromVertex(b));
}

export {
    createNull, connect, insertItemsToCanvas
}