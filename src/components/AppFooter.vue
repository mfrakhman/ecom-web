<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo-icon">R</span>
        <span class="footer-logo-text">RetailCo</span>
        <p>Your favourite shopping destination.</p>
      </div>

      <div class="footer-links">
        <h4>Shop</h4>
        <ul>
          <li><a href="#">Bags</a></li>
          <li><a href="#">Shoes</a></li>
          <li><a href="#">Clothes</a></li>
          <li><a href="#">Pants</a></li>
        </ul>
      </div>

      <div class="footer-links">
        <h4>Support</h4>
        <ul>
          <li><a href="#">Help Center</a></li>
          <li><a href="#">Returns</a></li>
          <li><a href="#">Track Order</a></li>
          <li><a href="#">Contact Us</a></li>
        </ul>
      </div>

      <div class="footer-links">
        <h4>Company</h4>
        <ul>
          <li><a href="#">About</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p>© {{ new Date().getFullYear() }} RetailCo. All rights reserved.</p>
    </div>
  </footer>
</template>
