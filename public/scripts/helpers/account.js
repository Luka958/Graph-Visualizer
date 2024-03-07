let closeBtn = document.querySelector('#close-account-button');
closeBtn.addEventListener('click', () => {
    location.replace('/');
});

let password = document.querySelector('#account-input-8');
let confirmPassword = document.querySelector('#account-input-9');

document.querySelector('#account-button').addEventListener('click', () => {
    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords must be the same!');
    }
    else {
        confirmPassword.setCustomValidity('');
    }
});
