<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getOrderById, type Order } from '../services/orders'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id as string

const order = ref<Order | null>(null)
const qrDataUrl = ref('')
const loading = ref(true)
const error = ref('')
const secondsLeft = ref(0)

let pollTimer: ReturnType<typeof setTimeout> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

const total = computed(() =>
  (order.value?.items ?? []).reduce((s, i) => s + Number(i.price) * i.quantity, 0),
)

const countdown = computed(() => {
  const m = Math.floor(secondsLeft.value / 60).toString().padStart(2, '0')
  const s = (secondsLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const isTerminal = computed(() =>
  order.value?.paymentStatus === 'PAID' ||
  order.value?.paymentStatus === 'EXPIRED' ||
  order.value?.paymentStatus === 'FAILED',
)

async function fetchOrder() {
  try {
    order.value = await getOrderById(orderId)

    if (order.value.qrString && !qrDataUrl.value) {
      qrDataUrl.value = await QRCode.toDataURL(order.value.qrString, { width: 280, margin: 2 })
    }

    if (order.value.qrExpiresAt) {
      const expiry = new Date(order.value.qrExpiresAt).getTime()
      secondsLeft.value = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
    }

    if (order.value.paymentStatus === 'PAID') {
      stopAll()
      router.replace({ path: '/orders/confirmation', query: { id: orderId, status: 'PAID' } })
      return
    }
  } catch {
    error.value = 'Failed to load payment info. Please refresh.'
  } finally {
    loading.value = false
  }

  if (!isTerminal.value) {
    pollTimer = setTimeout(fetchOrder, 4000)
  }
}

function stopAll() {
  if (pollTimer) clearTimeout(pollTimer)
  if (countdownInterval) clearInterval(countdownInterval)
}

onMounted(async () => {
  await fetchOrder()
  countdownInterval = setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value--
  }, 1000)
})

onUnmounted(stopAll)
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="payment-container">

      <div v-if="loading" class="products-state">
        <div class="spinner" />
        <p>Loading payment…</p>
      </div>

      <template v-else-if="order">

        <!-- EXPIRED / FAILED state -->
        <div v-if="order.paymentStatus === 'EXPIRED' || order.paymentStatus === 'FAILED'" class="payment-terminal">
          <div class="payment-terminal-icon payment-terminal-icon--fail">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 class="payment-terminal-title">
            {{ order.paymentStatus === 'EXPIRED' ? 'QR Expired' : 'Payment Failed' }}
          </h1>
          <p class="payment-terminal-sub">
            {{ order.paymentStatus === 'EXPIRED'
              ? 'The payment window has closed. Please place a new order to try again.'
              : 'Your payment was not completed. Please place a new order to try again.' }}
          </p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px;">
            <button class="btn-primary" @click="router.push('/orders')">My Orders</button>
            <button class="btn-ghost" @click="router.push('/')">Continue Shopping</button>
          </div>
        </div>

        <!-- AWAITING state -->
        <div v-else class="payment-card">
          <h1 class="payment-title">Scan to Pay</h1>
          <p class="payment-amount">{{ formatPrice(total) }}</p>
          <p class="payment-order-id">Order <code>{{ orderId.slice(0, 8) }}…</code></p>

          <div class="payment-qr-wrap">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QRIS Payment QR Code" class="payment-qr" />
            <div v-else class="payment-qr-placeholder">
              <div class="spinner" />
              <p class="payment-qr-pending">Generating QR…</p>
            </div>
          </div>

          <div v-if="secondsLeft > 0" class="payment-countdown">
            QR valid for <span class="payment-countdown-time">{{ countdown }}</span>
          </div>
          <div v-else-if="order.qrExpiresAt" class="payment-countdown payment-countdown--expired">
            QR expired
          </div>

          <p class="payment-hint">
            Open your mobile banking or e-wallet app and scan the QR code above.
          </p>

          <div class="payment-polling-indicator">
            <span class="payment-dot" /> Waiting for payment confirmation…
          </div>
        </div>
      </template>

      <div v-else-if="error" class="products-state" style="color:var(--accent);">{{ error }}</div>

    </div>
  </main>

  <AppFooter />
</template>

<style scoped>
.payment-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

.payment-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
}

.payment-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--text-strong);
}

.payment-amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-strong);
  margin: 0 0 4px;
}

.payment-order-id {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0 0 24px;
}

.payment-qr-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 288px;
  margin-bottom: 16px;
}

.payment-qr {
  width: 280px;
  height: 280px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.payment-qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
}

.payment-qr-pending {
  font-size: 0.9rem;
  margin: 0;
}

.payment-countdown {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.payment-countdown-time {
  font-weight: 700;
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}

.payment-countdown--expired {
  color: var(--accent);
}

.payment-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 20px;
  line-height: 1.5;
}

.payment-polling-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 6px 14px;
}

.payment-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 1.6s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.payment-terminal {
  text-align: center;
  padding: 48px 16px;
}

.payment-terminal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.payment-terminal-icon--fail {
  background: #fee2e2;
  color: #dc2626;
}

.payment-terminal-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--text-strong);
}

.payment-terminal-sub {
  color: var(--text-muted);
  max-width: 320px;
  margin: 0 auto;
  line-height: 1.6;
}
</style>
