import {Animate} from "./decorators/animate.decorators.js";

export default class DFS {

    /**
     * @param containers contains all vertices and edges
     * @param src source vertex
     * @typedef {Object} _ lodash
     * @typedef {{id: number, neighbours: []}} src
     */
    @Animate
    static* run(containers, src) {
        const {vertexContainer, edgeContainer} = containers;

        const stack = [];
        stack.push(src.id);

        while (stack.length !== 0) {
            // (v, u) are vertex ids
            const v = stack.pop();

            for (let u of v.neighbours) {
                stack.push(u);
            }
        }
    }
}