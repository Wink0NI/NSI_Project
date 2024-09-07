"use strict";

document.getElementById('tel').addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9 ]/g, '') // Remove all non-numeric characters except spaces
                           .replace(/(\d{2})(?=\d)/g, '$1 ') // Add space after every 2 digits
                           .trim(); // Remove trailing space if exists
});

fetch('http://localhost:3000/check-session', {
    credentials: 'include'
}).then(response => response.json())
    .then(data => {
        if (data.loggedIn) {
            window.location.href = 'http://localhost:8080';
        }
    });

const password = document.getElementById("password");
const confirm_password = document.getElementById("confirm_password");
const errorMessage = document.getElementById("error-message");

function validate_password() {
    return password.value === confirm_password.value;
}

document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();
    errorMessage.textContent = "";

    if (validate_password()) {

        fetch('http://localhost:3000/register', {
            method: 'POST',
            body: JSON.stringify({
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                email: document.getElementById('email').value.toLowerCase(),
                tel: document.getElementById('tel').value
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        }).then(response => response.json())
            .then(data => {
                if ("Nom d'utilisateur déjà existant" === data.message) {
                    errorMessage.textContent = data.message;
                }
                if (data.message === 'Inscription réussie') {
                    alert(data.message);
                    window.location.href = 'index.html';  // Redirection vers la page principale
                }
            }).catch(error => console.error('Error:', error));

    } else {
        errorMessage.textContent = 'Les mots de passe ne correspondent pas';
    }

});