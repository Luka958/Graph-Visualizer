function isAllowedByVertexSize(x, y, vertex, canvasOffset) {
    let vertexOffset = vertex.getBoundingClientRect();
    let strokeWidth = parseInt(vertex.getAttribute('stroke-width'));

    return !(
        (x - vertexOffset.width / 2 - strokeWidth < canvasOffset.left) ||
        (y - vertexOffset.height / 2 - strokeWidth < canvasOffset.top ) ||
        (x + vertexOffset.width / 2 + strokeWidth + ADDITIONAL_CANVAS_OFFSET_X > canvasOffset.right) ||
        (y + vertexOffset.height / 2 + strokeWidth + ADDITIONAL_CANVAS_OFFSET_Y > canvasOffset.bottom));
    // TODO canvas padding bottom and right (5)
}

function isAllowedByArrowSize(arrowOffset, canvasOffset, loopOffset) {

    return (loopOffset.left - arrowOffset.width / 2 - canvasOffset.left >= 0) &&
        (loopOffset.top - arrowOffset.height / 2 - canvasOffset.top >= 0);
}

function isAllowedByWeightItemSize(weightItemOffset, canvasOffset, loopOffset) {

    return (loopOffset.left - weightItemOffset.width / 2 - canvasOffset.left >= 0) &&
        (loopOffset.top - weightItemOffset.height / 2 - canvasOffset.top >= 0);
}

// TODO - add warning card when outside of the canvas and when user tries to DRAW a loop outside

export { isAllowedByVertexSize, isAllowedByArrowSize, isAllowedByWeightItemSize }