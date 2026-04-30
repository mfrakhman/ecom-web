<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getUser, clearToken } from '../services/auth'
import { useCart } from '../composables/useCart'
import { getMyOrders, type Order } from '../services/orders'

const router = useRouter()
const { reset } = useCart()

const section = ref<'profile' | 'orders' | 'security'>('profile')

const user = getUser()
const orders = ref<Order[]>([])
const ordersLoading = ref(true)

const initials = computed(() => {
  const name = user?.username ?? user?.email ?? ''
  return name
    .split(/[\s@._-]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'U'
})

const displayName = computed(() => user?.username ?? user?.email?.split('@')[0] ?? 'User')
const memberSince = computed(() => {
  if (!user?.iat) return null
  return new Date(user.iat * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const stats = computed(() => {
  const placed = orders.value.filter(o => o.status !== 'CART')
  const spent = placed.reduce((s, o) => s + o.items.reduce((si, i) => si + Number(i.price) * i.quantity, 0), 0)
  const paidCount = placed.filter(o => o.paymentStatus === 'PAID').length
  return { orders: placed.length, spent, paid: paidCount }
})

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function logout() {
  clearToken()
  reset()
  router.push('/login')
}

onMounted(async () => {
  try {
    orders.value = await getMyOrders()
  } catch {
    // not critical
  } finally {
    ordersLoading.value = false
  }
})
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="acct-wrap">

      <!-- Sidebar -->
      <aside class="acct-side">
        <div class="acct-side-user">
          <div class="acct-avatar">{{ initials }}</div>
          <div class="acct-side-user-info">
            <p class="acct-side-name">{{ displayName }}</p>
            <span class="acct-side-email">{{ user?.email }}</span>
          </div>
        </div>

        <nav class="acct-nav">
          <button
            class="acct-nav-item"
            :class="{ active: section === 'profile' }"
            @click="section = 'profile'"
          >
            <span>Profile</span>
          </button>
          <button
            class="acct-nav-item"
            :class="{ active: section === 'orders' }"
            @click="section = 'orders'"
          >
            <span>My Orders</span>
            <span v-if="!ordersLoading && stats.orders > 0" class="acct-nav-badge">{{ stats.orders }}</span>
          </button>
          <button
            class="acct-nav-item"
            :class="{ active: section === 'security' }"
            @click="section = 'security'"
          >
            <span>Security</span>
          </button>
          <button class="acct-nav-item acct-nav-item--danger" @click="logout">
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      <!-- Main content -->
      <section class="acct-main">

        <!-- ── Profile section ── -->
        <template v-if="section === 'profile'">
          <!-- Profile card with banner -->
          <div class="acct-card acct-card--npad">
            <div class="acct-banner">
              <div class="acct-banner-avatar">{{ initials }}</div>
            </div>
            <div class="acct-banner-body">
              <div class="acct-name-row">
                <h2 class="acct-display-name">{{ displayName }}</h2>
                <span class="acct-tier">★ Member</span>
              </div>
              <div class="acct-meta">
                <span>{{ user?.email }}</span>
                <template v-if="memberSince">
                  <span class="acct-meta-dot">·</span>
                  <span>Member since {{ memberSince }}</span>
                </template>
              </div>

              <!-- Stats grid -->
              <div class="acct-stats" v-if="!ordersLoading">
                <div class="acct-stat">
                  <span class="acct-stat-num">{{ stats.orders }}</span>
                  <span class="acct-stat-lbl">Orders placed</span>
                </div>
                <div class="acct-stat">
                  <span class="acct-stat-num">{{ stats.paid }}</span>
                  <span class="acct-stat-lbl">Completed</span>
                </div>
                <div class="acct-stat">
                  <span class="acct-stat-num">{{ formatPrice(stats.spent) }}</span>
                  <span class="acct-stat-lbl">Lifetime spend</span>
                </div>
                <div class="acct-stat">
                  <span class="acct-stat-num">0</span>
                  <span class="acct-stat-lbl">Loyalty points</span>
                </div>
              </div>
              <div v-else class="acct-stats-loading" />
            </div>
          </div>

          <!-- Account info -->
          <div class="acct-card">
            <div class="acct-card-head">
              <h3 class="acct-card-title">Account information</h3>
            </div>
            <div class="acct-fields">
              <div class="acct-field">
                <label>Username</label>
                <input :value="user?.username ?? displayName" readonly />
              </div>
              <div class="acct-field">
                <label>Email</label>
                <input :value="user?.email" readonly />
              </div>
              <div class="acct-field">
                <label>Role</label>
                <input :value="user?.role" readonly />
              </div>
            </div>
          </div>
        </template>

        <!-- ── Orders section ── -->
        <template v-else-if="section === 'orders'">
          <div class="acct-card">
            <div class="acct-card-head">
              <h3 class="acct-card-title">My Orders</h3>
              <span class="acct-card-count" v-if="!ordersLoading">{{ stats.orders }} orders</span>
            </div>

            <div v-if="ordersLoading" class="acct-state">
              <div class="spinner" />
            </div>

            <div v-else-if="!orders.filter(o => o.status !== 'CART').length" class="acct-state">
              <p>No orders yet.</p>
              <button class="btn-outline" style="margin-top:12px;" @click="router.push('/')">Start shopping</button>
            </div>

            <div v-else class="acct-orders">
              <div
                v-for="order in orders.filter(o => o.status !== 'CART')"
                :key="order.id"
                class="acct-order-row"
              >
                <div class="acct-order-info">
                  <p class="acct-order-id">{{ order.id.slice(0, 8).toUpperCase() }}…</p>
                  <p class="acct-order-date">{{ formatDate(order.createdAt) }}</p>
                </div>
                <div class="acct-order-meta">
                  <span class="acct-order-items">{{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</span>
                </div>
                <span
                  class="acct-order-status"
                  :class="{
                    'status--paid': order.paymentStatus === 'PAID',
                    'status--pending': order.paymentStatus === 'AWAITING',
                    'status--failed': order.paymentStatus === 'FAILED' || order.paymentStatus === 'EXPIRED',
                  }"
                >
                  {{ order.paymentStatus ?? order.status }}
                </span>
                <button
                  v-if="order.paymentStatus === 'AWAITING'"
                  class="btn-outline acct-order-pay-btn"
                  @click="router.push(`/payment/${order.id}`)"
                >
                  Pay now
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Security section ── -->
        <template v-else-if="section === 'security'">
          <div class="acct-card">
            <div class="acct-card-head">
              <h3 class="acct-card-title">Security</h3>
            </div>
            <p class="acct-security-note">
              Password changes and two-factor authentication settings are coming soon.
            </p>
            <button class="btn-outline" @click="logout">Sign out of all devices</button>
          </div>
        </template>

      </section>
    </div>
  </main>

  <AppFooter />
</template>

<style scoped>
.acct-wrap {
  max-width: 1100px; margin: 0 auto; padding: 36px 24px 80px;
  display: grid; grid-template-columns: 240px 1fr; gap: 28px; align-items: start;
}
@media (max-width: 768px) { .acct-wrap { grid-template-columns: 1fr; } }

/* ── Sidebar ── */
.acct-side {
  position: sticky; top: 80px;
  background: var(--surface); border: 1px solid var(--line); border-radius: 16px;
  padding: 18px; overflow: hidden;
}
.acct-side-user {
  display: flex; gap: 12px; align-items: center;
  padding-bottom: 16px; border-bottom: 1px solid var(--line); margin-bottom: 12px;
}
.acct-avatar {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: var(--ink); color: #FAF8F4;
  font-family: var(--serif); font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.acct-side-user-info { min-width: 0; }
.acct-side-name { font-size: 14px; font-weight: 600; color: var(--ink); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.acct-side-email { font-size: 11px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

.acct-nav { display: flex; flex-direction: column; gap: 2px; }
.acct-nav-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; border-radius: 10px;
  font-size: 13px; font-weight: 500; color: var(--ink-2);
  background: none; border: none; cursor: pointer; font-family: var(--sans);
  text-align: left; transition: background .14s, color .14s;
}
.acct-nav-item:hover { background: var(--line-2); color: var(--ink); }
.acct-nav-item.active { background: var(--line-2); color: var(--ink); font-weight: 600; }
.acct-nav-item--danger { color: var(--warn); margin-top: 8px; }
.acct-nav-item--danger:hover { background: rgba(180,61,61,.08); color: var(--warn); }
.acct-nav-badge {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px;
  background: var(--ink); color: #FAF8F4;
}

/* ── Main ── */
.acct-main { display: flex; flex-direction: column; gap: 18px; }

.acct-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 16px; padding: 24px;
}
.acct-card--npad { padding: 0; overflow: hidden; }
.acct-card-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;
}
.acct-card-title { font-family: var(--serif); font-size: 17px; font-weight: 400; color: var(--ink); margin: 0; }
.acct-card-count { font-size: 12px; color: var(--ink-3); }

/* Banner */
.acct-banner {
  height: 110px; position: relative;
  background: linear-gradient(135deg, var(--ink) 0%, #3d3424 60%, var(--gold) 100%);
  margin-bottom: 52px;
}
.acct-banner-avatar {
  position: absolute; left: 24px; bottom: -36px;
  width: 72px; height: 72px; border-radius: 16px;
  background: var(--gold); color: #FAF8F4;
  font-family: var(--serif); font-size: 28px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 4px solid var(--surface);
  box-shadow: 0 8px 24px rgba(22,20,15,.18);
}
.acct-banner-body { padding: 0 24px 24px; }
.acct-name-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
.acct-display-name { font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--ink); margin: 0; }
.acct-tier {
  font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px;
  background: var(--gold-bg); color: var(--gold); border: 1px solid var(--gold-border);
}
.acct-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ink-3); flex-wrap: wrap; }
.acct-meta-dot { color: var(--line); }

/* Stats */
.acct-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px;
}
@media (max-width: 640px) { .acct-stats { grid-template-columns: repeat(2, 1fr); } }
.acct-stat {
  padding: 12px 14px; background: var(--line-2); border-radius: 10px;
  display: flex; flex-direction: column; gap: 3px;
}
.acct-stat-num { font-family: var(--serif); font-size: 18px; font-weight: 400; color: var(--ink); letter-spacing: -.3px; }
.acct-stat-lbl { font-size: 10px; color: var(--ink-3); letter-spacing: .04em; }
.acct-stats-loading { height: 80px; background: var(--line-2); border-radius: 10px; margin-top: 20px; animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Fields */
.acct-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .acct-fields { grid-template-columns: 1fr; } }
.acct-field { display: flex; flex-direction: column; gap: 6px; }
.acct-field label { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
.acct-field input {
  height: 40px; padding: 0 12px;
  background: var(--line-2); border: 1px solid var(--line);
  border-radius: 9px; font-size: 13px; color: var(--ink);
  font-family: var(--sans);
}
.acct-field input[readonly] { cursor: default; }

/* Orders */
.acct-state { padding: 40px; text-align: center; color: var(--ink-3); display: flex; flex-direction: column; align-items: center; gap: 6px; }
.acct-orders { display: flex; flex-direction: column; }
.acct-order-row {
  display: flex; align-items: center; gap: 14px; padding: 14px 0;
  border-bottom: 1px solid var(--line); flex-wrap: wrap;
}
.acct-order-row:last-child { border-bottom: none; }
.acct-order-info { flex: 1; min-width: 0; }
.acct-order-id { font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--ink); margin: 0 0 2px; }
.acct-order-date { font-size: 11px; color: var(--ink-3); margin: 0; }
.acct-order-meta { flex-shrink: 0; }
.acct-order-items { font-size: 12px; color: var(--ink-3); }
.acct-order-status {
  font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px; flex-shrink: 0;
  background: var(--line-2); color: var(--ink-3);
}
.status--paid { background: rgba(47,110,79,.1); color: var(--ok); }
.status--pending { background: var(--gold-bg); color: var(--gold); }
.status--failed { background: rgba(180,61,61,.08); color: var(--warn); }
.acct-order-pay-btn { padding: 6px 14px; font-size: 12px; flex-shrink: 0; }

/* Security */
.acct-security-note { font-size: 14px; color: var(--ink-3); margin: 0 0 20px; line-height: 1.6; }
</style>
