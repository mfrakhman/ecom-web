<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getProductDetail, type ProductDetail, type SkuInfo } from '../services/products'
import { useCart } from '../composables/useCart'
import { getToken } from '../services/auth'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const product = ref<ProductDetail | null>(null)
const skus = ref<SkuInfo[]>([])
const loading = ref(true)
const error = ref('')
const selectedSku = ref<SkuInfo | null>(null)

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

const activeSkus = computed(() => skus.value.filter(s => s.isActive))
const inStock = computed(() => (selectedSku.value?.stock?.amount ?? 0) > 0)

const displayImageUrl = computed(() => {
  if (!product.value) return null
  if (selectedSku.value) {
    const img = product.value.images?.find(i => i.colorId === selectedSku.value!.colorId)
    if (img) return img.imageUrl
  }
  return product.value.images?.[0]?.imageUrl ?? null
})

const { addItem } = useCart()
const addedToCart = ref(false)
const adding = ref(false)
const addError = ref('')

async function handleAddToCart() {
  if (!selectedSku.value || !product.value) return
  if (!getToken()) { router.push('/login'); return }
  adding.value = true
  addError.value = ''
  try {
    await addItem(selectedSku.value.id, 1)
    addedToCart.value = true
    setTimeout(() => { addedToCart.value = false }, 1500)
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Failed to add to cart.'
  } finally {
    adding.value = false
  }
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
            :style="displayImageUrl ? {} : { background: 'var(--border)' }"
          >
            <img
              v-if="displayImageUrl"
              :src="displayImageUrl"
              :alt="product.name"
              class="pd-image-photo"
            />
            <span v-else class="pd-image-label">
              {{ product.category?.name ?? '—' }}
            </span>
          </div>

          <!-- Right: info -->
          <div class="pd-info">
            <span class="badge">{{ product.category?.name ?? '—' }}</span>
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
                    :style="{ background: sku.color?.hex ?? 'var(--border)' }"
                  />
                  <span class="pd-sku-thumb-size">{{ sku.size?.name ?? '—' }}</span>
                  <span class="pd-sku-thumb-code">{{ sku.skuCode }}</span>
                </button>
              </div>
            </div>

            <!-- Selected SKU details -->
            <template v-if="selectedSku">
              <div class="pd-sku-detail">
                <div class="pd-price">{{ formatPrice(Number(selectedSku.price)) }}</div>
                <div v-if="selectedSku.compareAt" style="text-decoration:line-through;color:var(--text);font-size:14px;margin-top:2px;">
                  {{ formatPrice(Number(selectedSku.compareAt)) }}
                </div>

                <div class="pd-stock" :class="{ 'pd-stock--oos': !inStock }">
                  <span class="pd-stock-dot" :class="{ 'pd-stock-dot--oos': !inStock }" />
                  {{ inStock ? `${selectedSku.stock?.amount} in stock` : 'Out of stock' }}
                </div>
              </div>

              <p v-if="addError" class="auth-error" style="margin-top:8px;">{{ addError }}</p>
              <div style="display:flex; gap:8px; margin-top:8px;">
                <button class="btn-primary" :disabled="!inStock || adding" @click="handleAddToCart">
                  {{ adding ? 'Adding…' : addedToCart ? '✓ Added!' : inStock ? 'Add to Cart' : 'Out of Stock' }}
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
