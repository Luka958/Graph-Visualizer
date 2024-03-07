function bugReport() {
    let div = document.querySelector('#bug-report-div');
    let submit = document.querySelector('#submit-bug-report-button');
    let cancel = document.querySelector('#cancel-bug-report-button');

    cancel.addEventListener('click', () => div.style.visibility = 'hidden');            // TODO dont use a link!
    submit.addEventListener('click', () => {
        fetch('/bug_reports', {
            method: 'POST',
            body: new FormData(document.querySelector('#bug-report-div form'))
        }).then();

        div.style.visibility = 'hidden';
    });
}

bugReport();