const FORMATS = Object.freeze(['webp', 'png', 'jpeg', 'bmp', 'ico', 'gif', 'pdf']);

class PDFTracker {

    constructor(pdf, savePDFAdded, pointerEvents) {
        this._pdf = pdf;
        this._savePDFAdded = savePDFAdded;
        this._pointerEvents = pointerEvents;

        // savePDF won't work properly within the event listeners without binding
        // because attributes will be undefined
        this.savePDF = this.savePDF.bind(this);
    }

    savePDF() {
        this._pdf.save('screenshot.pdf');   // downloads a PDF file
    }

    get pdf() {
        return this._pdf;
    }

    set pdf(value) {
        this._pdf = value;
    }

    get savePDFAdded() {
        return this._savePDFAdded;
    }

    set savePDFAdded(value) {
        this._savePDFAdded = value;
    }

    get pointerEvents() {
        return this._pointerEvents;
    }

    set pointerEvents(value) {
        this._pointerEvents = value;
    }
}

class Image {

    constructor(data, w, h) {
        this._data = data;
        this._w = w;
        this._h = h;
    }

    get data() {
        return this._data;
    }

    set data(value) {
        this._data = value;
    }

    get w() {
        return this._w;
    }

    set w(value) {
        this._w = value;
    }

    get h() {
        return this._h;
    }

    set h(value) {
        this._h = value;
    }
}

class ScreenshotManager {

    static instance = new ScreenshotManager();

    constructor() {
        this.div = document.querySelector('#screenshot-div');
        this.select = document.querySelector('#select-screenshot-format');
        this.link = document.querySelector('#export-screenshot-link');
        this.download = document.querySelector('#download-screenshot-button');
        this.cancel = document.querySelector('#cancel-screenshot-button');

        this.initDownload();
        this.initCancel();
        this.initScreenshotFrame();
        this.initSelect();

        this.tracker = new PDFTracker(null, false, this.link.style.pointerEvents);
    }

    static getInstance() {
        return ScreenshotManager.instance;
    }

    initScreenshotFrame() {
        this.rect = document.createElementNS(SVG_NS_URI, 'rect');
        this.rect.setAttribute('id', 'screenshot-rect');
        this.rect.setAttribute('stroke', '#1c0952');
        this.rect.setAttribute('stroke-width', '2');
        this.rect.setAttribute('fill', 'white');
        this.rect.setAttribute('fill-opacity', '0.25');
    }

    initDownload() {
        this.download.addEventListener('click', () => {
            setInvisible(this.div);
        });
    }

    initCancel() {
        this.cancel.addEventListener('click', () => {
            setInvisible(this.div);
        });
    }

    initSelect() {
        this.select.addEventListener('change', async () => {
            this.rect.setAttribute('stroke', 'none');
            this.rect.setAttribute('fill', 'none');
            SVG_CANVAS.appendChild(this.rect);

            await this.downloadScreenshot();
        });
    }

    /**
     * user must mark the whole SVG element such as vertex, edge, etc.,
     * otherwise image won't be rendered properly
     * @returns {Promise<unknown>}
     */
    async takeScreenshot() {
        return new Promise((resolve) => {
            const mousedown = (e) => {
                SVG_CANVAS.addEventListener('mouseup', mouseup);
                this.startScreenshotRect(e);
                SVG_CANVAS.addEventListener('mousemove', mousemove);
            };

            const mousemove = (e) => this.continueScreenshotRect(e);

            const mouseup = () => {
                SVG_CANVAS.removeEventListener('mousemove', mousemove);
                SVG_CANVAS.removeEventListener('mouseup', mouseup);
                SVG_CANVAS.removeEventListener('mousedown', mousedown);

                SVG_CANVAS.style.cursor = 'default';
                setVisible(this.div);

                // rect won't be the part of the screenshot
                this.rect.setAttribute('stroke', 'none');
                this.rect.setAttribute('fill', 'none');

                this.downloadScreenshot();
                resolve();
            };
            SVG_CANVAS.addEventListener('mousedown', mousedown);
            SVG_CANVAS.style.cursor = 'crosshair';
        });
    }

    getCoordinates(e) {
        return [e.clientX - SVG_CANVAS_BOUNDS.left, e.clientY - SVG_CANVAS_BOUNDS.top];
    }

    startScreenshotRect(e) {
        const [x, y] = this.getCoordinates(e);
        this.rect.setAttribute('x', x.toString());
        this.rect.setAttribute('y', y.toString());
        this.rect.setAttribute('width', '0');
        this.rect.setAttribute('height', '0');

        SVG_CANVAS.appendChild(this.rect);
        this.x0 = x;
        this.y0 = y;
    }

    continueScreenshotRect(e) {
        const [x, y] = this.getCoordinates(e);
        const w = Math.abs(x - this.x0);
        const h = Math.abs(y - this.y0);

        this.rect.setAttribute('x', Math.min(this.x0, x).toString());
        this.rect.setAttribute('y', Math.min(this.y0, y).toString());
        this.rect.setAttribute('width', w.toString());
        this.rect.setAttribute('height', h.toString());
    }

