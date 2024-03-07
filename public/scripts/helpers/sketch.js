// line drawing source: https://javascript.plainenglish.io/
// how-to-draw-a-smooth-curve-through-n-points-using-javascript-html5-canvas-86ecb84b6d6d

import {getAll} from "../models/DrawingHelperModel";

const TOOL_BORDER = '1px solid white';
const TEXT_BORDER_WIDTH = 2;
const TEXT_SVG_CLASS = 'sketch-text';
const MODES = ['pencil', 'pen', 'brush'];
const PENCIL_STROKE_COLOR = '#4d4d4d';
const PENCIL_SHADOW_COLOR = 'rgba(0, 0, 0, 0)';

class SketchManager {

    canvas;
    tool;
    fontSize;
    drawListeners;
    eraseListeners;
    textEraseListeners = new Map();

    static instance = new SketchManager();

    constructor() {
        this.canvas = initSketch();
        this.tool = 'none';
        this.fontSize = '16px';
    }

    static getInstance() {
        return SketchManager.instance;
    }

    init(onExit) {
        if (SketchManager.initialized === true) {
            return;
        }
        const exitBtn = document.querySelector('#sketch-tool-exit');
        exitBtn.addEventListener('click', () => onExit());
        SketchManager.initialized = true;
    }

    handleToolChange() {
        if (this.tool === 'draw') this.drawExit();
        else if (this.tool === 'erase') this.eraseExit();
    }

    draw(mode) {
        this.handleToolChange();
        this.tool = 'draw';

        if (!MODES.includes(mode)) {
            throw Error('Invalid tool in draw!');
        }
        const bounds = this.canvas.getBoundingClientRect();
        const offsetX = bounds.left;
        const offsetY = bounds.top;

        const context = this.canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.imageSmoothingEnabled = true;
        context.globalCompositeOperation = 'source-over';

        let drawingActive = false;

        const palette = document.querySelector('#sketch-toolbar-color-palette');
        const thickness = parseInt(document.querySelector('#thickness-value').innerHTML.split('px')[0]);

        const mousedown = (e) => {
            if (mode === 'pencil') {
                context.strokeStyle = PENCIL_STROKE_COLOR;
                context.lineWidth = thickness;
                context.shadowColor = PENCIL_SHADOW_COLOR;
                context.shadowBlur = 0;

            } else {
                context.strokeStyle = palette.getAttribute('color');

                if (mode === 'brush') {
                    context.shadowColor = palette.getAttribute('color');
                    context.shadowBlur = 0.2 * thickness;
                    context.lineWidth = thickness - 2 * context.shadowBlur;

                } else if (mode === 'pen') {
                    context.lineWidth = thickness;
                }
            }
            drawingActive = true;
            context.moveTo(e.clientX - offsetX, e.clientY - offsetY);
        };
        const mousemove = (e) => {
            if (!drawingActive) {
                return;
            }
            context.lineTo(e.clientX - offsetX, e.clientY - offsetY);
            context.stroke();
        };
        const mouseup = () => {
            drawingActive = false;
            context.beginPath();
        };
        this.canvas.addEventListener('mousedown', mousedown);
        this.canvas.addEventListener('mousemove', mousemove);
        this.canvas.addEventListener('mouseup', mouseup);
        this.drawListeners = { mousedown, mousemove, mouseup };
    }

    drawExit() {
        this.canvas.removeEventListener('mousedown', this.drawListeners.mousedown);
        this.canvas.removeEventListener('mousemove', this.drawListeners.mousemove);
        this.canvas.removeEventListener('mouseup', this.drawListeners.mouseup);
        this.drawListeners = null;
    }

