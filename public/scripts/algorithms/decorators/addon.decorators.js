export function Addon(target, name, descriptor) {
    const defaultDescriptor = descriptor.value;

    descriptor.value = function (...args) {
        defaultDescriptor.apply(this, args);
        return call(args[0]);
    };
    return descriptor;
}

function call(containers) {
    const req = new Request('/algorithm', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(containers)
    });

    fetch(req).then(res => res.json()).then(res => {
        table(res);
        console.log(res);
    });
}

function table(res) {
    const div = document.querySelector('#results-div');
    const heading = document.querySelector('#results-heading');
    const content = document.querySelector('#results-content');

    let table = '<table class="dijkstra-table" style="width: 100%"><tr><td></td>';

    for (let start of res.result) {
        table += `<td class="dijkstra-first-row">${ start.startVertexId }</td>`;
    }
    table += '</tr>'

    for (let start of res.result) {
        table += `<tr><td class="dijkstra-first-column">${ start.startVertexId }</td>`;

        for (let el of start.other) {
            table += `<td>${ el.distance }</td>`;
        }
        table += '</tr>'
    }
    table += '</table>';

    if (res.duration >= 1000000 * 60 * 60) {
        heading.innerText = `Dijkstra (${ res.duration / 1000000 * 60 * 60 }h)`;

    } else if (res.duration >= 1000000 * 60) {
        heading.innerText = `Dijkstra (${ res.duration / 1000000 * 60 }min)`;

    } else if (res.duration >= 1000000) {
        heading.innerText = `Dijkstra (${ res.duration / 1000000 }s)`;

    } else if (res.duration >= 1000) {
        heading.innerText = `Dijkstra (${ res.duration / 1000 }ms)`;

    } else {
        heading.innerText = `Dijkstra (${ res.duration }μs)`;
    }
    content.innerHTML = table;
    content.style.textAlign= 'center';
    setVisible(div);
}