import {Animate, TimeManager} from "./decorators/animate.decorators.js";
import {Addon} from "./decorators/addon.decorators.js";

export default class Dijkstra {

    static iterator;
    static src;

    /**
     * @param containers contains all vertices and edges
     * @param src source vertex
     * @typedef {{id: number, neighbours: []}} src
     */
    @Animate
    static* run(containers, src) {
        const {vertexContainer, edgeContainer} = containers;
        const l = new Map();       // labels
        const S = new Set();            // vertex set
        const E = [];                       // animated edges
        const pairs = new Map();   // <vertex id, vertex id>

        function w(u, v) {
            for (let edge of edgeContainer) {
                if (edge.connection.includes(u.id) && edge.connection.includes(v.id)) {
                    E.push(edge.id);
                    return edge.weight;
                }
            }
            throw new Error('Provided vertices are not neighbours!');
        }

        for (let v of vertexContainer) {
            l.set(v, v === src ? 0 : Infinity);
        }
        S.add(src);
        let i = 0;

        yield { i, l: new Map(l), S: new Set(S), E: [], v: src, d: 0 };

        while (i < vertexContainer.length - 1) {
            const min = { v: undefined, d: Infinity };

            for (let v of _.difference(vertexContainer, Array.from(S))) {
                for (let u of S) {
                    if (!u.neighbours.includes(v.id)) {
                        continue;
                    }
                    const d = Math.min(l.get(v), l.get(u) + w(u, v));

                    if ((!pairs.has(v.id)) || (d < l.get(v))) {
                        // save the first pair of vertices that created the smallest label (for animation)
                        pairs.set(v.id, u.id);
                    }
                    l.set(v, d);

                    if (d < min.d) {
                        min.d = d;
                        min.v = v;
                    }
                }
            }
            S.add(min.v);
            i++;
            yield {
                i, l: new Map(l), S: new Set(S), E: [...E], v: min.v, d: min.d,
                pair: [min.v.id, pairs.get(min.v.id)]
            };
            E.length = 0;
        }
        return containers;
    }

    static setSource(src) {
        Dijkstra.src = src;
    }

    static wasInStepMode;

    static async manageAnimated(containers, inStepMode) {
        if (Dijkstra.iterator === undefined) {
            console.assert(Dijkstra.src !== undefined);
            Dijkstra.iterator = Dijkstra.run(containers, Dijkstra.src);
            Dijkstra.wasInStepMode = inStepMode;
        }
        let val = Dijkstra.iterator.next();
        if (val.done) Dijkstra.iterator = undefined;
        if (inStepMode) return;

        while (!val.done) {
            await TimeManager.getInstance().delay();
            if (Dijkstra.wasInStepMode !== inStepMode) {
                await TimeManager.getInstance().delay();
            }
            Dijkstra.wasInStepMode = inStepMode;
            val = Dijkstra.iterator.next();
            await TimeManager.getInstance().delay();
        }
        Dijkstra.wasInStepMode = inStepMode;
        Dijkstra.iterator = undefined;
    }

    @Addon
    static managePerformance(containers) {}
}