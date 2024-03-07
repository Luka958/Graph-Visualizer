// show or hide elements depending on radio buttons
function setShowOrHide() {
    showOrHide('.show-if-grid', ['#canvas-radio-solid', '#canvas-radio-grid'], ['none', 'initial']);
    showOrHide('.show-if-double', ['#canvas-radio-single', '#canvas-radio-double'], ['none', 'initial']);
}
setShowOrHide();

function showOrHide(showIfClass, radioBtnIDs, displayStates) {
    console.assert(radioBtnIDs.length === displayStates.length);

    let showIfElement = Array.from(document.querySelectorAll(showIfClass));
    for (let i = 0; i < radioBtnIDs.length; i++) {
        let radioBtnElement = document.querySelector(radioBtnIDs[i]);
        radioBtnElement.addEventListener('change', () => {
            showIfElement.forEach(el => el.style.display = displayStates[i]);
        });
    }
}

// adjust (customize) already existing reset button functionality
document.querySelector('#reset-canvas').addEventListener('click', () => {
    let single = document.querySelector('#canvas-radio-single');
    if (single.value === 'single') {
        Array.from(document.querySelectorAll('.show-if-double')).forEach(el => el.style.display = 'none');
    }
    let grid = document.querySelector('#canvas-radio-grid');
    if (grid.value === 'grid') {
        Array.from(document.querySelectorAll('.show-if-grid')).forEach(el => el.style.display = 'initial');
    }
});

// generate grid and change colors
function setConfig(canvasType, gridType, backgroundColor, gridColor, thin, wide) {
    let canvas = document.querySelector('.canvas');
    if (canvasType === 'grid') {
        const gridSizeSmall = 15.3;
        const gridSizeLarge = gridSizeSmall * 10;
        // source: https://svgshare.com/i/eGa.svg
        // note: don't refactor the structure because it can cause additional
        // text nodes in the canvases child list
        let str =
            `<defs class="canvas-config">
            <pattern id="smallGrid" width="${gridSizeSmall}" height="${gridSizeSmall}" patternUnits="userSpaceOnUse">
                <path 
                    d="M ${gridSizeSmall} 0 L 0 0 0 ${gridSizeSmall}" 
                    fill="none" 
                    stroke="${gridColor}" 
                    stroke-width="${ thin.value || thin }"
                />
            </pattern>`;
        // thin.value || thin (if thin.value is undefined/null/empty string, set wide)
        if (gridType === 'double') {
            str +=
            `<pattern id="largeGrid" width="${gridSizeLarge}" height="${gridSizeLarge}" patternUnits="userSpaceOnUse">
                <rect width="${gridSizeLarge}" height="${gridSizeLarge}" fill="url(#smallGrid)"/>
                <path 
                    d="M ${gridSizeLarge} 0 L 0 0 0 ${gridSizeLarge}" 
                    fill="none" 
                    stroke="${gridColor}" 
                    stroke-width="${ wide.value || wide }"
                />
            </pattern>`
        }
        str +=
            `</defs><rect class="canvas-config" style="pointer-events: none"
                  width="100%" height="100%" 
                  fill="url(#${ gridType === 'double' ? 'largeGrid' : 'smallGrid' })" 
                  stroke="white" 
                  stroke-width="${ gridType === 'double' ? wide.value || wide : thin.value || thin }px"
            />`;
        canvas.innerHTML += str;
    }
    canvas.style.backgroundColor = backgroundColor;
}

function getCanvasProps() { return JSON.parse(document.querySelector('#canvasProps').innerHTML); }
setConfig(...Object.values(getCanvasProps()));

function updateConfig() {
    let formData = new FormData(document.querySelector('#canvas-properties form'));
    // make changes on the client side
    // remove old canvas configuration
    let canvas = document.querySelector('.canvas');
    Array.from(document.querySelectorAll('.canvas-config')).forEach(el => canvas.removeChild(el));
    // set new canvas configuration
    setConfig(
        formData.get('canvas-type-radio') === 'solid' ? 'solid' : 'grid',
        formData.get('grid-type-radio') === 'single' ? 'single' : 'double',
        formData.get('canvas-background-color'),
        formData.get('canvas-grid-color'),
        formData.get('canvas-thin-line-width'),
        formData.get('canvas-wide-line-width')
    );
    // update session.canvasProps on the server side
    let request = new Request('/canvas', {
        method: 'POST',
        body: formData
    });
    // async function
    fetch(request).then();
}

// save button click in canvas properties
document.querySelector('#save-canvas').addEventListener('click', () => {
    updateConfig();
    // hide canvas properties
    document.querySelector('#canvas-properties').style.visibility = 'hidden';
});