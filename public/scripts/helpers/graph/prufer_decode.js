import {insertItemsToCanvas} from "./insert_graph.js";

const pruferDecodeInput = document.querySelector('#prufer-decode-input');
const pruferDecodeArrow = document.querySelector('#prufer-decode-arrow');

pruferDecodeArrow.addEventListener('click', () => {
    try {
        insertItemsToCanvas('prufer-decode', pruferDecodeInput.value);

    } catch (err) {
        const originalStyle = pruferDecodeInput.style;
        const originalValue = pruferDecodeInput.value;

        pruferDecodeInput.style.backgroundColor = 'red';
        pruferDecodeInput.style.color = 'white';
        pruferDecodeInput.style.textAlign = 'center';
        pruferDecodeInput.value = err;

        setTimeout(() => {
            pruferDecodeInput.style = originalStyle;
            pruferDecodeInput.value = originalValue;
        }, 1000);
    }
});