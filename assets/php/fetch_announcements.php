<?php
// Database connection
$conn = new mysqli("localhost", "root", "", "annonces_db");

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch announcements from the database
$sql = "SELECT image_url, price, num FROM annonces";
$result = $conn->query($sql);

for ($i = 0; $i < 6; $i++) {
    if ($row = $result->fetch_assoc()) {
        echo '<div class="product">';
        echo '<img src="uploads/' . $row["image_url"] . '" alt="Photo du produit">';
        echo '<p>Prix: ' . $row["price"] . '€</p>';
        echo '<p>Num: ' . $row["num"] . '</p>';
        echo '</div>';
    } else {
        echo '<div class="product grayed-out">';
        echo '<p>Annonce Vide</p>';
        echo '</div>';
    }
}

$conn->close();
?>
