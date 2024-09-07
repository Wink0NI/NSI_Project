"use strict";

const $logout = document.querySelector("div.user-info>span#btnLogout");
        // Vérifier si l'utilisateur est connecté
        fetch('http://localhost:3000/check-session', {
            credentials: 'include'
        }).then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    const $user_greeting = document.createElement('span');
                    $user_greeting.setAttribute("id", 'user-greeting');
                    $user_greeting.innerHTML = `Connecté en tant que <strong>${data.username}</strong>`;
                    $logout.insertAdjacentElement("beforebegin", $user_greeting);

                } else {
                    window.location.href = 'login.html';
                }
            })
            .catch(err => {
                 window.location.href = 'login.html';
            });

        function logout() {
            fetch('http://localhost:3000/logout', {
                credentials: 'include'
            }).then(() => {
                alert('Déconnexion réussie');
                window.location.href = 'index.html';
            });
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
        function price_option_change() {
            const $echange_type = document.getElementById("echange-type");
            

            if ($echange_type.value === "Troc") {
                document.getElementById("echange-contre").style.display = "block";
                document.getElementById("forWhat").style.display = "block";
            } else {
                document.getElementById("echange-contre").style.display = "none";
                document.getElementById("forWhat").style.display = "none";
            }
        }

        function type_option_change() {
            const c_icon = document.getElementById("ProductTypeIcon");
            const productType = document.getElementById("product-category").value;

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

        function submitForm(event) {
            event.preventDefault();
            const formData = new FormData(document.getElementById("product-form"));

            fetch('http://localhost:3000/submit-product', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            }).then(response => response.json())
                .then(data => {
                    if (data.message === "FAILURE") alert(data.error);
                    else {
                        alert(data.message);
                        window.open(`product-details.html?id=${data.id}`, '_blank');
                    }

                }).catch(error => console.error('Error:', error));
        }