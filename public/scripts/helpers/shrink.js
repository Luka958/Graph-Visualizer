import * as DrawingHelperModel from "../models/DrawingHelperModel.js";

class ShrinkManager {

    div;
    input;
    vertexContainer;
    originalLookMap;
    listener;
    shrinkValue = 5;

    static instance = new ShrinkManager();

    static getInstance() {
        return ShrinkManager.instance;
    }

    open(vertexContainer, originalLookMap) {
        this.originalLookMap = originalLookMap;

        vertexContainer.forEach(v => originalLookMap.set(v, this.shrink(v)));

        this.div = document.querySelector('#shrink-div');
        setVisible(this.div);
        this.input = document.querySelector('#shrink-input');
        this.input.setAttribute('value', this.shrinkValue.toString());

        this.listener = e => {
            const value = parseFloat(e.target.value);
            document.querySelector('#shrink-val').innerHTML = value.toFixed(1);
            this.shrinkValue = value;

            vertexContainer.forEach(v => this.shrink(v));
        };

        this.input.addEventListener('input', this.listener);
    }

    close() {
        setInvisible(this.div);
        DrawingHelperModel.expand(this.originalLookMap);
        this.input.removeEventListener('input', this.listener);
    }

    shrink(vertexObj) {
        return DrawingHelperModel.shrink(vertexObj, this.shrinkValue);
    }
}

export { ShrinkManager }