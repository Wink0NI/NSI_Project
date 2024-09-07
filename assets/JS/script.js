"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // Load the announcements or any other initialization logic
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav ul');

  menuToggle.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');

  });
});