    erase() {
        this.handleToolChange();
        this.tool = 'erase';

        const bounds = this.canvas.getBoundingClientRect();
        const offsetX = bounds.left;
        const offsetY = bounds.top;

        const context = this.canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.imageSmoothingEnabled = true;
        context.globalCompositeOperation = 'destination-out';

        let erasingActive = false;

        const mousedown = (e) => {
            context.lineWidth = parseInt(document.querySelector('#thickness-value').innerHTML.split('px')[0]);
            erasingActive = true;
            context.moveTo(e.clientX - offsetX, e.clientY - offsetY);
        };
        const mousemove = (e) => {
            if (!erasingActive) {
                return;
            }
            context.lineTo(e.clientX - offsetX, e.clientY - offsetY);
            context.stroke();
        };
        const mouseup = () => {
            erasingActive = false;
            context.beginPath();
        };
        this.canvas.addEventListener('mousedown', mousedown);
        this.canvas.addEventListener('mousemove', mousemove);
        this.canvas.addEventListener('mouseup', mouseup);
        this.eraseListeners = { mousedown, mousemove, mouseup };

        this.addTextEraseListeners();
    }

    eraseExit() {
        this.canvas.removeEventListener('mousedown', this.eraseListeners.mousedown);
        this.canvas.removeEventListener('mousemove', this.eraseListeners.mousemove);
        this.canvas.removeEventListener('mouseup', this.eraseListeners.mouseup);
        this.eraseListeners = null;

        this.removeTextEraseListeners();
    }

    addTextEraseListeners() {
        const texts = getAll('.' + TEXT_SVG_CLASS);
        if (texts === null) return;

        texts.forEach(text => {
            if (this.textEraseListeners.has(text)) {
                text.addEventListener('click', this.textEraseListeners.get(text));

            } else {
                text.addEventListener('click', () => {
                    SVG_CANVAS.removeChild(text);
                    this.textEraseListeners.delete(text);
                });
            }
        });
    }

    removeTextEraseListeners() {
        this.textEraseListeners.forEach((val, key) => key.removeEventListener('click', val));
    }

    text() {
        this.handleToolChange();
        this.tool = 'text';

        const palette = document.querySelector('#sketch-toolbar-color-palette');
        const div = document.createElement('div');
        div.className = 'sketch-text-div';
        div.style.border = `${ TEXT_BORDER_WIDTH }px solid midnightblue`;

        const textArea = document.createElement('textarea');
        textArea.spellcheck = false;
        textArea.style.color = palette.getAttribute('color');
        textArea.style.fontSize = this.fontSize;
        textArea.style.resize = 'none';
        textArea.style.overflowWrap = 'normal';

        textArea.addEventListener('blur', () => {  // textArea is unfocused
            const bounds = textArea.getBoundingClientRect();
            const textBtn = document.querySelector('#sketch-tool-text');
            const text = document.createElementNS(SVG_NS_URI, 'text');
            const x = bounds.left + TEXT_BORDER_WIDTH - SVG_CANVAS_BOUNDS.left;
            const y = bounds.top + TEXT_BORDER_WIDTH - SVG_CANVAS_BOUNDS.top;

            text.setAttribute('x', x.toString());
            text.setAttribute('y', y.toString());
            text.setAttribute('font-size', textArea.style.fontSize);
            text.setAttribute('fill', palette.getAttribute('color'));
            text.setAttribute('class', TEXT_SVG_CLASS);

            textArea.value.split('\n').forEach(line => {
                const tspan = document.createElementNS(SVG_NS_URI, 'tspan');
                tspan.setAttribute('x', text.getAttribute('x'));
                tspan.setAttribute('dy', '1.2em');
                tspan.textContent = line;

                text.appendChild(tspan);
            });
            div.remove();
            SVG_CANVAS.appendChild(text);
            textBtn.style.border = 'none';
        });

        textArea.style.color = palette.getAttribute('color');

        textArea.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === '+') {
                e.preventDefault();
                const size = parseInt(textArea.style.fontSize.split('px')[0]);
                if (size < 100) {
                    textArea.style.fontSize = `${ size + 1 }px`;
                }
            } else if (e.ctrlKey && e.key === '-') {
                e.preventDefault();
                const size = parseInt(textArea.style.fontSize.split('px')[0]);
                if (size > 2) {
                    textArea.style.fontSize = `${ size - 1 }px`;
                }
            }
        });

        let x0, y0;
        const mousedown = (e) => {
            document.body.appendChild(div);
            document.addEventListener('mousemove', mousemove);

            div.style.left = `${ x0 = e.clientX }px`;
            div.style.top = `${ y0 = e.clientY }px`;
        };
        const mousemove = (e) => {
            if (!isPointWithinSVGCanvas(e.clientX, e.clientY)) {
                return;
            }
            div.style.left = `${ Math.min(x0, e.clientX) }px`;
            div.style.width = `${ Math.abs(x0 - e.clientX) }px`;
            div.style.top = `${ Math.min(y0, e.clientY) }px`;
            div.style.height = `${ Math.abs(y0 - e.clientY) }px`;
        };
        const mouseup = () => {
            document.removeEventListener('mousedown', mousedown);
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', mouseup);

            div.append(textArea);
            move(div, textArea);
            textArea.focus();
        };
        document.addEventListener('mousedown', mousedown);
        document.addEventListener('mouseup', mouseup);
    }

    reset(confirmed) {
        this.handleToolChange();
        this.tool = 'reset';

        if (confirmed) {
            this.canvas.getContext('2d').reset();
        }
    }
}

