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

interface FlatCategory { id: string; parentId: string | null; slug: string; name: string }
const allCategories = ref<FlatCategory[]>([])

function flattenTree(nodes: any[]): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const node of nodes) {
    result.push({ id: node.id, parentId: node.parentId ?? null, slug: node.slug, name: node.name })
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
const isFiltered = computed(() => !!(searchQuery.value || activeCategory.value))
const topLevelCategories = computed(() => allCategories.value.filter(c => !c.parentId))

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

const activeCategoryName = computed(() => {
  if (!activeCategory.value) return ''
  return allCategories.value.find(c => c.slug === activeCategory.value)?.name ?? activeCategory.value
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

function selectCategory(slug: string) {
  router.push({ path: '/', query: slug ? { category: slug } : {} })
}
</script>

<template>
  <Navbar />

  <main class="page-main">

    <!-- Hero — only when not filtering/searching -->
    <section v-if="!isFiltered" class="hero">
      <div class="hero-inner">
        <p class="hero-eyebrow">New Season · 2026</p>
        <h1 class="hero-title">Dressed for<br><em>every moment.</em></h1>
        <p class="hero-sub">Curated essentials for men and women — quality that endures.</p>
        <div class="hero-actions">
          <button class="btn-primary" @click="selectCategory('men')">Shop Men</button>
          <button class="btn-outline" @click="selectCategory('women')">Shop Women</button>
        </div>
      </div>
    </section>

    <!-- Category tiles -->
    <section v-if="!isFiltered && topLevelCategories.length" class="cat-strip">
      <div class="cat-strip-inner">
        <button
          v-for="cat in topLevelCategories"
          :key="cat.id"
          class="cat-tile"
          @click="selectCategory(cat.slug)"
        >
          <span class="cat-tile-name">{{ cat.name }}</span>
          <span class="cat-tile-arrow">→</span>
        </button>
      </div>
    </section>

    <!-- Products -->
    <section class="products-section">
      <div class="products-header">
        <h2 class="section-title">
          <template v-if="activeCategoryName">{{ activeCategoryName }}</template>
          <template v-else-if="searchQuery">Results for "{{ searchQuery }}"</template>
          <template v-else>All Products</template>
        </h2>
        <span v-if="!loading" class="products-count">
          {{ filtered.length }} item{{ filtered.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="loading" class="products-state">
        <div class="spinner" />
        <p>Loading products…</p>
      </div>

      <div v-else-if="error" class="products-state">
        <p class="state-error">{{ error }}</p>
        <button class="btn-outline" @click="fetchProducts">Retry</button>
      </div>

      <div v-else-if="pageProducts.length === 0" class="products-state">
        <p>No products found.</p>
      </div>

      <div v-else class="products-grid">
        <ProductCard v-for="product in pageProducts" :key="product.id" :product="product" />
      </div>

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

<style scoped>
.hero { background: var(--line-2); border-bottom: 1px solid var(--line); padding: 96px 24px 80px; text-align: center; }
.hero-inner { max-width: 640px; margin: 0 auto; }
.hero-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin: 0 0 20px; }
.hero-title { font-family: var(--serif); font-size: clamp(40px,6vw,64px); font-weight: 300; color: var(--ink); line-height: 1.1; letter-spacing: -1px; margin: 0 0 20px; }
.hero-title em { font-style: italic; font-weight: 400; color: var(--gold); }
.hero-sub { font-size: 16px; color: var(--ink-3); margin: 0 0 36px; line-height: 1.6; }
.hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.cat-strip { border-bottom: 1px solid var(--line); background: var(--surface); }
.cat-strip-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; }
.cat-tile {
  flex: 1; display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border: none; background: none; cursor: pointer;
  font-family: var(--sans); border-right: 1px solid var(--line); transition: background .15s; gap: 12px;
}
.cat-tile:last-child { border-right: none; }
.cat-tile:hover { background: var(--line-2); }
.cat-tile-name { font-family: var(--serif); font-size: 17px; font-weight: 400; color: var(--ink); }
.cat-tile-arrow { font-size: 16px; color: var(--ink-3); transition: transform .15s, color .15s; }
.cat-tile:hover .cat-tile-arrow { transform: translateX(4px); color: var(--gold); }

.products-section { max-width: 1280px; margin: 0 auto; padding: 48px 24px 72px; }
.products-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; gap: 12px; }
.section-title { font-family: var(--serif); font-size: 26px; font-weight: 400; color: var(--ink); letter-spacing: -.3px; }
.products-count { font-size: 14px; color: var(--ink-3); white-space: nowrap; }
.products-state { padding: 80px 24px; text-align: center; color: var(--ink-3); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.state-error { color: var(--warn); }
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 24px; }
@media (max-width: 640px) { .products-grid { grid-template-columns: repeat(2,1fr); gap: 14px; } }
@media (max-width: 400px) { .products-grid { grid-template-columns: 1fr; } }

.pagination { display: flex; justify-content: center; align-items: center; gap: 4px; padding-top: 48px; }
.page-btn {
  width: 36px; height: 36px; border-radius: 999px; border: 1.5px solid transparent;
  background: none; color: var(--ink-2); font-size: 14px; font-family: var(--sans);
  font-weight: 500; cursor: pointer; transition: border-color .15s, background .15s, color .15s;
  display: flex; align-items: center; justify-content: center;
}
.page-btn:hover:not(:disabled) { background: var(--line-2); color: var(--ink); }
.page-btn.active { background: var(--ink); color: #FAF8F4; border-color: var(--ink); }
.page-btn:disabled { opacity: .3; cursor: not-allowed; }
</style>
