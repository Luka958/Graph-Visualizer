// only one button from each group can be active at certain moment
let buttonGroups = document.querySelectorAll('.button-group');
/**
 * when reset button gets clicked values of all map elements are set to true,
 * so whenever any button from any button group gets clicked, clickedFirst
 * variable is going to change to define
 * this method will disable variables that are managing clicked state (student/teacher)
 * from getting in the wrong one
 * @type {Map<any, any>} key: button group id, value: boolean
 */
let resetIsClicked = new Map();

buttonGroups.forEach(buttonGroup => {
    buttonGroup.style.whiteSpace = 'nowrap';
    resetIsClicked.set(buttonGroup.id, false);
});
buttonGroups.forEach(buttonGroup => {
    let buttons = Array.from(buttonGroup.childNodes).filter(el => el.nodeName === 'BUTTON');
    let clickedFirst = undefined;

    buttons[0].addEventListener('click', () => {    // student button
        if (resetIsClicked.get(buttonGroup.id)) {
            clickedFirst = undefined;
            resetIsClicked.set(buttonGroup.id, false);
        }
        if (clickedFirst === undefined) {
            buttons[0].style.backgroundColor = '#fb5204';
            clickedFirst = true;
            buttonGroup.setAttribute('data-active-option', 'student');
        }
        else if (!clickedFirst) {
            buttons[0].style.backgroundColor = '#fb5204';
            buttons[1].style.backgroundColor = '#fc8955';
            clickedFirst = true;
            buttonGroup.setAttribute('data-active-option', 'student');
        }
        else {
            buttons[0].style.backgroundColor = '#fc8955';
            clickedFirst = undefined;
            buttonGroup.setAttribute('data-active-option', 'undefined');
        }
    });
    buttons[1].addEventListener('click', () => {    // teacher button
        if (resetIsClicked.get(buttonGroup.id)) {
            clickedFirst = undefined;
            resetIsClicked.set(buttonGroup.id, false);
        }
        if (clickedFirst === undefined) {
            buttons[1].style.backgroundColor = '#fb5204';
            clickedFirst = false;
            buttonGroup.setAttribute('data-active-option', 'teacher');
        }
        else if (clickedFirst) {
            buttons[1].style.backgroundColor = '#fb5204';
            buttons[0].style.backgroundColor = '#fc8955';
            clickedFirst = false;
            buttonGroup.setAttribute('data-active-option', 'teacher');
        }
        else {
            buttons[1].style.backgroundColor = '#fc8955';
            clickedFirst = undefined;
            buttonGroup.setAttribute('data-active-option', 'undefined');
        }
    });
});

// reset button selection by altering 'data-active-option' attribute and color
function reset() {
    let keys = Array.from(resetIsClicked.keys());
    keys.forEach(key => resetIsClicked.set(key, true));

    buttonGroups.forEach(buttonGroup => {
        let buttons = Array.from(buttonGroup.childNodes).filter(el => el.nodeName === 'BUTTON');
        buttons[0].style.backgroundColor = '#fc8955';
        buttons[1].style.backgroundColor = '#fc8955';
        buttonGroup.setAttribute('data-active-option', 'undefined');
    });
}
document.querySelector('#reset-admin-portal-button').addEventListener('click', reset);

// setting positions for apply and cancel buttons in grid layout,
// position depends on buttonGroups count
let buttons = document.querySelector('#admin-portal-buttons');

// send form from hidden button, find URL for form action attribute
let apply = document.querySelector('#apply-admin-portal-button');
apply.addEventListener('click', () => {

    let postFormBtn = document.querySelector('#post-form-button');
    let urlQuery = {};
    buttonGroups.forEach(buttonGroup => {
        let newRole = buttonGroup.getAttribute('data-active-option');
        // don't add data about students whose role didn't change to query
        if (newRole !== 'undefined') {
            urlQuery[`${ buttonGroup.id.split('group-')[1] }`] = newRole;
        }
    });
    if (!_.isEmpty(urlQuery)) {
        postFormBtn.formAction = `/admin_portal?${ new URLSearchParams(urlQuery).toString() }`;
    }
    postFormBtn.click();
});

const showMore = document.querySelector('#show-more');
const showLess = document.querySelector('#show-less');
showMore.style.whiteSpace = 'nowrap';
showLess.style.whiteSpace = 'nowrap';

const rowConstant = 5;
let rows = document.querySelectorAll('[data-index^="row-index-"]');
let totalRows = rows.length / 4;
let rowCount;
rowConstant <= totalRows ? rowCount = rowConstant : rowCount = totalRows;
let OFFSET = 3;    // number of elements above buttons

function alignButtons() {
    buttons.style.gridArea = rowCount + OFFSET + 1 + ' / 1 / span 1 / span 4';
    showMore.style.gridArea = rowCount + OFFSET + ' / 2 / span 1 / span 1';
    showLess.style.gridArea = rowCount + OFFSET + ' / 3 / span 1 / span 1';
}

function removeSomeRows() {
    rows.forEach((row, index) => {
        if (index + 1 > rowCount * 4) { // 4 because each line in grid has 4 elements
            row.remove();
        }
    });
    alignButtons();
}

function showAllRows() {
    let form = document.querySelector('#admin-portal-container > form');
    let x = 0, counter = 0;
    rows.forEach((row, index) => {
        let modulo = (index + 1) % 4, column;
        modulo === 0 ? column = 4 : column = modulo;
        row.style.gridArea = (x + OFFSET) + ' / ' + column + ' / span 1 / span 1';
        // console.log(row.style.gridArea);
        form.appendChild(row);
        counter++;
        if (counter === 4) {
            counter = 0;
            x++;
        }
    });
    alignButtons();
}

removeSomeRows();
showMore.addEventListener('click', () => {
    rowCount + rowConstant <= totalRows ? rowCount += rowConstant : rowCount = totalRows;
    showAllRows();
    removeSomeRows();
});

showLess.addEventListener('click', () => {
    rowCount - rowConstant >= 0 ? rowCount -= rowConstant : undefined;
    removeSomeRows();
});