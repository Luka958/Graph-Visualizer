import * as Help from "../models/DrawingHelperModel.js";

let vertexID = document.querySelector('#show-vertex-id-input');
let edgeID = document.querySelector('#show-edge-id-input');

let saveBtn = document.querySelector('#save-show-data-button');
saveBtn.onclick = () => {
    editVertexID(vertexID.checked);
    editEdgeID(edgeID.checked);
}

function editVertexID(makeVisible) {
    let textIDs = document.querySelectorAll('.canvas > [id^="text-id-"]');
    textIDs.forEach(textID => textID.style.visibility = (makeVisible ? 'visible' : 'hidden'));
}

function editEdgeID(makeVisible) {
    let weightTextIDs = Help.getAll('.canvas > [id^="weight-text-id-"]');

    weightTextIDs.forEach(weightTextID => {
        let con = weightTextID.textContent;

        if (makeVisible) {
            if (count(con, ';') === 1) return;  // already visible
            weightTextID.textContent = Help.getIDFromWeightText(weightTextID) + ';' + con;
        }
        else {
            if (count(con, ';') === 0) return;  // already hidden
            weightTextID.textContent = con.split(';')[1];
        }
    });
}

/**
 * counts the occurrences of a character in the string
 * @param str the string in which the character is searched
 * @param chr the character to search for
 * @returns {*|number} number of characters
 */
function count(str, chr) { return _.countBy(str)[chr] || 0; }
