const colorInputTemplate = document.createElement('template');
colorInputTemplate.innerHTML = `
<style>
    input {
        appearance: none;
        -moz-appearance: none;
        -webkit-appearance: none;
        background: none;
        border: 0;
        padding: 0;
        cursor: pointer;
        width: 3.75em;
        height: 1.5em;
        opacity: 0;
    }
    input:focus{
        border-radius: 0;
        outline: none;
    }
    input::-webkit-color-swatch-wrapper {
        padding: 0;
    }
    input::-webkit-color-swatch{
        border: 0;
        border-radius: 0;
    }
    input::-moz-color-swatch, ::-moz-focus-inner{
        border: 0;
    }
    input::-moz-focus-inner{
        padding: 0;
    }
    
    .floating-toolbar-colors {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        grid-template-rows: repeat(2, 1fr);
        grid-gap: 0.5em;
        padding-right: 0.5em;
    }
    .color-item {
        width: 1.5em;
        height: 1.5em;
        display: inline-grid;
        border: 1px solid white;
    }
    .color-item:hover {
        cursor: pointer;
    }
    
    .container {
        font-size: 0.75em;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .sub-container {
        display: flex; 
        flex-direction: row;
    }
    
    #color-container {
        border: 1px solid white;
        width: 4.5em;
    }
    
    #color-container-wrapper {
        display: flex; 
        flex-direction: column;
        text-align: center;
        padding-left: 0.5em;
        padding-right: 0.5em;
        border-left: 1px solid white;
        border-right: 1px solid white;
    }
    
    span {
        /* center text vertically */
        display: inline-flex;
        align-items: center;
        /* center text horizontally */
        justify-content: center;
        
        border-left: 1px solid white;
        border-right: 1px solid white;
        border-bottom: 1px solid white;
        height: 100%;
    }
</style>

<script src="./ColorInput.js"></script>

<div class="container">
    <div class="sub-container">
        <div class="floating-toolbar-colors"></div>
    
        <div id="color-container-wrapper">
            <div id="color-container">
                <input type="color" value="#ff0000"/>
            </div>
            <span id="color-display"></span>
        </div>
    </div>
</div>
`;
// style source: https://codepen.io/javascriptacademy-stash/pen/porpeoJ?editors=0010

class ColorPalette extends HTMLElement {

    constructor() {
        super();
        // ShadowDOM isolates CSS from other elements on the website
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(colorInputTemplate.content.cloneNode(true));
        this.colors = [
            '#ff0000', '#0000ff', '#008000', '#ffff00', '#ffa500',
            '#800080', '#000000', '#ffffff', '#808080', '#a52a2a'
        ];
    }

    connectedCallback() {
        this.input = this.shadowRoot.querySelector('input');
        this.colorContainer = this.shadowRoot.querySelector('#color-container');
        this.colorDisplay = this.shadowRoot.querySelector('#color-display');

        const floatingToolbarColors = this.shadowRoot.querySelector('.floating-toolbar-colors');
        this.colors.forEach(color => {
            const colorItem = document.createElement('div');
            colorItem.classList.add('color-item');
            colorItem.style.backgroundColor = color.toString();
            floatingToolbarColors.appendChild(colorItem);
        });
        this.colorContainer.style.backgroundColor = this.input.value;
        this.colorDisplay.innerHTML = this.input.value.toUpperCase();
        this.setAttribute('color', this.input.value);

        this.input.addEventListener('change', e => {
            this.colorContainer.style.backgroundColor = e.target.value;
            this.colorDisplay.innerHTML = e.target.value.toUpperCase();
            this.setAttribute('color', e.target.value);
        });

        this.shadowRoot.querySelectorAll('.color-item').forEach(item => {
           item.addEventListener('click', () => {
               const newColor = RGBToHex(item.style.backgroundColor);
               this.input.value = newColor;
               this.colorContainer.style.backgroundColor = newColor;
               this.colorDisplay.innerHTML = newColor.toUpperCase();
               this.setAttribute('color', newColor);
           }) ;
        });
    }
}

const RGBToHex = (rgbString) => {
    const rgbValues = rgbString.match(/\d+/g).map(Number);
    return `#${((rgbValues[0] << 16) + (rgbValues[1] << 8) + rgbValues[2]).toString(16).padStart(6, '0')}`;
};

window.customElements.define('gv-color-palette', ColorPalette);