"use strict";

const $logout = document.querySelector("div.user-info>span#btnLogout");
const $user_info = document.querySelector("div.user-info");
const $annonce_zone = document.getElementById("annonce-bouton");

// Image slider functionality using scrollLeft
const slider = document.getElementById('image-container');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');

// Function to handle button visibility
function updateButtonVisibility() {

    // Hide buttons when window width is less than 768 and slider width is less than 300
    if ((window.innerWidth < 768 && slider.offsetWidth >= 299) || (window.innerWidth < 1100 && slider.offsetWidth >= 699) || (window.innerWidth > 1100 && slider.offsetWidth >= 999)) {
        nextBtn.style.display = 'block';
        prevBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'none';

    }
}

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

document.addEventListener('DOMContentLoaded', loadProductDetails);

function loadProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (productId) {
        fetch(`http://localhost:3000/produit/${productId}`)
            .then(response => response.json())
            .then(data => {
                const detailsContainer = document.getElementById('product-details');
                const largeImage = document.getElementById('large-image');
                const imageContainer = document.getElementById('image-container');

                if (data) {
                    detailsContainer.innerHTML = `
        <h2 class="product-name">${data.product.name}</h2>
        <p class="product-owner"><strong>By:</strong> ${data.product.owner}</p>
        <p class="product-status ${data.product.status === "AVAILABLE" ? "available" : "unavailable"}">
            <strong>${data.product.status === "AVAILABLE" ? "Disponible" : "Plus en stock"}</strong>
        </p>
        <p class="product-type"><strong>Type:</strong> ${data.product.echange_type}</p>
        ${data.product.echange_type === "Troc" ? `<p class="product-exchange"><strong>Contre:</strong> ${data.product.echange_contre}</p>` : ""}`;


                    // Populate image container and set the large image to the first one
                    if (data.product.images.length > 0) {
                        largeImage.src = `uploads/${data.product.images[0].image}`; // Set first image as large image
                    }

                    data.product.images.forEach(element => {
                        const img = document.createElement('img');
                        img.src = `uploads/${element.image}`;
                        img.alt = 'Image du produit';
                        img.style.cursor = 'pointer';  // Make it clear that images are clickable

                        // When image is clicked, update the large image
                        img.addEventListener('click', () => {
                            largeImage.src = img.src; // Change the large image to the clicked image
                        });

                        imageContainer.appendChild(img);
                    });

                    // Fetch user details for owner info
                    fetch(`http://localhost:3000/user/${data.product.owner}`)
                        .then(response => response.json())
                        .then(owner_data => {
                            detailsContainer.innerHTML += owner_data ? `
                                    <strong>Numéro de téléphone :</strong> ${owner_data.tel || "Aucun"}<br>
                                    <strong>Email :</strong> ${owner_data.email || "Aucun"}<br>
                                ` : "";

                            // Call the function once initially to set the correct state
                            updateButtonVisibility();
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            document.getElementById('product-details').innerHTML = 'Erreur lors du chargement des détails du produit.';
                        });
                } else {
                    detailsContainer.innerHTML = '<p>Produit non trouvé.</p>';
                }




                // Add an event listener to update button visibility on window resize
                window.addEventListener('resize', updateButtonVisibility);


                nextBtn.addEventListener('click', () => {
                    slider.scrollLeft += 200; // Move 200px to the right
                });

                prevBtn.addEventListener('click', () => {
                    slider.scrollLeft -= 200; // Move 200px to the left
                });
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('product-details').innerHTML = 'Erreur lors du chargement des détails du produit.';
            });

    } else {
        document.getElementById('product-details').innerHTML = '<p>ID du produit manquant.</p>';
    }
}









