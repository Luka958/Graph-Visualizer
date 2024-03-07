import Dijkstra from "../algorithms/Dijkstra.js";
import {TimeManager} from "../algorithms/decorators/animate.decorators";
import {getAllVertices, getIDFromVertex} from "./DrawingHelperModel";

export default class AlgorithmModel {

    static containers;

    static passContainers(obj) {
        // structuredClone performs deep copy, its needed because deleting or altering
        // some of the properties below (in case of the shallow copying) would change
        // data obtained from drawing.js and drawing wouldn't work
        this.containers = structuredClone(obj);

        // removing attributes that we don't need in addon.cc
        this.containers.vertexContainer.forEach(vertex => {
            delete vertex.SVG;
            delete vertex.shape;
            delete vertex.x;
            delete vertex.y;
            delete vertex.helper;
        });
        this.containers.edgeContainer.forEach(edge => {
            delete edge.help;
        });
    }
}

function getButtons(str) {
    return Array.from(document.querySelectorAll(`[id^=${ str }]`));
}

const v0Listeners = new Map();
function v0Cleanup() {
    v0Listeners.forEach((val, key) => key.removeEventListener('click', val));
    v0Listeners.clear();
}

const tableObserver = new MutationObserver(() => {
    const runButtons = getButtons('run-alg-');
    const fastForwardButtons = getButtons('fast-forward-alg-');
    const doubleTimeButtons = getButtons('double-alg-');
    const halfTimeButtons = getButtons('half-alg-');
    const removeButtons = getButtons('remove-alg-');
    const v0Buttons = getButtons('v0-alg-');

    runButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const alg = btn.id.split('run-alg-')[1];

            if (alg === 'Dijkstra-animated') {
                Dijkstra
                    .manageAnimated(AlgorithmModel.containers, true)
                    .then(() => {})
                    .catch((err) => console.error(err));

            } else if (alg === 'Dijkstra-performance') {
                Dijkstra.managePerformance(AlgorithmModel.containers);
            }
        });
    });
    fastForwardButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const alg = btn.id.split('fast-forward-alg-')[1];

            if (alg === 'Dijkstra-animated') {
                Dijkstra
                    .manageAnimated(AlgorithmModel.containers, false)
                    .then(() => {})
                    .catch((err) => console.error(err));
            }
        });
    });
    doubleTimeButtons.forEach(btn => {
        btn.addEventListener('click', () => TimeManager.getInstance().updateTime(0.5));
    });
    halfTimeButtons.forEach(btn => {
        btn.addEventListener('click', () => TimeManager.getInstance().updateTime(2));
    });
    v0Buttons.forEach(btn => {
        const v0Text = btn.querySelector('span sub');

        btn.addEventListener('click', () => {
            getAllVertices().forEach(v => {
                const id = getIDFromVertex(v);
                const onClick = () => {
                    Dijkstra.setSource(AlgorithmModel.containers.vertexContainer.find(el => el.id === id));
                    v0Text.innerText = id;
                }
                v.addEventListener('click', onClick);
                v0Listeners.set(v, onClick);
            });
        });
        const v0 = AlgorithmModel.containers.vertexContainer[0];
        Dijkstra.setSource(v0);
        v0Text.innerText = (v0 !== undefined) ? v0.id : '?';
    });
    removeButtons.forEach(btn => {
        btn.addEventListener('click', () => v0Cleanup());
    });
});

const openAlgorithm = document.querySelector('#algorithm');
const closeAlgorithm = document.querySelector('#algorithm-heading > img');
const toolbarContainer = document.querySelector('.toolbar-container');

openAlgorithm.addEventListener('click', () => {
    // observed element, option object
    let table = document.querySelector('#selected-algorithms-table');
    tableObserver.observe(table, { childList: true });

    // freeze toolbar when algorithm div opens
    toolbarContainer.style.pointerEvents = 'none';

});
closeAlgorithm.addEventListener('click', () => {
    // clear selected algorithms
    const removeButtons = getButtons('remove-alg-');
    removeButtons.forEach(btn => btn.click());

    // boost performance, use observer only when div is displayed
    tableObserver.disconnect();

    // unfreeze toolbar when algorithm div opens
    toolbarContainer.style.pointerEvents = 'auto';

    // remove listeners
    v0Cleanup();
});