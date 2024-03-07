const floatingToolbarTemplate = document.createElement('template');
floatingToolbarTemplate.innerHTML = `
    <style>
        .container {
            position: absolute;
            display: flex;
            flex-direction: row;
            user-select: none;
            background-color: midnightblue;
            color: white;
            padding-top: 0.5em;
            padding-bottom: 0.5em;
        }
        .content-container {
            padding-left: 0.5em;
            padding-right: 0.5em;
        }
        .arrow-container {
            display: flex;
            align-items: center;
            padding: 0.25em;
            border-left: 1px solid white;
        }
        img {
            width: 25px;
            height: 25px;
        }
        .img-down {
            rotate: 90deg;
            transition: transform 0.5s;
        }
        .img-down.flip {
            transform: rotateY(180deg);
        }
    </style>
    
    <div class="container">
        <div class="content-container">
            <slot name="content"></slot>
        </div>
        <div class="arrow-container">
            <img class="img-down" src="/images/forward.png" alt="next image">
        </div>
    </div>
`;

class FloatingToolbar extends HTMLElement {

    constructor() {
        super();
        // isolates CSS from other elements on the website
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(floatingToolbarTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        this.container = this.shadowRoot.querySelector('.container');

        this.style.position = 'absolute';
        this.style.top = SVG_CANVAS_BOUNDS.top.toString().concat('px');
        this.style.right = (this.container.getBoundingClientRect().width + 5).toString().concat('px');

        this.contentContainer = this.shadowRoot.querySelector('.content-container');
        this.arrowContainer = this.shadowRoot.querySelector('.arrow-container');

        this.arrowContainer.addEventListener('click', () => {
            const oldValue = this.getAttribute('collapsed');
            this.setAttribute('collapsed', (!(oldValue === 'true')).toString());
        });
        this.arrow = this.shadowRoot.querySelector('.img-down');
    }

    attributeChangedCallback(property, oldValue, newValue) {
        // second condition prevents infinite loop
        if (property === 'collapsed' && oldValue !== newValue) {
            this.setAttribute('collapsed', newValue);

            const defaultPaddingTop = this.contentContainer.style.paddingTop;
            const defaultPaddingBottom = this.contentContainer.style.paddingBottom;

            if (newValue === 'true') {
                this.arrow.classList.add('flip');
                this.contentContainer.style.display = 'none';
                this.style.paddingTop = '0';
                this.style.paddingBottom = '0';
                this.arrowContainer.style.borderLeft = 'none';
                this.style.right = (this.arrowContainer.getBoundingClientRect().width + 5).toString().concat('px');
            } else {
                this.arrow.classList.remove('flip');
                this.contentContainer.style.display = 'block';
                this.style.paddingTop = defaultPaddingTop;
                this.style.paddingBottom = defaultPaddingBottom;
                this.arrowContainer.style.borderLeft = '1px solid white';
                this.style.right = (this.container.getBoundingClientRect().width + 5).toString().concat('px');
            }
        }
    }

    static get observedAttributes() {
        return ['collapsed'];
    }
}

window.customElements.define('gv-floating-toolbar', FloatingToolbar);