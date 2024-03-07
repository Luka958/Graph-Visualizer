// all elements in the observed HTML section are having the same prefix
function setMatrix(prefix, min, max, isAdj) {
    let tableID = prefix + 'table';
    let gridID = prefix + 'grid';
    let matrixInputIDStart = prefix + 'table-input';
    let table = document.querySelector('#' + tableID);

    let sizeInputID = prefix + 'size-input-m';
    let size = document.querySelector('#' + sizeInputID);

    let sizeInputID2, size2;
    if (!isAdj) {
        sizeInputID2 = prefix + 'size-input-n';
        size2 = document.querySelector('#' + sizeInputID2);
    }
    let inputListener = () => {
        let str = ``;
        let m = parseInt(size.value);
        let n;
        if (!isAdj) {
            n = parseInt(size2.value);
        }
        for (let i = 0; i < m; i++) {
            str += `<tr>`;
            for (let j = 0; j < (!isAdj ? n : m); j++) {
                str += `
            <td>
                <input id="${ matrixInputIDStart }-${i}-${j}" 
                       name="${ matrixInputIDStart }-${i}-${j}" 
                       class=".no-spin" 
                       type="number" 
                       min="${ min }"
                       max="${ max }"
                       oninput="validity.valid||(value='');">
            </td>`;
            }
            str += `</tr>`;
        }
        table.innerHTML = str;
        if (isAdj) {
            setDiagonalAutoComplete(matrixInputIDStart, m);
        }
    }
    if (!isAdj) {
        // user fills first, then second input
        size.addEventListener('input', () => size2.addEventListener('input', inputListener));
        // reversed
        size2.addEventListener('input', () => size.addEventListener('input', inputListener));
    }
    else {
        size.addEventListener('input', inputListener);
    }
    activateArrowKeys(tableID, gridID, matrixInputIDStart, isAdj);
}

function activateArrowKeys(tableID, gridID, matrixInputIDStart, isAdj) {
    let table = document.querySelector('#' + tableID);
    let grid = document.querySelector('#' + gridID);

    let observer = new MutationObserver(() => {
        // properly center matrix in the grid, remove centering when the overflow occurs
        if (grid.scrollHeight > grid.clientHeight) {
            table.style.left = 'unset';
            table.style.transform = 'none';
        }
        else {
            table.style.left = '50%';
            table.style.transform = 'translateX(-50%)';
        }
        let inputs = Array.from(document.querySelectorAll(`[id^="${ matrixInputIDStart }"]`));
        let m, n;
        if (isAdj) {
            m = Math.sqrt(inputs.length);
            n = m;
        }
        else {
            n = document.querySelectorAll(`[id^="${ matrixInputIDStart }-0"]`).length;
            m = inputs.length / n;
        }
        for (let index = 0; index < inputs.length; index++) {
            inputs[index].addEventListener('keydown', event => {
                let obj = extractIJ(matrixInputIDStart, inputs[index].id);
                let selector = '#' + matrixInputIDStart + '-';
                let selStartLen = selector.length;
                // focus next input
                if (event.keyCode === 37) {
                    // left arrow press
                    if (isAdj && obj.i === obj.j && obj.i !== 0) {
                        selector += (obj.i - 1) + '-' + (m - 1);
                    }
                    else if (obj.j - 1 >= 0) {
                        selector += obj.i + '-' + (obj.j - 1);
                    }
                    else if (obj.i - 1 >= 0) {
                        selector += (obj.i - 1) + '-' + (n - 1);
                    }
                }
                else if (event.keyCode === 39) {
                    // right arrow press
                    if (obj.j + 1 < n) {
                        selector += obj.i + '-' + (obj.j + 1);
                    }
                    else if (obj.i + 1 < m) {
                        selector += (obj.i + 1) + '-' + (isAdj ? (obj.i + 1) : 0);
                    }
                }
                if (selector.length > selStartLen) {
                    // we have appended some data e.g. we need focus
                    document.querySelector(selector).focus();
                }
            });
        }
    });
    observer.observe(table, { childList: true });
}

function extractIJ(matrixInputIDStart, ID) {
    let result = [];
    ID.split(matrixInputIDStart + '-')[1].split('-').forEach(num => result.push(parseInt(num)));
    return { i: result[0], j: result[1] };
}

function setDiagonalAutoComplete(matrixInputIDStart, m) {
    let inputs = Array.from(document.querySelectorAll(`[id^="${ matrixInputIDStart }"]`));

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            let index = i * m + j;
            if (j >= i) {
                if (i !== j) {
                    let oppositeInput = document.querySelector(`#${matrixInputIDStart}-${j}-${i}`);
                    inputs[index].addEventListener('input', () => {
                        oppositeInput.value = inputs[i * m + j].value;
                    });
                } else {
                    inputs[index].style.backgroundColor = '#fc8955';
                    inputs[index].style.color = 'white';
                }
            }
            else {
                // disable inputs from an opposite side
                inputs[index].style.backgroundColor = 'midnightblue';
                inputs[index].style.color = 'white';
                inputs[index].disabled = 'true';
            }
        }
    }
}

// isInc is true only when function in called from getIncMatrixValues()
// dim(adjMat) = m x m (rows x columns) | m - number of vertices
function getAdjMatrixValues(prefix, offset) {
    // matrix with the positive values only
    let matrix = [];
    let elements = Array.from(document.querySelectorAll(`[id^="${ prefix + 'table-input' }"]`));
    let values = elements.map(el => { return el.value === '' ? 0 : parseInt(el.value) });
    let m = Math.sqrt(elements.length);

    for (let i = 0; i < m; i++) {
        // we are observing an upper triangle only
        for (let j = i; j < m; j++) {
            // [i, j] is the pair of vertices ID's, the last value is an edge count
            // if there are some vertices in the canvas already, we have to offset IDs
            let value = values[i * m + j];
            if (value !== 0) {
                matrix.push([[i + offset, j + offset], value]);
            }
        }
    }
    return [matrix, m];
}

// dim(incMat) = m x n (rows x columns) | m - number of vertices
function getIncMatrixValues(prefix, offset) {
    let matrix = [];
    let elements = Array.from(document.querySelectorAll(`[id^="${ prefix + 'table-input' }"]`));
    let values = elements.map(el => { return el.value === '' ? 0 : parseInt(el.value) });
    let n = document.querySelectorAll(`[id^="${ prefix + 'table-input-0' }"]`).length;
    let m = elements.length / n;

    for (let j = 0; j < n; j++) {
        let firstValue = null;
        let firstIndex = null;
        for (let i = 0; i < m; i++) {
            let value = values[i * n + j];
            if (value === 1) {
                firstValue === null ?
                    [firstValue, firstIndex] = [value, i] :
                    matrix.push([firstIndex + offset, i + offset]);
            }
        }
    }
    return [matrix, m, n];
}

export {
    setMatrix, getAdjMatrixValues, getIncMatrixValues
}