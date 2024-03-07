import {Animate} from "./decorators/animate.decorators.js";

export default class BFS {

    /**
     * @param containers contains all vertices and edges
     * @param src source vertex
     * @typedef {Object} _ lodash
     * @typedef {{id: number, neighbours: []}} src
     */
    @Animate
    static* run(containers, src) {
        const {vertexContainer, edgeContainer} = containers;

        const queue = [];
        queue.push(src.id);

        while (queue.length !== 0) {
            // (v, u) are vertex ids
            const v = queue.shift();

            for (let u of v.neighbours) {
                queue.push(u);
            }
        }
    }
}