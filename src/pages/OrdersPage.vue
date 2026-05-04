<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getMyOrders, type Order } from '../services/orders'
import { getSkuById, type SkuInfo } from '../services/products'

const router = useRouter()
const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref('')
const skuMap = ref<Map<string, SkuInfo>>(new Map())

const displayOrders = computed(() =>
  orders.value.filter(o => o.status !== 'CART').sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
)

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function orderTotal(order: Order) {
  return order.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
}

function formatDeliveryAddress(addr: Record<string, any> | null) {
  if (!addr) return null
  return [addr.street, addr.district, addr.subdistrict, addr.city, addr.province, addr.postalCode]
    .filter(Boolean).join(', ')
}

type BadgeStyle = { label: string; cls: string }

function paymentBadge(order: Order): BadgeStyle {
  if (order.paymentStatus === 'PAID') return { label: 'Paid', cls: 'badge--paid' }
  if (order.paymentStatus === 'AWAITING') return { label: 'Awaiting Payment', cls: 'badge--awaiting' }
  if (order.paymentStatus === 'FAILED') return { label: 'Payment Failed', cls: 'badge--failed' }
  if (order.paymentStatus === 'EXPIRED') return { label: 'Expired', cls: 'badge--failed' }
  return { label: order.status, cls: 'badge--neutral' }
}

onMounted(async () => {
  loading.value = true
  try {
    orders.value = await getMyOrders()
    const ids = [...new Set(orders.value.flatMap(o => o.items.map(i => i.skuId)))]
    const results = await Promise.allSettled(ids.map(id => getSkuById(id)))
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') skuMap.value.set(ids[idx], r.value)
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load orders.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="orders-wrap">
      <h1 class="orders-title">My Orders</h1>

      <div v-if="loading" class="orders-state">
        <div class="spinner" /><p>Loading orders…</p>
      </div>

      <div v-else-if="error" class="orders-state">
        <p style="color:var(--warn);">{{ error }}</p>
      </div>

      <div v-else-if="!displayOrders.length" class="orders-state">
        <p>No orders yet.</p>
        <button class="btn-primary" style="margin-top:16px;" @click="router.push('/')">Start Shopping</button>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in displayOrders" :key="order.id" class="order-card">

          <!-- Header -->
          <div class="order-header">
            <div class="order-header-left">
              <p class="order-id">{{ order.id.slice(0, 8).toUpperCase() }}…</p>
              <p class="order-date">{{ formatDate(order.createdAt) }}</p>
            </div>
            <span class="order-badge" :class="paymentBadge(order).cls">
              {{ paymentBadge(order).label }}
            </span>
          </div>

          <!-- Items -->
          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <div class="order-item-img-wrap">
                <img
                  v-if="skuMap.get(item.skuId)?.product?.images?.find(i => i.colorId === skuMap.get(item.skuId)!.colorId)?.imageUrl"
                  :src="skuMap.get(item.skuId)!.product!.images!.find(i => i.colorId === skuMap.get(item.skuId)!.colorId)!.imageUrl"
                  :alt="skuMap.get(item.skuId)?.product?.name"
                  class="order-item-img"
                />
                <div
                  v-else
                  class="order-item-img"
                  :style="{ background: skuMap.get(item.skuId)?.color?.hex ?? 'var(--line)', borderRadius: '6px' }"
                />
              </div>
              <div class="order-item-info">
                <p class="order-item-name">{{ skuMap.get(item.skuId)?.product?.name ?? item.skuId.slice(0, 8) + '…' }}</p>
                <p class="order-item-meta">
                  <span v-if="skuMap.get(item.skuId)?.skuCode">{{ skuMap.get(item.skuId)?.skuCode }}</span>
                  <span v-if="skuMap.get(item.skuId)?.size"> · {{ skuMap.get(item.skuId)?.size?.name }}</span>
                </p>
              </div>
              <div class="order-item-right">
                <span class="order-item-qty">× {{ item.quantity }}</span>
                <span class="order-item-price">{{ formatPrice(Number(item.price) * item.quantity) }}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="order-footer">
            <div class="order-footer-left">
              <p v-if="formatDeliveryAddress(order.deliveryAddress)" class="order-addr">
                {{ formatDeliveryAddress(order.deliveryAddress) }}
              </p>
            </div>
            <div class="order-footer-right">
              <span class="order-total-label">Total</span>
              <span class="order-total">{{ formatPrice(orderTotal(order)) }}</span>
              <button
                v-if="order.paymentStatus === 'AWAITING'"
                class="btn-primary order-pay-btn"
                @click="router.push(`/payment/${order.id}`)"
              >
                Pay now
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </main>

  <AppFooter />
</template>

<style scoped>
.orders-wrap { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
.orders-title { font-family: var(--serif); font-size: 26px; font-weight: 400; color: var(--ink); margin: 0 0 28px; }
.orders-state { padding: 80px 24px; text-align: center; color: var(--ink-3); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.orders-list { display: flex; flex-direction: column; gap: 14px; }

.order-card { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--surface); }

/* Header */
.order-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px 18px; background: var(--line-2); border-bottom: 1px solid var(--line); }
.order-header-left { min-width: 0; }
.order-id { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--ink); margin: 0 0 2px; }
.order-date { font-size: 12px; color: var(--ink-3); margin: 0; }

/* Badge */
.order-badge { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
.badge--paid    { background: rgba(47,110,79,.1); color: var(--ok); }
.badge--awaiting { background: var(--gold-bg); color: var(--gold); border: 1px solid var(--gold-border); }
.badge--failed  { background: rgba(180,61,61,.08); color: var(--warn); }
.badge--neutral { background: var(--line-2); color: var(--ink-3); border: 1px solid var(--line); }

/* Items */
.order-items { padding: 12px 18px; display: flex; flex-direction: column; gap: 10px; }
.order-item { display: flex; align-items: center; gap: 12px; }
.order-item-img { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid var(--line); display: block; flex-shrink: 0; }
.order-item-info { flex: 1; min-width: 0; }
.order-item-name { font-size: 14px; font-weight: 500; color: var(--ink); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.order-item-meta { font-size: 12px; color: var(--ink-3); margin: 0; }
.order-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.order-item-qty { font-size: 12px; color: var(--ink-3); }
.order-item-price { font-size: 14px; font-weight: 600; color: var(--ink); }

/* Footer */
.order-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px; border-top: 1px solid var(--line); flex-wrap: wrap; }
.order-footer-left { flex: 1; min-width: 0; }
.order-addr { font-size: 12px; color: var(--ink-3); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.order-footer-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.order-total-label { font-size: 12px; color: var(--ink-3); }
.order-total { font-size: 15px; font-weight: 700; color: var(--ink); }
.order-pay-btn { padding: 7px 18px; font-size: 13px; }
</style>
