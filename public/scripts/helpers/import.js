const fileInput = document.querySelector('#import-choose-input');
const submit = document.querySelector('#import-submit-input');

fileInput.addEventListener('change', event => {
    const files = event.target.files;

    const p = document.querySelector('#import-paragraph');
    // change Import Graph window look depending on user input
    if (files.length === 1) {
        if (files[0].name.split('.')[1] !== 'json') {
            p.innerHTML = 'Note: ' + '<b>File extension has to be .json.</b>' + '<br>' +
                'You can upload only one file!';
        } else {
            p.innerHTML = 'Note: ' + 'File extension has to be .json.' + '<br>' +
                'You can upload only one file!' + '<br>' + `<b>${ files[0].name }</b>`;
            submit.disabled = false;
        }
    }
});