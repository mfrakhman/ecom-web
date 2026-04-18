<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getCart, updateQty, removeFromCart, clearCart, type CartItem } from '../services/cart'
import { createOrder } from '../services/orders'

const router = useRouter()
const items = ref<CartItem[]>(getCart())
const placing = ref(false)
const error = ref('')

function syncCart() { items.value = getCart() }
onMounted(() => window.addEventListener('cart-updated', syncCart))
onUnmounted(() => window.removeEventListener('cart-updated', syncCart))

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

const total = computed(() =>
  items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

function changeQty(skuId: string, qty: number) {
  if (qty < 1) return
  updateQty(skuId, qty)
}

async function placeOrder() {
  if (items.value.length === 0) return
  error.value = ''
  placing.value = true
  try {
    const order = await createOrder(
      items.value.map(i => ({ skuId: i.skuId, quantity: i.quantity }))
    )
    clearCart()
    router.push({ path: '/orders/confirmation', query: { id: order.id, status: order.status } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to place order.'
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="cart-container">
      <h1 class="cart-title">Your Cart</h1>

      <div v-if="items.length === 0" class="products-state">
        <p style="color: var(--text);">Your cart is empty.</p>
        <button class="btn-primary" style="margin-top:16px;" @click="router.push('/')">Continue Shopping</button>
      </div>

      <div v-else class="cart-layout">
        <!-- Items -->
        <div class="cart-items">
          <div v-for="item in items" :key="item.skuId" class="cart-item">
            <div class="cart-item-info">
              <p class="cart-item-product">{{ item.productName }}</p>
              <p class="cart-item-sku">{{ item.skuName }}
                <span v-if="item.color" class="cart-item-meta">· {{ item.color }}</span>
                <span v-if="item.size" class="cart-item-meta">· {{ item.size }}</span>
              </p>
              <p class="cart-item-price">{{ formatPrice(item.price) }}</p>
            </div>

            <div class="cart-item-actions">
              <div class="qty-control">
                <button class="qty-btn" @click="changeQty(item.skuId, item.quantity - 1)">−</button>
                <span class="qty-value">{{ item.quantity }}</span>
                <button class="qty-btn" @click="changeQty(item.skuId, item.quantity + 1)">+</button>
              </div>
              <p class="cart-item-subtotal">{{ formatPrice(item.price * item.quantity) }}</p>
              <button class="btn-ghost cart-remove-btn" @click="removeFromCart(item.skuId)">Remove</button>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="cart-summary">
          <h2 class="cart-summary-title">Order Summary</h2>

          <div class="cart-summary-row" v-for="item in items" :key="item.skuId">
            <span>{{ item.skuName }} × {{ item.quantity }}</span>
            <span>{{ formatPrice(item.price * item.quantity) }}</span>
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
