<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'

const route = useRoute()
const router = useRouter()

const orderId = route.query.id as string
const status = (route.query.status as string) ?? 'PENDING'
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="confirm-container">
      <div class="confirm-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
      </div>

      <h1 class="confirm-title">Order Placed!</h1>
      <p class="confirm-sub">Thank you for your order. We'll process it right away.</p>

      <div class="confirm-card">
        <div class="confirm-row">
          <span>Order ID</span>
          <strong>{{ orderId }}</strong>
        </div>
        <div class="confirm-row">
          <span>Status</span>
          <span class="confirm-status">{{ status }}</span>
        </div>
      </div>

      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <button class="btn-primary" @click="router.push('/')">Continue Shopping</button>
      </div>
    </div>
  </main>

  <AppFooter />
</template>
