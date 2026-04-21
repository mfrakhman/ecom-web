<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { useCart } from '../composables/useCart'
import { getSkuById, type SkuInfo } from '../services/products'

const router = useRouter()
const { cart, loading, fetchCart, updateItem, removeItem, doCheckout } = useCart()

const skuMap = ref<Map<string, SkuInfo>>(new Map())
const skuLoading = ref(false)
const placing = ref(false)
const error = ref('')

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

async function loadSkuDetails() {
  if (!cart.value?.items.length) return
  skuLoading.value = true
  const results = await Promise.allSettled(
    cart.value.items.map(item => getSkuById(item.skuId))
  )
  const map = new Map<string, SkuInfo>()
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      map.set(cart.value!.items[i].skuId, result.value.data)
    }
  })
  skuMap.value = map
  skuLoading.value = false
}

const displayItems = computed(() =>
  (cart.value?.items ?? []).map(item => ({
    ...item,
    sku: skuMap.value.get(item.skuId),
  }))
)

const total = computed(() =>
  displayItems.value.reduce((sum, item) => {
    const price = Number(item.sku?.price ?? 0)
    return sum + price * item.quantity
  }, 0)
)

async function changeQty(skuId: string, qty: number) {
  if (qty < 1) return
  await updateItem(skuId, qty)
  await loadSkuDetails()
}

async function handleRemove(skuId: string) {
  await removeItem(skuId)
  await loadSkuDetails()
}

async function placeOrder() {
  if (!cart.value?.items.length) return
  error.value = ''
  placing.value = true
  try {
    const order = await doCheckout()
    router.push({ path: '/orders/confirmation', query: { id: order.id, status: order.status } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to place order.'
  } finally {
    placing.value = false
  }
}

onMounted(async () => {
  await fetchCart()
  await loadSkuDetails()
})
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="cart-container">
      <h1 class="cart-title">Your Cart</h1>

      <div v-if="loading || skuLoading" class="products-state">
        <div class="spinner" />
        <p>Loading cart…</p>
      </div>

      <div v-else-if="!cart?.items.length" class="products-state">
        <p style="color: var(--text);">Your cart is empty.</p>
        <button class="btn-primary" style="margin-top:16px;" @click="router.push('/')">Continue Shopping</button>
      </div>

      <div v-else class="cart-layout">
        <!-- Items -->
        <div class="cart-items">
          <div v-for="item in displayItems" :key="item.skuId" class="cart-item">
            <div v-if="item.sku?.imageUrl" class="cart-item-img-wrap">
              <img :src="item.sku.imageUrl" :alt="item.sku?.name" class="cart-item-img" />
            </div>
            <div class="cart-item-info">
              <p class="cart-item-product">{{ item.sku?.name ?? item.skuId }}</p>
              <p class="cart-item-sku">
                <span v-if="item.sku?.color" class="cart-item-meta">{{ item.sku.color }}</span>
                <span v-if="item.sku?.size" class="cart-item-meta">· {{ item.sku.size }}</span>
              </p>
              <p class="cart-item-price">{{ item.sku ? formatPrice(Number(item.sku.price)) : '—' }}</p>
            </div>

            <div class="cart-item-actions">
              <div class="qty-control">
                <button class="qty-btn" @click="changeQty(item.skuId, item.quantity - 1)">−</button>
                <span class="qty-value">{{ item.quantity }}</span>
                <button class="qty-btn" @click="changeQty(item.skuId, item.quantity + 1)">+</button>
              </div>
              <p class="cart-item-subtotal">
                {{ item.sku ? formatPrice(Number(item.sku.price) * item.quantity) : '—' }}
              </p>
              <button class="btn-ghost cart-remove-btn" @click="handleRemove(item.skuId)">Remove</button>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="cart-summary">
          <h2 class="cart-summary-title">Order Summary</h2>

          <div class="cart-summary-row" v-for="item in displayItems" :key="item.skuId">
            <span>{{ item.sku?.name ?? item.skuId }} × {{ item.quantity }}</span>
            <span>{{ item.sku ? formatPrice(Number(item.sku.price) * item.quantity) : '—' }}</span>
          </div>

          <div class="cart-summary-divider" />

          <div class="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>{{ formatPrice(total) }}</span>
          </div>

          <p v-if="error" class="auth-error" style="margin-top:12px;">{{ error }}</p>

          <button class="btn-primary" style="width:100%; margin-top:16px;" :disabled="placing" @click="placeOrder">
            {{ placing ? 'Placing Order…' : 'Place Order' }}
          </button>
          <button class="btn-ghost" style="width:100%; margin-top:8px;" @click="router.push('/')">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  </main>

  <AppFooter />
</template>