    /**
     * selects SVG element and encodes its content in base64 encoding,
     * sets the information about dimensions and size
     * supported formats are: webp, png, jpeg, bmp, ico, gif
     * @returns {Promise<void>}
     * @throws Invalid image format! if the format is wrong
     */
    async downloadScreenshot() {
        let format = this.select.value.toLowerCase();
        if (!FORMATS.includes(format)) {
            throw 'Invalid image format!';
        }
        // xml: https://stackoverflow.com/questions/3768565/drawing-an-svg-file-on-a-html5-canvas
        // convert: https://stackoverflow.com/questions/3975499/convert-svg-to-image-jpeg-png-etc-in-the-browser
        const xml = new XMLSerializer().serializeToString(SVG_CANVAS);
        const svg64 = btoa(xml);
        const b64Start = 'data:image/svg+xml;base64,';
        const image64 = b64Start + svg64;

        this.tracker.pdf = null;
        if (format === 'pdf') {
            // if provided format is PDF, PNG will be created first,
            // and then it will be converted in PDF
            format = 'png';
            // specifying A4 size and using millimetres as a measurement unit
            this.tracker.pdf = new jspdf.jsPDF('portrait', 'mm', 'a4');
        }

        this.base64SvgToBase64Format(image64, format).then(img => {
            this.setScreenshotInfo(img.data, img.w, img.h);

            if (this.tracker.pdf !== null) {
                this.addPNGToPDF(this.tracker.pdf, img.data, img.w, img.h);
                this.link.style.pointerEvents = 'none';

                if (!this.tracker.savePDFAdded) {
                    this.download.addEventListener('click', this.tracker.savePDF);
                    this.tracker.savePDFAdded = true;
                }

            } else {
                this.download.removeEventListener('click', this.tracker.savePDF);
                this.tracker.savePDFAdded = false;

                this.link.setAttribute('href', img.data.toString());
                this.link.setAttribute('download', 'screenshot.' + format);
                this.link.style.pointerEvents = this.tracker.pointerEvents;
            }

        }).catch(err => {
            console.error(err);

        }).then(() => {
            SVG_CANVAS.removeChild(this.rect);
            // reset default attributes for the next use
            this.rect.setAttribute('stroke', '#1c0952');
            this.rect.setAttribute('fill', 'white');
        });
    }

    /**
     * converts base64 encoded SVG to other specified format
     * that is also encoded using base64
     * @param originalBase64 original base64 string
     * @param format image file extension
     * @returns {Promise<unknown>} returns new encoding,
     * otherwise returns 'Image conversion failed!'
     */
    base64SvgToBase64Format(originalBase64, format) {
        const img = document.createElement('img');
        const rect = this.rect;

        return new Promise((resolve, reject) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                const bounds = rect.getBoundingClientRect();

                // new dimensions are set to double size to avoid the blurry image
                canvas.width = bounds.width * 2;
                canvas.height = bounds.height * 2;
                canvas.style.width = '100%';
                canvas.style.height = '100%';

                const sx = bounds.left - SVG_CANVAS_BOUNDS.left;
                const sy = bounds.top - SVG_CANVAS_BOUNDS.top;
                const sw = bounds.width;
                const sh = bounds.height;
                const dx = 0;
                const dy = 0;
                const dw = bounds.width * 2;
                const dh = bounds.height * 2;

                context.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

                try {
                    const data = canvas.toDataURL('image/' + format, 1);
                    resolve(new Image(data, dw, dh));

                } catch (e) {
                    reject('Image conversion failed!');
                }
            };
            img.onerror = () => reject('Image conversion failed!');
            img.src = originalBase64;
        });
    }

    addPNGToPDF(pdf, imgData, imgW, imgH) {
        // The A4 page size is 210 mm x 297 mm.
        const pageW = 210;
        const pageH = 297;
        const scale = (imgW > pageW || imgH > pageH) ? Math.min(pageW / imgW, pageH / imgH) : 1;

        pdf.addImage(imgData, 'PNG', 0, 0, imgW * scale, imgH * scale);
    }

    setScreenshotInfo(imgData, imgW, imgH) {
        // https://blog.aaronlenoir.com/2017/11/10/get-original-length-from-base-64-string/
        // base64 uses 4 ascii characters to encode 24-bits (3 bytes) of data.
        const content = imgData.toString().split('base64,')[1];
        const bytes = new TextEncoder().encode(content).length * 3 / 4;

        document.querySelector('#screenshot-width').innerHTML = Math.round(imgW).toString();
        document.querySelector('#screenshot-height').innerHTML = Math.round(imgH).toString();
        document.querySelector('#screenshot-size').innerHTML = (bytes / 1024).toFixed(2).toString();
    }
}

export { ScreenshotManager }