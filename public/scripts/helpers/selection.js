let selectVertexShape = document.querySelector('#select-vertex-shape');
let hiddenElements = document.querySelectorAll('.hidden-slider');
hiddenElements = Array.prototype.slice.call(hiddenElements);

// let options = selectVertexShape.childNodes;
// options = Array.prototype.slice.call(options);  // NodeList to Array
// options = options.filter(option => {
//     // retain option prototypes only (text objects can appear)
//     return Object.getPrototypeOf(option) === Option.prototype;
// });

/**
 * set HTML attributes to hidden for elements with provided id's (without #) only
 * @param ids
 */
let hiddenPropertySetter = (ids) => {
    hiddenElements.forEach(el => {
        if (ids.includes(el.id)) {
            el.removeAttribute('hidden');
        } else {
            el.setAttribute('hidden', 'hidden');
        }
    });
}

selectVertexShape.addEventListener('change', () => {
    let selected = selectVertexShape.value.toLowerCase();

    switch (selected) {
        case 'circle':
            hiddenPropertySetter('hidden-slider-circle');
            break;
        case 'square':
            hiddenPropertySetter('hidden-slider-square');
            break;
        case 'rectangle':
            hiddenPropertySetter(['hidden-slider-rectangle-1', 'hidden-slider-rectangle-2']);
            break;
        case 'triangle':
            hiddenPropertySetter('hidden-slider-triangle');
            break;
        case 'polygon':
            hiddenPropertySetter(['hidden-slider-polygon-1', 'hidden-slider-polygon-2']);
            break;
    }
});