function initSketch() {
    const sketchToolbar = document.querySelector('#sketch-toolbar');

    const sketchCanvas = document.createElement('canvas');
    sketchCanvas.width = SVG_CANVAS_BOUNDS.width;
    sketchCanvas.height = SVG_CANVAS_BOUNDS.height;
    sketchCanvas.style.left = SVG_CANVAS_BOUNDS.left.toString().concat('px');
    sketchCanvas.style.top = SVG_CANVAS_BOUNDS.top.toString().concat('px');
    sketchCanvas.style.position = 'absolute';
    sketchCanvas.style.backgroundColor = 'none';
    setInvisible(sketchCanvas);
    document.body.appendChild(sketchCanvas);

    // resize drawing sketchCanvas whenever SVG sketchCanvas resizes
    const resizeObserver = new ResizeObserver((entries) => {
        const rect = entries[0].contentRect;
        sketchCanvas.width = rect.width;
        sketchCanvas.height = rect.height;
    });
    resizeObserver.observe(SVG_CANVAS);

    const sketchBtn = document.querySelector('#operation-img-10');
    sketchBtn.addEventListener('click', () => {
        sketchCanvas.style.zIndex = '5';
        sketchToolbar.style.zIndex = '10';

        setVisible(sketchCanvas);
        setVisible(sketchToolbar);
    });

    initSketchTools(sketchCanvas, sketchToolbar);
    initThickness();
    initTextErase(sketchCanvas);

    return sketchCanvas;
}

