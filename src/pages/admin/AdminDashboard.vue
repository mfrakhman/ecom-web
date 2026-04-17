<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import { getProducts } from '../../services/products'

const productCount = ref<number | null>(null)

onMounted(async () => {
  try {
    const products = await getProducts({ limit: 200 })
    productCount.value = products.length
  } catch {
    productCount.value = 0
  }
})
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <h1 class="admin-page-title">Dashboard</h1>

      <div class="admin-stats">
        <div class="stat-card">
          <span class="stat-value">{{ productCount ?? '…' }}</span>
          <span class="stat-label">Total Products</span>
        </div>
      </div>

      <div class="admin-quick-links">
        <h2>Quick Actions</h2>
        <div class="quick-links-grid">
          <RouterLink to="/admin/products" class="quick-link-card">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>Manage Products</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
