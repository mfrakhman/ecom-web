<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import { getProducts } from '../../services/products'
import { getCategories, getColors, getSizes } from '../../services/admin'

const productCount  = ref<number | null>(null)
const categoryCount = ref<number | null>(null)
const colorCount    = ref<number | null>(null)
const sizeCount     = ref<number | null>(null)

onMounted(async () => {
  const [products, cats, colors, sizes] = await Promise.allSettled([
    getProducts({ limit: 200 }),
    getCategories(),
    getColors(),
    getSizes(),
  ])
  productCount.value  = products.status  === 'fulfilled' ? products.value.length  : 0
  categoryCount.value = cats.status      === 'fulfilled' ? (cats.value.data?.length ?? 0) : 0
  colorCount.value    = colors.status    === 'fulfilled' ? (colors.value.data?.length ?? 0) : 0
  sizeCount.value     = sizes.status     === 'fulfilled' ? (sizes.value.data?.length ?? 0) : 0
})
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <h1 class="admin-page-title" style="margin-bottom:24px;">Dashboard</h1>

      <div class="admin-stats">
        <div class="stat-card">
          <span class="stat-value">{{ productCount ?? '…' }}</span>
          <span class="stat-label">Products</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ categoryCount ?? '…' }}</span>
          <span class="stat-label">Categories</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ colorCount ?? '…' }}</span>
          <span class="stat-label">Colors</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ sizeCount ?? '…' }}</span>
          <span class="stat-label">Sizes</span>
        </div>
      </div>

      <div class="admin-quick-links">
        <h2 class="admin-section-title" style="margin-bottom:16px;">Quick Actions</h2>
        <div class="quick-links-grid">
          <RouterLink to="/admin/products" class="quick-link-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>Products</span>
          </RouterLink>
          <RouterLink to="/admin/orders" class="quick-link-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Orders</span>
          </RouterLink>
          <RouterLink to="/admin/categories" class="quick-link-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>Categories</span>
          </RouterLink>
          <RouterLink to="/admin/colors" class="quick-link-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/><path d="M2 12h20"/></svg>
            <span>Colors</span>
          </RouterLink>
          <RouterLink to="/admin/sizes" class="quick-link-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 3H3v7h18V3z"/><path d="M21 14H3v7h18v-7z"/></svg>
            <span>Sizes</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.admin-quick-links { margin-top: 36px; }
.quick-links-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.quick-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 28px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  text-decoration: none;
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 500;
  min-width: 120px;
  transition: border-color .15s, color .15s, background .15s;
}
.quick-link-card:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-bg); }
</style>
