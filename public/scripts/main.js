let canvas = document.querySelector('.canvas');

/**
 * function that changes HTML element position depending on where user moves it
 * by using cursor coordinates and event handlers, moving can be achieved only
 * when user clicks on heading of the given element
 * @param element - an element that is going to be moved
 * @param headingSelector - ex. '#weight', '.weight' etc.
 */
let dragHTMLElement = (element, headingSelector) => {
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    let parentId = element.getAttribute("id");

    document.querySelector('#' + parentId + ' > ' + headingSelector).onmousedown = (down) => {
        x2 = down.clientX;
        y2 = down.clientY;

        // disable moving on the mouse click release
        document.onmouseup = () => document.onmouseup = document.onmousemove = null;

        // move html element when the cursor moves
        document.onmousemove = (move) => {
            // new cursor position:
            x1 = x2 - move.clientX;
            y1 = y2 - move.clientY;
            x2 = move.clientX;
            y2 = move.clientY;
            // update element position
            const bounds = element.getBoundingClientRect();
            if ((element.offsetLeft - x1 + bounds.width / 2 > window.innerWidth) ||
                (element.offsetTop - y1 + bounds.height / 2 > window.innerHeight)) {
                return;
            }
            element.style.top = (element.offsetTop - y1) + 'px';
            element.style.left = (element.offsetLeft - x1) + 'px';
        }
    }
}

let propertyArr = [];
let propertyActivatorArr = ['#vertex', '#edge', '#algorithm', '#canvas'];

let properties = document.querySelectorAll('.properties');
properties.forEach(property => {
    propertyArr.push(property);
    dragHTMLElement(property, '.component-heading');
});
propertyActivatorArr.forEach((activator, index) => {
    activator = document.querySelector(activator);
    activator.addEventListener('click', () => {
        propertyArr[index].style.visibility = 'visible';
    });
});

/**
 * sets relevant property window to the front
 */
function setupProperties() {
    const toolbarProperties = document.querySelectorAll('.toolbar-properties');
    toolbarProperties.forEach(toolbarProperty => {
        dragHTMLElement(toolbarProperty, '.component-heading');
    });
    const properties = document.querySelectorAll('.properties');
    const props = [...Array.from(properties), ...Array.from(toolbarProperties)];

    const handleClick = (currProp) => {
        const zIndexMax = getZIndexMax(props);

        if (parseInt(currProp.style.zIndex) === zIndexMax) {
            // already in the front
            return;
        }
        for (let prop of props) {
            const zIndex = parseInt(prop.style.zIndex);
            if (prop === currProp) {
                prop.style.zIndex = `${ zIndexMax + 1 }`;

            } else if (zIndex > 0) {
                prop.style.zIndex = `${ zIndex - 1 }`;
            }
        }
    };

    const visibleTargetIds = [];
    const visibilityObserver = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.attributeName !== 'style') {
                continue;
            }
            const target = mutation.target;

            if (!visibleTargetIds.includes(target.id) && target.style.visibility === 'visible') {
                const zIndexMax = getZIndexMax(props);
                target.style.zIndex = (zIndexMax + 1).toString();
                visibleTargetIds.push(target.id);

            } else if (target.style.visibility === 'hidden') {
                const index = visibleTargetIds.indexOf(target.id);
                if (index > -1) {
                    visibleTargetIds.splice(index, 1);
                }
                // reset zIndex to 0 on close
                target.style.zIndex = '0';
            }
        }
    });

    props.forEach((prop, index) => {
        prop.style.zIndex = index === 0 ? '1' : '0';
        prop.addEventListener('mousedown', () => handleClick(prop));
        visibilityObserver.observe(prop, { attributes: true });
    });
}
setupProperties();

function getZIndexMax(elements) {
    return parseInt(elements.reduce((prev, curr) => {
        return (parseInt(prev.style.zIndex) > parseInt(curr.style.zIndex)) ? prev : curr;
    }).style.zIndex);
}

/**
 * Show value of any slider.
 * @param value - HTML element(s) id or class to which we are setting value
 * @param slider - HTML element(s) id or class that has value attribute
 */
