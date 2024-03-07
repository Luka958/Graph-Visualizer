/**
 * Adding additional functionality to reset button of the form.
 * @param sliderId - we have to manually reset slider value when reset button is clicked
 * @param elementId - element that has to be changed
 */
let customReset = (sliderId, elementId) => {
    let slider = document.querySelector(sliderId);
    let element = document.querySelector(elementId);

    element.innerHTML = slider.value = slider.getAttribute('data-default');
}

/**
 * Resetting multiple sliders from THE SAME ejs. template at once.
 * @param arr - initially string with & and $ that are used as delimiters for splitting
 */
let sliderReset = (arr) => {
    arr = arr.split("&");
    arr.forEach(item => {
        item = item.split("$");
        customReset(item[0], item[1]);
    });
}

let colorReset = (...ids) => {
    ids.forEach(id => {
        let colorPicker = document.querySelector(id);
        colorPicker.value = colorPicker.getAttribute('data-default');
    });
}

(() => {
    let resetVertexPropsBtn = document.querySelector('#reset-vertex');

    resetVertexPropsBtn.addEventListener('click', () => {
        let selected = document.querySelector('#select-vertex-shape').value.toLowerCase();
        // using $ and & in order to make an array of arrays
        let items = "#vertex-border-width" + "$" + "#vertex-border-width-val" + "&";

        switch (selected) {
            case 'circle':
                items += "#circle-radius" + "$" + "#circle-radius-val";
                break;
            case 'square':
                items += "#square-base" + "$" + "#square-base-val";
                break;
            case 'rectangle':
                items += "#rectangle-width" + "$" + "#rectangle-width-val" + "&" +
                    "#rectangle-height" + "$" + "#rectangle-height-val";
                break;
            case 'triangle':
                items += "#triangle-base" + "$" + "#triangle-base-val";
                break;
            case 'polygon':
                items += "#polygon-base" + "$" + "#polygon-base-val" + "&" +
                    "#number-of-angles" + "$" + "#number-of-angles-val";
                break;
        }
        sliderReset(items);
        colorReset('#vertex-fill', '#vertex-border');
    });

    let resetEdgePropsBtn = document.querySelector('#reset-edge');

    resetEdgePropsBtn.addEventListener('click', () => {
        // not using because the only one option is available at the moment
        // let selected = document.querySelector('#select-edge-shape').value.toLowerCase();
        let items = "#edge-width" + "$" + "#edge-width-val"+ "&" +
            "#scale-loop" + "$" + "#scale-loop-val";

        sliderReset(items);
        colorReset('#edge-border');
    });
})();