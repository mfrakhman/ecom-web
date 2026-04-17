<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { clearToken } from '../services/auth'

const router = useRouter()

function logout() {
  clearToken()
  router.push('/login')
}
</script>

<template>
  <div class="admin-wrapper">
    <aside class="admin-sidebar">
      <div class="sidebar-top">
        <RouterLink to="/" class="sidebar-brand">
          <span class="nav-logo-icon">R</span>
          <span>RetailCo</span>
        </RouterLink>

        <span class="sidebar-section-label">Menu</span>

        <nav class="sidebar-nav">
          <RouterLink to="/admin" class="sidebar-link" :end="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </RouterLink>
          <RouterLink to="/admin/products" class="sidebar-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            Products
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <RouterLink to="/" class="sidebar-link sidebar-link--muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Storefront
        </RouterLink>
        <button class="sidebar-logout" @click="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>
