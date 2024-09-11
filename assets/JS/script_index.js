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



async function loadProducts(category) {
    let link = "http://localhost:3000/produits"
    if (category) {
        link += `/${category}`;
    }
    try {
        const response = await fetch(link);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des produits');
        }
        const data = await response.json();

        const postSection = document.querySelector('section.post');

        // Vider la section post avant d'ajouter de nouveaux éléments
        postSection.innerHTML = '';

        // Boucle pour chaque produit et création des éléments HTML correspondants
        data.produits.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';

            const productImage = document.createElement('img');
            productImage.src = `/uploads/${product.image}`;
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
        if (data.produits.length === 0) {
            postSection.innerHTML = "Vide...";
        }
    } catch (err) {
        console.error(err.message);
    }
}

const categories = document.querySelectorAll('nav>ul>li>a.category');
categories.forEach(category => {
    category.addEventListener('click', () => {
        loadProducts(category.getAttribute("value"));
    });
});






// Charger les produits une fois que la page est complètement chargée
window.onload = function () {
    // Extraire la catégorie de l'URL
    const hash = window.location.hash; // Ex : #jeux
    const category = hash ? hash.substring(1) : null; // Retirer le '#' du début

    // Appeler la fonction avec la catégorie extraite
    loadProducts(category);
};