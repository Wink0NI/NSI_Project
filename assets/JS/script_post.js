"use strict";
let selectedFiles = []; // To keep track of selected files

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

function updateFileInput() {
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach(file => dataTransfer.items.add(file));

    // Update the input's files property
    document.getElementById("product-image").files = dataTransfer.files;
}

function displayImages() {
    const imageContainer = document.getElementById("image-container");
    const files = document.getElementById("product-image").files;

    // Filter the selected files to only include PNG and JPG images
    let validFiles = [];
    Array.from(files).forEach(file => {
        const fileType = file.type.toLowerCase();
        
        // Check if file type is either PNG or JPEG
        if (fileType === "image/png" || fileType === "image/jpeg" || fileType === "image/gif" || fileType === "image/webp") {
            validFiles.push(file); // Add to valid files array
        } else {
            // Alert the user about incompatible file type
            alert(`Le fichier "${file.name}" n'est pas compatible. Seuls le format png, jpg, gif et webp sont autorisés.`);
        }
    });

    // Check if adding new files exceeds the limit of 32 images
    if (selectedFiles.length + validFiles.length > 32) {
        alert("Hop la. Limite maximum de 32 images.");
        return; // Exit the function if limit is exceeded
    }

    // Add valid files to selectedFiles array
    selectedFiles = [...selectedFiles, ...validFiles];
    updateFileInput(); // Assuming this function updates the file input field

    // Clear the container before displaying new images
    imageContainer.innerHTML = '';

    // Display all selected files
    selectedFiles.forEach((file) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const imgDiv = document.createElement("div");
            imgDiv.style.display = "inline-block";
            imgDiv.style.margin = "5px";
            imgDiv.style.position = "relative";

            const img = document.createElement("img");
            img.src = e.target.result;
            img.style.height = "100px";
            img.style.display = "block";

            const removeBtn = document.createElement("button");
            removeBtn.innerHTML = "Remove";
            removeBtn.style.position = "absolute";
            removeBtn.style.top = "5px";
            removeBtn.style.right = "5px";
            removeBtn.style.backgroundColor = "red";
            removeBtn.style.color = "white";
            removeBtn.style.border = "none";
            removeBtn.style.cursor = "pointer";

            removeBtn.onclick = function () {
                imgDiv.remove();
                // Remove the file from the selectedFiles array
                selectedFiles = selectedFiles.filter(f => f !== file);
                updateFileInput();
            };

            imgDiv.appendChild(img);
            imgDiv.appendChild(removeBtn);
            imageContainer.appendChild(imgDiv);
        };

        reader.readAsDataURL(file);
    });
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
                window.location.href = `product-details.html?id=${data.id}`;
            }

        }).catch(error => console.error('Error:', error));
}