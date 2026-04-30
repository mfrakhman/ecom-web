<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getOrderById, type Order } from '../services/orders'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id as string

const order = ref<Order | null>(null)
const qrDataUrl = ref<string | null>(null)
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

    if (order.value.qrImageUrl) {
      qrDataUrl.value = order.value.qrImageUrl
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

  <main class="page-main pay-page">

    <div v-if="loading" class="pay-loading">
      <div class="spinner" />
      <p>Loading payment…</p>
    </div>

    <template v-else-if="order">

      <!-- Terminal: EXPIRED / FAILED -->
      <div v-if="order.paymentStatus === 'EXPIRED' || order.paymentStatus === 'FAILED'" class="pay-terminal">
        <div class="pay-terminal-icon pay-terminal-icon--fail">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 class="pay-terminal-title">
          {{ order.paymentStatus === 'EXPIRED' ? 'QR Expired' : 'Payment Failed' }}
        </h1>
        <p class="pay-terminal-sub">
          {{ order.paymentStatus === 'EXPIRED'
            ? 'The payment window has closed. Please place a new order to try again.'
            : 'Your payment was not completed. Please place a new order to try again.' }}
        </p>
        <div class="pay-terminal-actions">
          <button class="btn-primary" @click="router.push('/orders')">My Orders</button>
          <button class="btn-outline" @click="router.push('/')">Continue Shopping</button>
        </div>
      </div>

      <!-- Awaiting payment -->
      <div v-else class="pay-card">
        <h1 class="pay-title">Scan to Pay</h1>
        <p class="pay-amount">{{ formatPrice(total) }}</p>
        <div class="pay-order-row">
          Order <code class="pay-order-code">{{ orderId.slice(0, 8) }}…</code>
        </div>

        <!-- QR code -->
        <div class="pay-qr-wrap">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QRIS Payment QR Code" class="pay-qr-img" />
          <div v-else class="pay-qr-placeholder">
            <div class="spinner" />
            <p>Generating QR…</p>
          </div>
          <!-- Brand overlay -->
          <div v-if="qrDataUrl" class="pay-qr-logo">R</div>
        </div>

        <!-- Countdown -->
        <p v-if="secondsLeft > 0" class="pay-timer">
          QR valid for <b>{{ countdown }}</b>
        </p>
        <p v-else-if="order.qrExpiresAt" class="pay-timer pay-timer--expired">
          QR expired
        </p>

        <p class="pay-instr">
          Open your mobile banking or e-wallet app and scan the QR code above.
        </p>

        <!-- Pulse status indicator -->
        <div class="pay-status">
          <span class="pay-pulse" />
          Waiting for payment confirmation…
        </div>

        <!-- Accepted payment methods -->
        <div class="pay-methods">
          <span>QRIS</span>
          <span>GOPAY</span>
          <span>OVO</span>
          <span>DANA</span>
          <span>SHOPEEPAY</span>
          <span>BCA</span>
          <span>MANDIRI</span>
          <span>BNI</span>
        </div>

        <!-- Links -->
        <div class="pay-links">
          <button class="pay-link" @click="router.push('/orders')">I've paid</button>
          <span class="pay-links-dot">·</span>
          <button class="pay-link" @click="router.push('/')">Cancel order</button>
        </div>
      </div>

    </template>

    <div v-else-if="error" class="pay-loading" style="color:var(--warn);">{{ error }}</div>

  </main>

  <AppFooter />
</template>

<style scoped>
.pay-page {
  display: flex; align-items: center; justify-content: center;
  padding: 48px 24px 72px; min-height: calc(100vh - 64px);
}

.pay-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; color: var(--ink-3); font-size: 14px;
}

/* ── Active payment card ── */
.pay-card {
  width: 100%; max-width: 440px;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 20px; padding: 36px 32px 28px;
  box-shadow: 0 30px 60px -20px rgba(22,20,15,.12);
  text-align: center;
}

.pay-title {
  font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--ink);
  margin: 0 0 8px; letter-spacing: -.3px;
}

.pay-amount {
  font-family: var(--serif); font-size: 38px; font-weight: 300; color: var(--ink);
  margin: 0 0 10px; letter-spacing: -1px; font-variant-numeric: tabular-nums;
}

.pay-order-row {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--ink-3); margin-bottom: 26px;
}
.pay-order-code {
  font-family: var(--mono); font-size: 11px;
  background: var(--line-2); padding: 2px 8px; border-radius: 4px;
  color: var(--ink); border: 1px solid var(--line);
}

/* QR */
.pay-qr-wrap {
  position: relative;
  width: 224px; height: 224px; margin: 0 auto 18px;
  background: white; border-radius: 14px; padding: 14px;
  box-shadow: 0 0 0 1px var(--line), 0 12px 32px -10px rgba(22,20,15,.12);
}
.pay-qr-img {
  width: 100%; height: 100%; display: block; border-radius: 4px;
}
.pay-qr-placeholder {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  color: var(--ink-3); font-size: 12px;
}
.pay-qr-logo {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--ink); color: #FAF8F4;
  font-family: var(--serif); font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 4px white;
}

/* Timer */
.pay-timer {
  font-size: 13px; color: var(--ink-3); margin: 0 0 8px;
}
.pay-timer b {
  font-family: var(--mono); font-weight: 700; color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.pay-timer--expired { color: var(--warn); }

.pay-instr {
  font-size: 13px; color: var(--ink-3); margin: 0 auto 20px;
  max-width: 300px; line-height: 1.55;
}

/* Pulse status */
.pay-status {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 16px; border-radius: 999px;
  background: var(--line-2); border: 1px solid var(--line);
  font-size: 12px; color: var(--ink-2); margin-bottom: 22px;
}
.pay-pulse {
  position: relative;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--ok); flex-shrink: 0;
}
.pay-pulse::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: var(--ok); animation: pay-ring 1.6s ease-out infinite;
}
@keyframes pay-ring {
  0% { transform: scale(1); opacity: .6; }
  100% { transform: scale(2.8); opacity: 0; }
}

/* Payment methods */
.pay-methods {
  display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;
  padding-top: 20px; border-top: 1px solid var(--line); margin-bottom: 16px;
}
.pay-methods span {
  font-size: 10px; font-weight: 700; letter-spacing: .06em;
  padding: 4px 8px; border-radius: 5px;
  background: var(--line-2); color: var(--ink-3); border: 1px solid var(--line);
}

/* Bottom links */
.pay-links {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  font-size: 13px;
}
.pay-link {
  background: none; border: none; cursor: pointer;
  font-size: 13px; font-family: var(--sans);
  color: var(--gold); font-weight: 600; padding: 0;
  transition: color .14s;
}
.pay-link:hover { color: var(--ink); }
.pay-links-dot { color: var(--ink-3); }

/* ── Terminal states ── */
.pay-terminal {
  text-align: center; max-width: 380px; padding: 24px 0;
}
.pay-terminal-icon {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.pay-terminal-icon--fail { background: rgba(180,61,61,.1); color: var(--warn); }
.pay-terminal-title {
  font-family: var(--serif); font-size: 24px; font-weight: 400; color: var(--ink);
  margin: 0 0 10px; letter-spacing: -.3px;
}
.pay-terminal-sub {
  font-size: 14px; color: var(--ink-3); margin: 0 auto 28px; max-width: 300px; line-height: 1.6;
}
.pay-terminal-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
</style>
