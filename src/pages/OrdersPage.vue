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
