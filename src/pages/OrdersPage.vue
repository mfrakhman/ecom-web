<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

function orderTotal(order: Order) {
  return order.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
}

onMounted(async () => {
  loading.value = true
  try {
    orders.value = await getMyOrders()

    const uniqueSkuIds = [...new Set(orders.value.flatMap(o => o.items.map(i => i.skuId)))]
    const results = await Promise.allSettled(uniqueSkuIds.map(id => getSkuById(id)))
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') skuMap.value.set(uniqueSkuIds[idx], r.value)
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
    <div class="orders-container">
      <h1 class="orders-title">My Orders</h1>

      <div v-if="loading" class="products-state">Loading…</div>
      <div v-else-if="error" class="products-state" style="color:var(--accent);">{{ error }}</div>

      <div v-else-if="orders.length === 0" class="products-state">
        <p style="color: var(--text);">You haven't placed any orders yet.</p>
        <button class="btn-primary" style="margin-top:16px;" @click="router.push('/')">Start Shopping</button>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-card-header">
            <div>
              <p class="order-id">Order <code>{{ order.id.slice(0, 8) }}…</code></p>
              <p class="order-date">{{ new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
            </div>
            <span class="order-status" :data-status="order.status">{{ order.status }}</span>
          </div>

          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item-row">
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
                  :style="{ background: skuMap.get(item.skuId)?.color?.hex ?? 'var(--border)', borderRadius: '6px' }"
                />
              </div>
              <div class="order-item-detail">
                <span class="order-item-name">{{ skuMap.get(item.skuId)?.product?.name ?? item.skuId.slice(0, 8) + '…' }}</span>
                <span class="order-item-meta">
                  <template v-if="skuMap.get(item.skuId)?.skuCode">{{ skuMap.get(item.skuId)?.skuCode }}</template>
                  <template v-if="skuMap.get(item.skuId)?.size"> · {{ skuMap.get(item.skuId)?.size?.name }}</template>
                </span>
              </div>
              <span class="order-item-qty">× {{ item.quantity }}</span>
              <span class="order-item-sub">{{ formatPrice(Number(item.price) * item.quantity) }}</span>
            </div>
          </div>

          <div class="order-card-footer">
            <span>Total</span>
            <strong>{{ formatPrice(orderTotal(order)) }}</strong>
          </div>
        </div>
      </div>
    </div>
  </main>

  <AppFooter />
</template>

<style scoped>
.orders-container { max-width: 760px; margin: 0 auto; padding: 48px 24px; }
.orders-title { font-family: var(--serif); font-size: 26px; font-weight: 400; color: var(--ink); margin: 0 0 32px; }
.orders-list { display: flex; flex-direction: column; gap: 16px; }
.products-state { padding: 80px 24px; text-align: center; color: var(--ink-3); display: flex; flex-direction: column; align-items: center; gap: 16px; }
.order-card { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--surface); }
.order-card-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--line); background: var(--line-2); }
.order-id { font-size: 14px; font-weight: 600; color: var(--ink); margin: 0 0 2px; }
.order-date { font-size: 13px; color: var(--ink-3); margin: 0; }
.order-items { padding: 12px 20px; display: flex; flex-direction: column; gap: 8px; }
.order-item-row { display: flex; align-items: center; gap: 16px; font-size: 14px; color: var(--ink-2); }
.order-item-img { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid var(--line); display: block; flex-shrink: 0; }
.order-item-detail { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.order-item-name { font-weight: 500; color: var(--ink); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.order-item-meta { font-size: 12px; color: var(--ink-3); }
.order-item-qty { font-size: 14px; color: var(--ink-2); white-space: nowrap; }
.order-item-sub { margin-left: auto; font-weight: 600; color: var(--ink); }
.order-card-footer { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-top: 1px solid var(--line); font-size: 15px; font-weight: 600; color: var(--ink); }
.order-status { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.order-status[data-status="PENDING"]   { background: rgba(184,153,104,.15); color: #9a7d44; }
.order-status[data-status="COMPLETED"] { background: rgba(47,110,79,.12);   color: var(--ok); }
.order-status[data-status="FAILED"]    { background: rgba(180,61,61,.12);   color: var(--warn); }
</style>
