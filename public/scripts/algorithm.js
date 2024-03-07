// update algorithm groups and names here
const groupOptions = {
    'Shortest path - Animated': ['Dijkstra'],
    'Shortest path - Performance': ['Dijkstra']
};
// container with all groups
const algorithmGroups = document.querySelector('#algorithm-groups');
const selected = document.querySelector('#selected-algorithms-table');

const optionCallback = (select, i) => {
    const j = select.selectedIndex;

    // selected algorithm option already exists
    if (document.querySelector(`#run-${ i }-${ j }`) !== null) {
        return '';
    }
    const imageDim = 15;
    const isAnimated = () => Object.keys(groupOptions)[i].endsWith('Animated');

    if (isAnimated()) {
        const algorithmName = () => groupOptions[Object.keys(groupOptions)[i]][j] + '-animated';

        return `<tr id="tr-${ i }-${ j }" class="algorithm-row">
                <td class="first-td"><span class="algorithm-name">${ select.options[j].value }</span></td>
                <td id="run-alg-${ algorithmName() }" class="run-stop-button round-left">
                    <img src="images/algorithm/run.png" width="${ imageDim }px" height="${ imageDim }px" alt="run">
                </td>
                <td id="fast-forward-alg-${ algorithmName() }" class="run-stop-button">
                    <img src="images/algorithm/fast_forward.png" width="${ imageDim }px" height="${ imageDim }px" alt="stop">
                </td>
                <td id="v0-alg-${ algorithmName() }" class="run-stop-button">
                    <span>V<sub>0</sub></span>
                </td>
                <td id="double-alg-${ algorithmName() }" class="run-stop-button">
                    <span>x2</span>
                </td>
                <td id="half-alg-${ algorithmName() }" class="run-stop-button">
                    <span>x.5</span>
                </td>
                <td id="remove-alg-${ algorithmName() }" 
                    class="run-stop-button round-right"
                    onclick="
                    document.querySelector(\`#tr-${i}-${j}\`).remove();
                    // unselect belonging option when remove button is being clicked
                    document.querySelector(\`#algorithm-option-${ i }-${ j }\`).selected = false;
                    ">
                    <img src="images/algorithm/remove.png" 
                         width="${ imageDim }px" height="${ imageDim }px" alt="remove">
                </td>
            </tr>`;
    }
    const algorithmName = () => groupOptions[Object.keys(groupOptions)[i]][j] + '-performance';

    return `<tr id="tr-${ i }-${ j }" class="algorithm-row">
                <td class="first-td"><span class="algorithm-name">${ select.options[j].value }</span></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td id="run-alg-${ algorithmName() }" class="run-stop-button round-left">
                    <img src="images/algorithm/run.png" width="${ imageDim }px" height="${ imageDim }px" alt="run">
                </td>
                <td id="remove-alg-${ algorithmName() }" 
                    class="run-stop-button round-right"
                    onclick="
                    document.querySelector(\`#tr-${i}-${j}\`).remove();
                    // unselect belonging option when remove button is being clicked
                    document.querySelector(\`#algorithm-option-${ i }-${ j }\`).selected = false;
                    ">
                    <img src="images/algorithm/remove.png" 
                         width="${ imageDim }px" height="${ imageDim }px" alt="remove">
                </td>
            </tr>`;
}

const addGroups = () => {
    let groups = Object.keys(groupOptions);

    for (let i = 0; i < groups.length; i++) {
        let div = document.createElement('div');
        div.id = `algorithm-group-${ i }`;

        let label = document.createElement('label');
        label.innerHTML = groups[i];

        let br = document.createElement('br');
        let select = document.createElement('select');
        select.className = 'selectors algorithm-selectors';
        select.multiple = true;

        let options = groupOptions[groups[i]];
        for (let j = 0; j < options.length; j++) {
            let option = document.createElement('option');
            // option id consists of the group id and an ordinal number of the option within that group
            option.id = `algorithm-option-${ i }-${ j }`;
            option.value = option.innerHTML = options[j];
            select.append(option);
        }
        select.addEventListener('change', () => {
            selected.innerHTML += optionCallback(select, i);
        });
        div.append(label, br, select, br);
        algorithmGroups.append(div);
    }
}
addGroups();

// click search icon after typing text in the input field
document.querySelector('#search-algorithm-span').addEventListener('click', () => {
    manageSearchAlgorithm();
});
// press enter after typing text in the input field
document.querySelector('#search-algorithm-input').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        manageSearchAlgorithm();
    }
});

const manageSearchAlgorithm = () => {
    let input = document.querySelector('#search-algorithm-input').value;
    let values = Object.values(groupOptions);

    for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
            if (input.toLowerCase().trim() === values[i][j].toLowerCase()) {
                // option exists
                let option = document.querySelector('#algorithm-option-' + i + '-' + j);
                let select = option.parentElement;
                select.value = option.value;
                selected.innerHTML += optionCallback(option.parentElement, i);
            }
        }
    }
}