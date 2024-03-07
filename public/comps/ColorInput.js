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
        
        span {
            font-size: 0.9em;
        }
        
        .container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        #color-container {
            border: 1px solid white;
        }
    </style>
    
    
    <span class="container">
        <div id="color-container">
            <input type="color" value="#ffffff"/>
        </div>
        <span>COLOR</span>
    </span>
`;
// style source: https://codepen.io/javascriptacademy-stash/pen/porpeoJ?editors=0010

class ColorInput extends HTMLElement {

    constructor() {
        super();
        // isolates CSS from other elements on the website
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(colorInputTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        this.input = this.shadowRoot.querySelector('input');
        this.div = this.shadowRoot.querySelector('div');

        this.div.style.backgroundColor = this.input.value;

        this.input.addEventListener('change', e => {
            this.div.style.backgroundColor = e.target.value;
        });
    }
}

window.customElements.define('gv-color-input', ColorInput);