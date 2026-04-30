<template>
  <footer class="site-footer">
    <div class="site-footer-top">

      <div class="footer-brand">
        <div class="footer-logo">
          <span class="nav-logo-icon">R</span>
          <span class="footer-logo-name">RetailCo</span>
        </div>
        <p class="footer-tagline">Your favourite shopping destination.</p>
      </div>

      <div class="footer-col">
        <p class="footer-col-label">Shop</p>
        <ul class="footer-col-links">
          <li><a href="#">Bags</a></li>
          <li><a href="#">Outerwear</a></li>
          <li><a href="#">Trousers</a></li>
          <li><a href="#">T-Shirts</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <p class="footer-col-label">Support</p>
        <ul class="footer-col-links">
          <li><a href="#">Help Center</a></li>
          <li><a href="#">Returns</a></li>
          <li><a href="#">Track Order</a></li>
          <li><a href="#">Contact Us</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <p class="footer-col-label">Company</p>
        <ul class="footer-col-links">
          <li><a href="#">About</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
        </ul>
      </div>

    </div>

    <div class="site-footer-bottom">
      <p>© {{ new Date().getFullYear() }} RetailCo. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer { background: var(--ink); color: var(--ink-3); }
.site-footer-top {
  max-width: 1280px; margin: 0 auto; padding: 56px 24px 48px;
  display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 40px;
}
@media (max-width: 768px) { .site-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; } }
@media (max-width: 480px) { .site-footer-top { grid-template-columns: 1fr; } }
.footer-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.footer-logo .nav-logo-icon { background: #FAF8F4; color: var(--ink); }
.footer-logo-name { font-family: var(--serif); font-size: 18px; font-weight: 500; color: #FAF8F4; }
.nav-logo-icon {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; font-family: var(--serif);
}
.footer-tagline { font-size: 14px; color: var(--ink-3); margin: 0; line-height: 1.6; max-width: 200px; }
.footer-col-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #FAF8F4; margin: 0 0 16px; }
.footer-col-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.footer-col-links a { font-size: 14px; color: var(--ink-3); text-decoration: none; transition: color .15s; }
.footer-col-links a:hover { color: #FAF8F4; }
.site-footer-bottom { border-top: 1px solid rgba(250,248,244,.10); padding: 20px 24px; text-align: center; }
.site-footer-bottom p { font-size: 13px; color: var(--ink-3); margin: 0; }
</style>
