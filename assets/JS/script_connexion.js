"use strict";

fetch('http://localhost:3000/check-session', {
    credentials: 'include'
}).then(response => response.json())
    .then(data => {
        if (data.loggedIn) {
            window.location.href = 'http://localhost:8080';
        }
    });

const errorMessage = document.getElementById("error-message");

document.getElementById('loginForm').onsubmit = function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    errorMessage.textContent = "";  // Vide le message d'erreur s'il y en avait un

    fetch('http://localhost:3000/login', {
        method: 'POST',
        body: JSON.stringify({
            username: formData.get('username'),
            password: formData.get('password')
        }),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    }).then(response => response.json())
        .then(data => {
            if (['Utilisateur inexistant', "Nom d'utilisateur ou mot de passe incorrect"].includes(data.message)) {
                errorMessage.textContent = data.message;
            }

            else if (data.message === 'Connexion réussie') {
                alert(data.message);
                window.location.href = 'index.html';  // Redirection vers la page principale
            }
        }).catch(error => { console.error('Error:', error) });
};