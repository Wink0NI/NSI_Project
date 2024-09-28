"use strict";

const $logout = document.querySelector("div.user-info>span#btnLogout");
const $user_info = document.querySelector("div.user-info");
const $annonce_zone = document.getElementById("annonce-bouton");

const categories = document.querySelectorAll('nav>ul>li>a.category');
const nbre_produit = document.getElementById("nbre-produit");

let currentPage = 1; // Start with the first page
const productsPerPage = 20; // You can adjust the number of products per page

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



function price_option_change() {
    const sel_price = document.getElementById("select-price");
    const priceInput = document.getElementById("product-price");

    if (sel_price.value == "1" || sel_price.value == "3") {
        priceInput.style.display = "block";
        priceInput.type = "number";
    } else {
        priceInput.style.display = "none";
    }
}

function display_img_product() {
    const displayimg = document.getElementById("product-image-display");
    const file = document.getElementById("product-image").files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            displayimg.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

function type_option_change() {
    const c_icon = document.getElementById("ProductTypeIcon");
    const productType = document.getElementById("product-type").value;

    const typeIcons = {
        "indetermine": "fa-question",
        "divers": "fa-gift",
        "meuble": "fa-bed",
        "vetement": "fa-male",
        "jeux": "fa-gamepad",
        "nourriture": "fa-cutlery"
    };

    c_icon.className = `fa ${typeIcons[productType]}`;
}





async function loadProducts(category, page = 1) {
    let link = `http://localhost:3000/produits?page=${page}&limit=${productsPerPage}`;
    if (category) {
        link += `&category=${category}`;
    }

    try {
        const response = await fetch(link);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des produits');
        }
        const data = await response.json();

        const postSection = document.querySelector('section.post');

        // Clear the section before adding new products
        postSection.innerHTML = '';

        // Loop through each product and create corresponding HTML elements
        data.produits.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';

            const productImage = document.createElement('img');
            productImage.src = `/uploads/${product.images[0].image}`;
            productImage.alt = product.name;

            const productType = document.createElement('h2');
            productType.textContent = product.name;

            const productPrice = document.createElement('p');
            productPrice.textContent = `Type d'échange: ${product.echange_type}`;

            productDiv.addEventListener('click', () => {
                window.location.href = `/product-details.html?id=${product.id}`;
            });

            productDiv.appendChild(productImage);
            productDiv.appendChild(productType);
            productDiv.appendChild(productPrice);

            postSection.appendChild(productDiv);


        });

        nbre_produit.textContent = `${data.totalProducts} ${data.totalProducts < 2 ? "produit trouvée" : "produits trouvées"}`;
        nbre_produit.setAttribute("value", data.totalProducts);

        if (data.produits.length === 0) {
            postSection.innerHTML = "Vide...";
        }

        // Call the function to handle pagination controls
        setupPaginationControls(data.totalPages);

    } catch (err) {
        console.error(err.message);
    }
}








// Charger les produits une fois que la page est complètement chargée
window.onload = function () {
    // Extraire la catégorie de l'URL
    const hash = window.location.hash; // Ex : #jeux
    const category = hash ? hash.substring(1) : null; // Retirer le '#' du début


    // Appeler la fonction avec la catégorie extraite
    loadProducts(category);
};

function setupPaginationControls(totalPages) {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const pageButtons = document.getElementById('pagination-controls');

    if (parseInt(nbre_produit.getAttribute("value")) === 0) pageButtons.style.display = 'none';
    else {
        pageButtons.style.display = 'block';

        // Update page info
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

        // Disable/enable buttons based on the current page
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;

        // Add click event listeners to change pages
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadProducts(currentCategory, currentPage); // Load previous page
            }
        };

        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadProducts(currentCategory, currentPage); // Load next page
            }
        };
    }
}

let currentCategory = '';

categories.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        currentCategory = link.getAttribute('value'); // Get the category from the "value" attribute

        currentPage = 1; // Reset to the first page for the new category
        loadProducts(currentCategory, currentPage); // Load products for the selected category
    });
});

