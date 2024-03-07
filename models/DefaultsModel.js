// names of the vertexSVG and edgeSVG attributes are valid SVG properties
let vertexProps = {
    fill: '#7b68ee',
    stroke: '#1c0952',
    'stroke-width': '2',

    circle: {
        r: 15
    },
    square: {
        base: 30
    },
    rectangle: {
        width: 40,
        height: 30
    },
    triangle: {
        base: 35
    },
    polygon: {
        base: 20,
        angles: 5
    }
}

let edgeProps = {
    stroke: '#1c0952',
    'stroke-width': '2',
    'scale-loop': '0.2'
}

let vertexSVG = {
    shape: 'circle',
    fill: '#7b68ee',
    stroke: '#1c0952',
    'stroke-width': '2',
    r: '15'
}

let edgeSVG = {
    shape: 'path',
    stroke: '#1c0952',
    'stroke-width': '2',
    'scale-loop': '0.2'
}

let canvasProps = {
    canvasType: 'grid',
    gridType: 'single',
    backgroundColor: '#fc8955',
    gridColor: 'white',
    thin: {
        min: 0.5,
        max: 5,
        step: 0.5,
        value: 1
    },
    wide: {
        min: 1,
        max: 10,
        step: 0.5,
        value: 2.5
    }
}

module.exports = { vertexProps, edgeProps, canvasProps, vertexSVG, edgeSVG };