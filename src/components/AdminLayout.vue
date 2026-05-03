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
          <RouterLink to="/admin/orders" class="sidebar-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
            Orders
          </RouterLink>
          <RouterLink to="/admin/users" class="sidebar-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Users
          </RouterLink>

          <span class="sidebar-section-label" style="margin-top:12px;">Catalog</span>

          <RouterLink to="/admin/categories" class="sidebar-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Categories
          </RouterLink>
          <RouterLink to="/admin/colors" class="sidebar-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/><path d="M2 12h20"/></svg>
            Colors
          </RouterLink>
          <RouterLink to="/admin/sizes" class="sidebar-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 3H3v7h18V3z"/><path d="M21 14H3v7h18v-7z"/><path d="M12 10v4"/></svg>
            Sizes
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

<style scoped>
.admin-wrapper { display: flex; min-height: 100svh; }
.admin-sidebar { width: 220px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--line); display: flex; flex-direction: column; position: sticky; top: 0; height: 100svh; overflow-y: auto; }
.sidebar-top { flex: 1; padding: 20px 12px 12px; display: flex; flex-direction: column; gap: 4px; }
.sidebar-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; padding: 6px 8px; margin-bottom: 12px; }
.nav-logo-icon { width: 28px; height: 28px; background: var(--ink); color: #FAF8F4; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; font-family: var(--serif); flex-shrink: 0; }
.sidebar-brand span:last-child { font-weight: 700; font-size: 15px; color: var(--ink); }
.sidebar-section-label { font-size: 11px; font-weight: 600; letter-spacing: .6px; text-transform: uppercase; color: var(--ink-3); padding: 4px 8px 8px; }
.sidebar-nav { display: flex; flex-direction: column; gap: 2px; }
.sidebar-link { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--ink-2); text-decoration: none; transition: background .15s, color .15s; border: none; background: none; cursor: pointer; font-family: var(--sans); width: 100%; text-align: left; }
.sidebar-link:hover { background: var(--line-2); color: var(--ink); }
.sidebar-link.router-link-active, .sidebar-link.router-link-exact-active { background: var(--gold-bg); color: var(--gold); }
.sidebar-link--muted { color: var(--ink-3); opacity: .75; }
.sidebar-bottom { padding: 12px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 2px; }
.sidebar-logout { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--warn); border: none; background: none; cursor: pointer; font-family: var(--sans); width: 100%; text-align: left; transition: background .15s; }
.sidebar-logout:hover { background: rgba(180,61,61,.08); }
.admin-main { flex: 1; background: var(--line-2); min-height: 100svh; overflow-y: auto; }
</style>