function initSketchTools(sketchCanvas, sketchToolbar) {
    const pencil = document.querySelector('#sketch-tool-pencil');
    const pen = document.querySelector('#sketch-tool-pen');
    const brush = document.querySelector('#sketch-tool-brush');
    const eraser = document.querySelector('#sketch-tool-eraser');
    const text = document.querySelector('#sketch-tool-text');
    const reset = document.querySelector('#sketch-tool-reset');
    const exit = document.querySelector('#sketch-tool-exit');

    const sketchResetDiv = document.querySelector('#sketch-reset-div');
    sketchResetDiv.style.zIndex = '10';

    let clicked = null;

    const setClickedBorder = () => clicked !== null ? clicked.style.border = 'none' : undefined;

    pencil.addEventListener('click', () => {
        setClickedBorder();
        pencil.style.border = TOOL_BORDER;
        clicked = pencil;
        SketchManager.getInstance().draw('pencil');
    });
    pen.addEventListener('click', () => {
        setClickedBorder();
        pen.style.border = TOOL_BORDER;
        clicked = pen;
        SketchManager.getInstance().draw('pen');
    });
    brush.addEventListener('click', () => {
        setClickedBorder();
        brush.style.border = TOOL_BORDER;
        clicked = brush;
        SketchManager.getInstance().draw('brush');
    });
    eraser.addEventListener('click', () => {
        setClickedBorder();
        eraser.style.border = TOOL_BORDER;
        clicked = eraser;
        SketchManager.getInstance().erase('eraser');
    });
    text.addEventListener('click', () => {
        setClickedBorder();
        text.style.border = TOOL_BORDER;
        clicked = text;
        SketchManager.getInstance().text();
    });
    reset.addEventListener('click', () => {
        setClickedBorder();
        reset.style.border = TOOL_BORDER;
        clicked = reset;
        setVisible(sketchResetDiv);
    });
    exit.addEventListener('click', () => {
        setClickedBorder();
        clicked = null;
        setInvisible(sketchToolbar);
        setInvisible(sketchCanvas);
    });

    const confirmSketchReset = document.querySelector('#confirm-sketch-reset-button');
    const cancelSketchReset = document.querySelector('#cancel-sketch-reset-button');

    confirmSketchReset.addEventListener('click', () => {
        clicked !== null ? clicked.style.border = 'none' : undefined;
        clicked = null;
        SketchManager.getInstance().reset(true);
        setInvisible(sketchResetDiv);
    });

    cancelSketchReset.addEventListener('click', () => {
        clicked !== null ? clicked.style.border = 'none' : undefined;
        clicked = null;
        SketchManager.getInstance().reset(false);
        setInvisible(sketchResetDiv);
    });
}

function initThickness() {
    const plus = document.querySelector('#sketch-tool-plus');
    const minus = document.querySelector('#sketch-tool-minus');
    const value = document.querySelector('#thickness-value');

    plus.addEventListener('click', () => {
        const num = parseInt(value.innerHTML.split('px')[0]);
        if (num < 25) {
            value.innerHTML = `${ num + 1 }px`;
        }
    });
    minus.addEventListener('click', () => {
        const num = parseInt(value.innerHTML.split('px')[0]);
        if (num > 1) {
            value.innerHTML = `${ num - 1 }px`;
        }
    });
}

function initTextErase(sketchCanvas) {
    sketchCanvas.addEventListener('click', (e) => {
        const rect = SVG_CANVAS.createSVGRect();
        rect.x = e.clientX - SVG_CANVAS_BOUNDS.left;
        rect.y = e.clientY - SVG_CANVAS_BOUNDS.top;
        rect.width = 1;
        rect.height = 1;

        const intersectionList = SVG_CANVAS.getIntersectionList(rect, null);
        if (intersectionList.length === 0) {
            return;
        }
        const topElement = intersectionList[intersectionList.length - 1];

        if (topElement.classList.contains(TEXT_SVG_CLASS)) {
            // don't delete something that isn't a sketch text
            topElement.dispatchEvent(new MouseEvent('click'));
        }
    });
}

/**
 * text area special case moving
 * @param el the element that is moved
 * @param ctrl the element that controls the movement (activates moving)
 */
function move(el, ctrl) {
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    ctrl.onmousedown = (down) => {
        x2 = down.clientX;
        y2 = down.clientY;

        document.onmouseup = () => document.onmouseup = document.onmousemove = null;
        document.onmousemove = (move) => {
            x1 = x2 - move.clientX;
            y1 = y2 - move.clientY;
            x2 = move.clientX;
            y2 = move.clientY;

            const bounds = el.getBoundingClientRect();

            if ((el.offsetLeft - x1 < SVG_CANVAS_BOUNDS.left) ||
                (el.offsetTop - y1 < SVG_CANVAS_BOUNDS.top) ||
                (el.offsetLeft - x1 + bounds.width + ADDITIONAL_CANVAS_OFFSET_X > window.innerWidth) ||
                (el.offsetTop - y1 + bounds.height + ADDITIONAL_CANVAS_OFFSET_Y > window.innerHeight)) {
                return;
            }
            el.style.top = (el.offsetTop - y1) + 'px';
            el.style.left = (el.offsetLeft - x1) + 'px';
        }
    }
}

export { SketchManager }