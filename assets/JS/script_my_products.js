"use strict";

const $logout = document.querySelector("div.user-info>span#btnLogout");
const $user_info = document.querySelector("div.user-info");

let currentPage = 1;
const productsPerPage = 10; // Adjust the number of products per page

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
function loadMyProducts(page = 1) {
    fetch(`http://localhost:3000/my_products?page=${page}&limit=${productsPerPage}`, {
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
                        <img src="uploads/${product.images[0].image}" alt="Image du produit" style="max-width: 100px;"><br>
                        <strong>Date :</strong> ${new Date(product.date_creation).toLocaleDateString()}<br>
                        <strong>Statut :</strong> ${product.status === "AVAILABLE" ? "En cours" : "Clôturé"}<br>
                        <button class="link_button">Voir les détails</button><br>
                        <button class="delete_product">Supprimer</button><br>
                        <button class="edit_product">Modifier</button><br>
                    `;

                    // Append the product div to the container
                    productsContainer.appendChild(productDiv);

                    const link = productDiv.querySelector('.link_button');
                    link.addEventListener('click', function (e) {
                        e.preventDefault();
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

                const edit_status_button = document.createElement('button');
                edit_status_button.classList.add('edit_status_button');
                edit_status_button.innerHTML = product.status === "AVAILABLE" ? "Clôturer l'article" : "Remettre l'article";
                productDiv.appendChild(edit_status_button);

                edit_status_button.addEventListener('click', function (e) {
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

                    const edit_button = productDiv.querySelector('.edit_product');
                    edit_button.addEventListener('click', function (e) {
                        e.preventDefault();
                        // Open the edit product page in a new tab
                        window.open(`edit-product.html?id=${product.id}`, '_blank');
                    });

                    // Setup pagination controls
                    setupPagination(data.currentPage, data.totalPages);

                });


            } else {
                productsContainer.innerHTML = '<p>Aucune annonce trouvée.</p>';
            }
        })
        .catch(error => console.error('Erreur lors du chargement des annonces:', error));

}
function setupPagination(currentPage, totalPages) {
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = '';  // Clear existing pagination controls

    if (totalPages > 1) {
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Précédent';
            prevButton.addEventListener('click', () => {
                loadMyProducts(currentPage - 1);
            });
            paginationControls.appendChild(prevButton);
        }

        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;
        paginationControls.appendChild(pageInfo);

        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Suivant';
            nextButton.addEventListener('click', () => {
                loadMyProducts(currentPage + 1);
            });
            paginationControls.appendChild(nextButton);
        }
    }
}

// Initially load the first page of products
loadMyProducts(currentPage);