let showSliderValue = (value, slider) => {
    value = document.querySelectorAll(value);
    slider = document.querySelectorAll(slider);

    for (let i = 0; i < value.length; i++) {
        value[i].innerHTML = slider[i].value;
        slider[i].addEventListener('input', () => {
            value[i].innerHTML = slider[i].value;
        });
    }
}

showSliderValue('#vertex-border-width-val', '#vertex-border-width');
showSliderValue('.hidden-slider-val', '.slider');
showSliderValue('#edge-width-val', '#edge-width');
showSliderValue('#scale-loop-val', '#scale-loop');
showSliderValue('#canvas-thin-line-width-val', '#canvas-thin-line-width');
showSliderValue('#canvas-wide-line-width-val', '#canvas-wide-line-width');

// ---------------- import section ---------------- //
let importDiv = document.querySelector('#import-div');
let importButton = document.querySelector('#import-canvas');
importButton.addEventListener('click', () => {
    importDiv.style.visibility = 'visible';
});
let cancelImportBtn = document.querySelector('#cancel-import-button');
cancelImportBtn.addEventListener('click', () => {
    importDiv.style.visibility = 'hidden';
});

// ---------------- export section ---------------- //
let exportDiv = document.querySelector('#export-div');

let exportBtn = document.querySelector('#export-canvas');
exportBtn.addEventListener('click', () => {
    exportDiv.style.visibility = 'visible';
});
let cancelExportBtn = document.querySelector('#cancel-export-button');
cancelExportBtn.addEventListener('click', () => {
    exportDiv.style.visibility = 'hidden';
});
let confirmExportBtn = document.querySelector('#confirm-export-button');
confirmExportBtn.addEventListener('click', () => {
    exportDiv.style.visibility = 'hidden';
});

// ---------------- weight section ---------------- //
let weightDiv = document.querySelector('#weight-div');
let cancelWeightBtn = document.querySelector('#cancel-weight-button');
cancelWeightBtn.addEventListener('click', () => weightDiv.style.visibility = 'hidden');
let saveWeightBtn = document.querySelector('#save-weight-button');
saveWeightBtn.addEventListener('click', () => weightDiv.style.visibility = 'hidden');

// ---------------- clear canvas section ---------------- //
let clearCanvasDiv = document.querySelector('#clear-canvas-div');

let clearCanvasBtn = document.querySelector('#operation-img-3');
clearCanvasBtn.addEventListener('click', () => clearCanvasDiv.style.visibility = 'visible');

let cancelClearCanvasBtn = document.querySelector('#cancel-clear-canvas-button');
cancelClearCanvasBtn.addEventListener('click', () => clearCanvasDiv.style.visibility = 'hidden');
let confirmClearCanvasBtn = document.querySelector('#confirm-clear-canvas-button');
confirmClearCanvasBtn.addEventListener('click', () => clearCanvasDiv.style.visibility = 'hidden');

// ---------------- data section ---------------- //
let showDataDiv = document.querySelector('#show-data-div');
let dataBtn = document.querySelector('#data');
dataBtn.addEventListener('click', () => showDataDiv.style.visibility = 'visible');

let cancelShowDataBtn = document.querySelector('#cancel-show-data-button');
cancelShowDataBtn.addEventListener('click', () => showDataDiv.style.visibility = 'hidden');
let saveShowDataBtn = document.querySelector('#save-show-data-button');
saveShowDataBtn.addEventListener('click', () => showDataDiv.style.visibility = 'hidden');

// ---------------- graph menu section ---------------- //
let graphMenuDiv = document.querySelector('#graph-menu-div');
let graphBtn = document.querySelector('#graph');
graphBtn.addEventListener('click', () => graphMenuDiv.style.visibility = 'visible');
// set canvas dimensions
canvas.onload = () => {
    let canvas = document.querySelector('.canvas');
    let bounds = canvas.getBoundingClientRect();
    // calculate canvas height depending on the header height
    canvas.style.height = `${ Math.fround(screen.height - bounds.top) }`;
    canvas.style.width = `${ Math.fround(window.width - bounds.left) }`;
    canvas.style.paddingRight = `5px`;
    canvas.style.paddingBottom = `5px`;
}