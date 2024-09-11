"use strict";

const $logout = document.querySelector("div.user-info>span#btnLogout");
const $user_info = document.querySelector("div.user-info");
const $annonce_zone = document.getElementById("annonce-bouton");

// Vérifier si l'utilisateur est connecté
fetch('http://localhost:3000/check-session', {
    credentials: 'include'
}).then(response => response.json())
    .then(data => {
        if (data.loggedIn) {
            document.getElementById('annonce-bouton').style.display = 'block';
            $user_info.removeChild(document.getElementById('btnLogin'));
            $user_info.removeChild(document.getElementById('btnRegister'));

            const $logout = document.createElement('span');
            $logout.setAttribute("id", "btnLogout");
            $logout.addEventListener("click", function () {
                fetch('http://localhost:3000/logout', {
                    credentials: 'include'
                }).then(() => {
                    alert('Déconnexion réussie');
                    window.location.reload(); // Recharger la page après déconnexion
                });
            });
            $logout.textContent = "Se Déconnecter";
            $user_info.appendChild($logout);

            const $user_greeting = document.createElement('span');
            $user_greeting.setAttribute("id", 'user-greeting');
            $user_greeting.innerHTML = `Connecté en tant que <strong>${data.username}</strong>`;
            $logout.insertAdjacentElement("beforebegin", $user_greeting);


            const $my_products = document.createElement('span');
            $my_products.setAttribute('id', "my_products");
            $my_products.textContent = "Mes produits";

            $my_products.addEventListener('click', function (e) {
                window.location.href = "my_products.html"
            })
            $logout.insertAdjacentElement("beforebegin", $my_products);



            const $annonce_button = document.createElement("button");
            $annonce_button.textContent = "Ajouter Annonce";
            $annonce_button.addEventListener('click', function (e) {
                window.location.href = "post.html"
            });
            $annonce_zone.appendChild($annonce_button);

            const $add_annonce_plus = document.createElement("i");
            $add_annonce_plus.classList.add("fa");
            $add_annonce_plus.classList.add("fa-plus-circle");
            $add_annonce_plus.setAttribute("aria-hidden", true)
            $annonce_zone.appendChild($add_annonce_plus);


        }
    });

function loadProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (productId) {
        fetch(`http://localhost:3000/produit/${productId}`)
            .then(response => response.json())
            .then(data => {
                const detailsContainer = document.getElementById('product-details');
                if (data) {
                    detailsContainer.innerHTML = `
                         <strong>Nom :</strong> ${data.product.name}<br>
                         <strong>By :</strong> ${data.product.owner}<br>
                            <strong>Type :</strong> ${data.product.echange_type}<br>
                            ${data.product.echange_type === "Troc" ? "<strong>Contre :</strong>" + data.product.echange_contre + "<br>" : ""}
                            <strong>Disponibilité :</strong> ${data.product.status === "AVAILABLE" ? "Disponible" : "Plus en stock"}<br>
                            ${data.product.image ? `<img src="uploads/${data.product.image}" alt="Product image" style="max-width: 200px;"><br>` : ''}
                        `;

                    fetch(`http://localhost:3000/user/${data.product.owner}`)
                        .then(response => response.json())
                        .then(owner_data => {
                            detailsContainer.innerHTML += owner_data ?
                                `<strong>Numéro de téléphone :</strong> ${owner_data.tel ? owner_data.tel : "Aucun"}<br>
                                     <strong>Email :</strong> ${owner_data.email ? owner_data.email : "Aucun"}<br>` : ""
                        }).catch(error => {
                            console.error('Error:', error);
                            document.getElementById('product-details').innerHTML = error
                        });
                } else {
                    detailsContainer.innerHTML = '<p>Produit non trouvé.</p>';
                }

            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('product-details').innerHTML = '<p>Erreur lors du chargement des détails du produit.</p>';
            });
    } else {
        document.getElementById('product-details').innerHTML = '<p>ID du produit manquant.</p>';
    }
}

document.addEventListener("DOMContentLoaded", loadProductDetails);