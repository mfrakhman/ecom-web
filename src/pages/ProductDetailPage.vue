<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getProductDetail, type ProductDetail, type SkuInfo } from '../services/products'
import { addToCart } from '../services/cart'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const product = ref<ProductDetail | null>(null)
const skus = ref<SkuInfo[]>([])
const loading = ref(true)
const error = ref('')
const selectedSku = ref<SkuInfo | null>(null)

const categoryGradient: Record<string, string> = {
  BAGS:    'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  SHOES:   'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
  CLOTHES: 'linear-gradient(135deg, #aa3bff 0%, #ec4899 100%)',
  PANTS:   'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
}

const COLORS: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', black: '#1f2937',
  white: '#e5e7eb', yellow: '#eab308', purple: '#a855f7', pink: '#ec4899',
  orange: '#f97316', gray: '#9ca3af', grey: '#9ca3af', brown: '#a16207',
  navy: '#1e3a8a', beige: '#d4a574', teal: '#0d9488', maroon: '#9f1239',
  gold: '#d97706', silver: '#94a3b8', cream: '#fef3c7', olive: '#65a30d',
}

function colorToCSS(c: string | null) {
  if (!c) return 'var(--border)'
  return COLORS[c.toLowerCase().trim()] ?? c.toLowerCase()
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

const activeSkus = computed(() => skus.value.filter(s => s.isActive))

const inStock = computed(() => (selectedSku.value?.stock?.amount ?? 0) > 0)

const addedToCart = ref(false)

function handleAddToCart() {
  if (!selectedSku.value || !product.value) return
  addToCart({
    skuId: selectedSku.value.id,
    skuCode: selectedSku.value.skuCode,
    productId: product.value.id,
    productName: product.value.name,
    skuName: selectedSku.value.name,
    color: selectedSku.value.color,
    size: selectedSku.value.size,
    price: Number(selectedSku.value.price),
  })
  addedToCart.value = true
  setTimeout(() => { addedToCart.value = false }, 1500)
}

onMounted(async () => {
  try {
    const prod = await getProductDetail(id)
    product.value = prod
    skus.value = prod.skus ?? []
    if (activeSkus.value.length > 0) selectedSku.value = activeSkus.value[0]
  } catch {
    error.value = 'Failed to load product.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="pd-container">

      <div v-if="loading" class="products-state">
        <div class="spinner" />
        <p>Loading product…</p>
      </div>

      <div v-else-if="error" class="products-state">
        <p class="state-error">{{ error }}</p>
      </div>

      <template v-else-if="product">
        <div class="pd-layout">

          <!-- Left: image -->
          <div
            class="pd-image"
            :style="{ background: categoryGradient[product.category] ?? 'var(--border)' }"
          >
            <span class="pd-image-label">
              {{ product.category.charAt(0) + product.category.slice(1).toLowerCase() }}
            </span>
          </div>

          <!-- Right: info -->
          <div class="pd-info">
            <span class="badge" :data-cat="product.category">
              {{ product.category.charAt(0) + product.category.slice(1).toLowerCase() }}
            </span>
            <h1 class="pd-name">{{ product.name }}</h1>
            <p class="pd-desc">{{ product.description ?? 'No description available.' }}</p>

            <!-- SKU thumbnails -->
            <div v-if="activeSkus.length > 0">
              <p class="pd-section-label">Select Variant</p>
              <div class="pd-sku-list">
                <button
                  v-for="sku in activeSkus"
                  :key="sku.id"
                  class="pd-sku-thumb"
                  :class="{ selected: selectedSku?.id === sku.id, oos: (sku.stock?.amount ?? 0) === 0 }"
                  @click="selectedSku = sku"
                >
                  <div
                    class="pd-sku-thumb-color"
                    :style="{ background: colorToCSS(sku.color) }"
                  />
                  <span class="pd-sku-thumb-size">{{ sku.size ?? '—' }}</span>
                  <span class="pd-sku-thumb-code">{{ sku.skuCode }}</span>
                </button>
              </div>
            </div>

            <!-- Selected SKU details -->
            <template v-if="selectedSku">
              <div class="pd-sku-detail">
                <div class="pd-price">{{ formatPrice(Number(selectedSku.price)) }}</div>

                <div class="pd-stock" :class="{ 'pd-stock--oos': !inStock }">
                  <span class="pd-stock-dot" :class="{ 'pd-stock-dot--oos': !inStock }" />
                  {{ inStock ? `${selectedSku.stock?.amount} in stock` : 'Out of stock' }}
                </div>

                <p v-if="selectedSku.description" class="pd-sku-desc">
                  {{ selectedSku.description }}
                </p>
              </div>

              <div style="display:flex; gap:8px; margin-top:8px;">
                <button class="btn-primary" :disabled="!inStock" @click="handleAddToCart">
                  {{ addedToCart ? '✓ Added!' : inStock ? 'Add to Cart' : 'Out of Stock' }}
                </button>
                <button v-if="inStock" class="btn-outline" @click="router.push('/cart')">View Cart</button>
              </div>
            </template>

            <p v-else class="pd-no-variants">No variants available for this product.</p>
          </div>

        </div>
      </template>

    </div>
  </main>

  <AppFooter />
</template>
