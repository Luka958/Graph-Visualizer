let password = document.querySelector('#sign-up-input-8');
let confirmPassword = document.querySelector('#sign-up-input-9');
document.querySelector('#sign-up-button').addEventListener('click', () => {
    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords must be the same!');
    }
    else {
        confirmPassword.setCustomValidity('');
    }
});
