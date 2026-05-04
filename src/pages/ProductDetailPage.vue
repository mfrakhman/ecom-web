<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getProductDetail, type ProductDetail, type SkuInfo } from '../services/products'
import { useCart } from '../composables/useCart'
import { useWishlist } from '../composables/useWishlist'
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

const activeImageIndex = ref(0)

const colorImages = computed(() => {
  if (!product.value?.images) return []
  const colorId = selectedSku.value?.colorId
  const filtered = colorId
    ? product.value.images.filter(i => i.colorId === colorId)
    : product.value.images
  return filtered.length ? filtered : product.value.images
})

const displayImageUrl = computed(() => colorImages.value[activeImageIndex.value]?.imageUrl ?? null)

watch(() => selectedSku.value?.colorId, () => { activeImageIndex.value = 0 })

const { addItem } = useCart()
const { isWishlisted, toggle: toggleWishlist, load: loadWishlist } = useWishlist()
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
  loadWishlist()
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

          <!-- Left: gallery -->
          <div class="pd-gallery">
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

            <div v-if="colorImages.length > 1" class="pd-thumbs">
              <button
                v-for="(img, idx) in colorImages"
                :key="img.id"
                class="pd-thumb"
                :class="{ 'pd-thumb--active': activeImageIndex === idx }"
                @click="activeImageIndex = idx"
              >
                <img :src="img.imageUrl" :alt="`${product.name} ${idx + 1}`" />
              </button>
            </div>
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
              <div style="display:flex; gap:8px; margin-top:8px; align-items:center;">
                <button class="btn-primary" :disabled="!inStock || adding" @click="handleAddToCart">
                  {{ adding ? 'Adding…' : addedToCart ? '✓ Added!' : inStock ? 'Add to Cart' : 'Out of Stock' }}
                </button>
                <button v-if="inStock" class="btn-outline" @click="router.push('/cart')">View Cart</button>
                <button
                  v-if="getToken()"
                  class="pd-heart"
                  :class="{ 'pd-heart--active': isWishlisted(selectedSku.id) }"
                  @click="toggleWishlist(selectedSku.id)"
                  :aria-label="isWishlisted(selectedSku.id) ? 'Remove from wishlist' : 'Save to wishlist'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
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

<style scoped>
.pd-container { max-width: 1100px; margin: 0 auto; padding: 40px 24px 60px; }
.pd-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
@media (max-width: 768px) { .pd-layout { grid-template-columns: 1fr; gap: 28px; } }
.pd-gallery { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 12px; }
.pd-image { border-radius: 20px; aspect-ratio: 4/3; background: var(--line-2); display: flex; align-items: flex-end; padding: 20px; overflow: hidden; }
.pd-image-photo { width: 100%; height: 100%; object-fit: cover; border-radius: 20px; }
.pd-thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
.pd-thumb { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; border: 2px solid transparent; padding: 0; cursor: pointer; background: var(--line); transition: border-color .15s; flex-shrink: 0; }
.pd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-thumb--active { border-color: var(--gold); }
.pd-image-label { background: rgba(250,248,244,.85); backdrop-filter: blur(6px); color: var(--ink-2); font-size: 13px; font-weight: 600; letter-spacing: .5px; padding: 4px 14px; border-radius: 20px; }
.pd-info { display: flex; flex-direction: column; gap: 16px; }
.pd-name { font-family: var(--serif); font-size: 30px; font-weight: 400; color: var(--ink); margin: 0; letter-spacing: -.5px; line-height: 1.2; }
.pd-desc { font-size: 15px; color: var(--ink-2); margin: 0; line-height: 1.7; }
.pd-section-label { font-size: 12px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; color: var(--ink-3); margin: 0 0 10px; }
.pd-sku-list { display: flex; gap: 10px; flex-wrap: wrap; }
.pd-sku-thumb { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px; border: 1.5px solid var(--line); border-radius: 12px; background: var(--surface); cursor: pointer; transition: border-color .15s, box-shadow .15s; min-width: 72px; font-family: var(--sans); }
.pd-sku-thumb:hover { border-color: var(--gold); }
.pd-sku-thumb.selected { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-bg); }
.pd-sku-thumb.oos { opacity: .45; cursor: not-allowed; }
.pd-sku-thumb-color { width: 36px; height: 36px; border-radius: 8px; box-shadow: 0 0 0 1px rgba(22,20,15,.10); }
.pd-sku-thumb-size { font-size: 13px; font-weight: 600; color: var(--ink); }
.pd-sku-thumb-code { font-size: 10px; color: var(--ink-3); font-family: var(--mono); }
.pd-sku-detail { display: flex; flex-direction: column; gap: 10px; padding: 18px; background: var(--line-2); border: 1px solid var(--line); border-radius: 14px; }
.pd-price { font-family: var(--serif); font-size: 28px; font-weight: 400; color: var(--ink); letter-spacing: -.5px; }
.pd-stock { display: flex; align-items: center; gap: 7px; font-size: 14px; color: var(--ok); font-weight: 500; }
.pd-stock--oos { color: var(--warn); }
.pd-stock-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); flex-shrink: 0; }
.pd-stock-dot--oos { background: var(--warn); }
.pd-no-variants { font-size: 14px; color: var(--ink-3); margin: 0; }
.pd-heart {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: var(--line-2); border: 1.5px solid var(--line);
  cursor: pointer; padding: 10px; display: flex; align-items: center; justify-content: center;
  color: var(--ink-3); transition: color .15s, border-color .15s, transform .15s;
}
.pd-heart:hover { color: #c0415a; border-color: #c0415a; transform: scale(1.08); }
.pd-heart--active { color: #c0415a; border-color: #c0415a; }
.pd-heart--active svg { fill: #c0415a; stroke: #c0415a; }
.pd-heart svg { width: 100%; height: 100%; }
.products-state { padding: 80px 24px; text-align: center; color: var(--ink-3); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.state-error { color: var(--warn); }
</style>
