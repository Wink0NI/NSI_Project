"use strict";

const $logout = document.querySelector("div.user-info>span#btnLogout");
const $user_info = document.querySelector("div.user-info");

// Vérifier si l'utilisateur est connecté
fetch('http://localhost:3000/check-session', {
    credentials: 'include'
}).then(response => response.json())
    .then(data => {
        if (data.loggedIn) {
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

        } else {
            window.location.href = 'login.html';
        }
    });

function logout() {
    fetch('http://localhost:3000/logout', {
        credentials: 'include'
    }).then(() => {
        alert('Déconnexion réussie');
        window.location.href = 'index.html';
    });
}

// Récupérer les annonces créées par l'utilisateur connecté
fetch('http://localhost:3000/my_products', {
    credentials: 'include'  // Ensure session cookies are sent
})
    .then(response => response.json())
    .then(data => {
        const productsContainer = document.getElementById('my-products');
        if (data.products && data.products.length > 0) {
            // Clear container before appending products
            productsContainer.innerHTML = '';

            data.products.forEach(product => {
                // Create a product div element
                const productDiv = document.createElement('div');
                productDiv.classList.add('produit');
                productDiv.innerHTML = `
                <strong>Nom :</strong> ${product.name}<br>
                <strong>Type :</strong> ${product.echange_type}<br>
                <strong>Contre :</strong> ${product.echange_contre}<br>
                <strong>Description :</strong> ${product.description}<br>
                <img src="uploads/${product.image}" alt="Image du produit" style="max-width: 100px;"><br>
                <strong>Date :</strong> ${Date(product.date_creation)}<br>
                <strong>statut :</strong> ${product.status === "AVAILABLE" ? "En cours" : "Clôturé"}<br>
                <button class="link_button">Voir les détails</button><br>
                <button class="delete_product">Supprimer</button><br>
            `;

                // Append the product div to the container
                productsContainer.appendChild(productDiv);

                const link = productDiv.querySelector('.link_button');
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    // Open the product details page in a new tab
                    window.open(`product-details.html?id=${product.id}`, '_blank');
                });
                // Add event listener to the delete button
                const deleteButton = productDiv.querySelector('.delete_product');
                deleteButton.addEventListener("click", function (event) {
                    event.preventDefault();

                    // Send POST request to delete the product
                    fetch("http://localhost:3000/my_products/delete", {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'  // Specify JSON format
                        },
                        body: JSON.stringify({ image_id: product.id })  // Send product ID
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message === "FAILURE") {
                                alert(data.error);
                            } else {
                                alert("Article supprimé avec succès...");
                                window.location.reload();  // Reload the page to update the product list
                            }
                        })
                        .catch(error => console.error('Erreur lors de la suppression de l\'article:', error));
                });

                const edit_button = document.createElement('button');
                edit_button.classList.add('edit_button');
                edit_button.innerHTML = product.status === "AVAILABLE" ? "Clôturer l'article" : "Remettre l'article";
                productDiv.appendChild(edit_button);

                edit_button.addEventListener('click', function (e) {
                    e.preventDefault();
                    let link = product.status === "AVAILABLE" ? "http://localhost:3000/my_products/edit_status/finished" : "http://localhost:3000/my_products/edit_status/available";
                    fetch(link, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'  // Specify JSON format
                        },
                        body: JSON.stringify({ image_id: product.id })  // Send product ID

                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message === "FAILURE") {
                                alert(data.error);
                            } else {
                                alert("Article modifié avec succès...");
                                window.location.reload();  // Reload the page to update the product list
                            }
                        })
                        .catch(error => console.error('Erreur lors de la suppression de l\'article:', error));
                });
            });

        } else {
            productsContainer.innerHTML = '<p>Aucune annonce trouvée.</p>';
        }
    })
    .catch(error => console.error('Erreur lors du chargement des annonces:', error));


