<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import ProductCard from '../components/ProductCard.vue'
import { getProducts, type Product } from '../services/products'
import { safeFetch } from '../services/http'

const route = useRoute()
const router = useRouter()

const allProducts = ref<Product[]>([])
const loading = ref(false)
const error = ref('')
const LIMIT = 6

// Flat category list for descendant lookups
interface FlatCategory { id: string; parentId: string | null; slug: string }
const allCategories = ref<FlatCategory[]>([])

function flattenTree(nodes: any[]): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const node of nodes) {
    result.push({ id: node.id, parentId: node.parentId ?? null, slug: node.slug })
    if (node.children?.length) result.push(...flattenTree(node.children))
  }
  return result
}

function descendantSlugs(slug: string): Set<string> {
  const root = allCategories.value.find(c => c.slug === slug)
  if (!root) return new Set([slug])
  const slugs = new Set<string>()
  const collect = (id: string) => {
    const cat = allCategories.value.find(c => c.id === id)
    if (cat) slugs.add(cat.slug)
    allCategories.value.filter(c => c.parentId === id).forEach(child => collect(child.id))
  }
  collect(root.id)
  return slugs
}

const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const searchQuery = computed(() => (route.query.q as string) || '')
const activeCategory = computed(() => (route.query.category as string) || '')

const filtered = computed(() => {
  if (!activeCategory.value) return allProducts.value
  const slugs = descendantSlugs(activeCategory.value)
  return allProducts.value.filter(p => p.category?.slug && slugs.has(p.category.slug))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / LIMIT)))
const pageProducts = computed(() => {
  const start = (page.value - 1) * LIMIT
  return filtered.value.slice(start, start + LIMIT)
})

async function fetchProducts() {
  loading.value = true
  error.value = ''
  try {
    allProducts.value = await getProducts({ limit: 100, query: searchQuery.value })
  } catch {
    error.value = 'Failed to load products. Please try again.'
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const BASE = (import.meta.env.VITE_API_URL as string) || '/api'
    const res = await safeFetch(`${BASE}/categories`)
    const json = await res.json()
    allCategories.value = flattenTree(json.data ?? json)
  } catch {}
}

watch(() => route.query.q, fetchProducts, { immediate: true })
fetchCategories()

function goPage(p: number) {
  router.push({ query: { ...route.query, page: p > 1 ? String(p) : undefined } })
}
</script>

<template>
  <Navbar />

  <main class="page-main">
    <!-- Banner -->
    <div class="banner">
      <div class="banner-content">
        <p class="banner-label">New arrivals</p>
        <h2 class="banner-title">Shop the Latest Collection</h2>
        <p class="banner-sub">Women · Men · Outerwear · Knitwear · Bags</p>
      </div>
    </div>

    <!-- Products -->
    <section class="products-section">
      <div class="products-header">
        <h2 class="section-title">
          <template v-if="activeCategory">{{ activeCategory.charAt(0) + activeCategory.slice(1).toLowerCase() }}</template>
          <template v-else-if="searchQuery">Results for "{{ searchQuery }}"</template>
          <template v-else>All Products</template>
        </h2>
        <span v-if="!loading" class="products-count">{{ filtered.length }} item{{ filtered.length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="products-state">
        <div class="spinner" />
        <p>Loading products…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="products-state">
        <p class="state-error">{{ error }}</p>
        <button class="btn-outline" @click="fetchProducts">Retry</button>
      </div>

      <!-- Empty -->
      <div v-else-if="pageProducts.length === 0" class="products-state">
        <p>No products found.</p>
      </div>

      <!-- Grid -->
      <div v-else class="products-grid">
        <ProductCard v-for="product in pageProducts" :key="product.id" :product="product" />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="goPage(page - 1)">‹</button>
        <button
          v-for="p in totalPages"
          :key="p"
          class="page-btn"
          :class="{ active: p === page }"
          @click="goPage(p)"
        >{{ p }}</button>
        <button class="page-btn" :disabled="page === totalPages" @click="goPage(page + 1)">›</button>
      </div>
    </section>
  </main>

  <AppFooter />
</template>
