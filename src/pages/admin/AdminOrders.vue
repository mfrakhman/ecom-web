<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { getAllOrders, type Order } from '../../services/orders'

const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref('')

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
    orders.value = await getAllOrders()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load orders.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Orders</h1>
      </div>

      <div v-if="loading" class="admin-state">Loading…</div>
      <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>

      <div v-else-if="orders.length === 0" class="admin-state">No orders yet.</div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User ID</th>
              <th>Status</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td><code style="font-size:12px;">{{ order.id.slice(0, 8) }}…</code></td>
              <td><code style="font-size:12px;">{{ order.userId?.slice(0, 8) }}…</code></td>
              <td>
                <span class="order-status" :data-status="order.status">{{ order.status }}</span>
              </td>
              <td>{{ order.items.length }}</td>
              <td>{{ formatPrice(orderTotal(order)) }}</td>
              <td style="white-space:nowrap;">{{ new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>
