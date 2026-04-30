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

<style scoped>
.confirm-container { max-width: 560px; margin: 0 auto; padding: 80px 24px; text-align: center; }
.confirm-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(47,110,79,.12); color: var(--ok); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
.confirm-title { font-family: var(--serif); font-size: 26px; font-weight: 400; color: var(--ink); margin: 0 0 8px; }
.confirm-sub { color: var(--ink-2); margin: 0 0 32px; }
.confirm-card { border: 1px solid var(--line); border-radius: 14px; padding: 24px; text-align: left; margin-bottom: 32px; background: var(--surface); }
.confirm-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--ink-2); margin-bottom: 8px; }
.confirm-row:last-child { margin-bottom: 0; }
.confirm-row strong { color: var(--ink); }
.confirm-status { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 999px; font-size: 13px; font-weight: 600; background: rgba(47,110,79,.12); color: var(--ok); }
</style>
