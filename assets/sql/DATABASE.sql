CREATE DATABASE annonces_db;

USE annonces_db;

CREATE TABLE annonces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    price VARCHAR(50) NOT NULL,
    num VARCHAR(50) NOT NULL
);
