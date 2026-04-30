<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCart, drawerOpen, closeCartDrawer } from '../composables/useCart'
import { getSkuById, type SkuInfo } from '../services/products'

const router = useRouter()
const { cart, loading, fetchCart, updateItem, removeItem, doCheckout } = useCart()

const skuMap = ref<Map<string, SkuInfo>>(new Map())
const skuLoading = ref(false)
const placing = ref(false)
const error = ref('')

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

async function loadSkuDetails() {
  if (!cart.value?.items.length) return
  skuLoading.value = true
  const results = await Promise.allSettled(
    cart.value.items.map(item => getSkuById(item.skuId))
  )
  const map = new Map<string, SkuInfo>()
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      map.set(cart.value!.items[i].skuId, result.value)
    }
  })
  skuMap.value = map
  skuLoading.value = false
}

const displayItems = computed(() =>
  (cart.value?.items ?? []).map(item => ({
    ...item,
    sku: skuMap.value.get(item.skuId),
  }))
)

const total = computed(() =>
  displayItems.value.reduce((sum, item) => {
    return sum + Number(item.sku?.price ?? 0) * item.quantity
  }, 0)
)

function getItemImage(item: SkuInfo | undefined) {
  if (!item) return null
  return item.product?.images?.find(i => i.colorId === item.colorId)?.imageUrl ?? null
}

async function changeQty(skuId: string, qty: number) {
  if (qty < 1) return
  await updateItem(skuId, qty)
  await loadSkuDetails()
}

async function handleRemove(skuId: string) {
  await removeItem(skuId)
  await loadSkuDetails()
}

async function checkout() {
  if (!cart.value?.items.length) return
  error.value = ''
  placing.value = true
  try {
    const order = await doCheckout()
    closeCartDrawer()
    router.push(`/payment/${order.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to place order.'
  } finally {
    placing.value = false
  }
}

watch(drawerOpen, async (open) => {
  if (open) {
    await fetchCart()
    await loadSkuDetails()
  }
})
</script>

<template>
  <!-- Backdrop -->
  <Transition name="backdrop">
    <div v-if="drawerOpen" class="cd-back" @click="closeCartDrawer" />
  </Transition>

  <!-- Drawer panel -->
  <Transition name="drawer">
    <aside v-if="drawerOpen" class="cd">
      <!-- Header -->
      <div class="cd-head">
        <h3 class="cd-head-title">Your Bag</h3>
        <button class="cd-close" @click="closeCartDrawer" aria-label="Close cart">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M6 6l12 12M18 6 6 18"/>
          </svg>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading || skuLoading" class="cd-empty">
        <div class="spinner" />
        <span>Loading bag…</span>
      </div>

      <!-- Empty -->
      <div v-else-if="!displayItems.length" class="cd-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" style="color:var(--ink-3)">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <p class="cd-empty-title">Bag is empty</p>
        <span class="cd-empty-sub">Add pieces to see them here.</span>
        <button class="btn-outline" style="margin-top:16px;padding:9px 22px;" @click="closeCartDrawer">
          Continue Shopping
        </button>
      </div>

      <!-- Item list -->
      <ul v-else class="cd-list">
        <li v-for="item in displayItems" :key="item.skuId" class="cd-item">
          <!-- Thumb -->
          <div class="cd-thumb">
            <img
              v-if="getItemImage(item.sku)"
              :src="getItemImage(item.sku)!"
              :alt="item.sku?.product?.name"
              class="cd-thumb-img"
            />
            <div v-else class="cd-thumb-color" :style="{ background: item.sku?.color?.hex ?? 'var(--line-2)' }" />
          </div>

          <!-- Info -->
          <div class="cd-info">
            <p class="cd-item-name">{{ item.sku?.product?.name ?? item.skuId }}</p>
            <p class="cd-item-meta">
              <span v-if="item.sku?.color">{{ item.sku.color.name }}</span>
              <span v-if="item.sku?.size"> · {{ item.sku.size.name }}</span>
            </p>
            <p class="cd-item-price">{{ item.sku ? formatPrice(Number(item.sku.price)) : '—' }}</p>
          </div>

          <!-- Qty + remove -->
          <div class="cd-actions">
            <div class="cd-qty">
              <button class="cd-qty-btn" @click="changeQty(item.skuId, item.quantity - 1)">−</button>
              <span class="cd-qty-val">{{ item.quantity }}</span>
              <button class="cd-qty-btn" @click="changeQty(item.skuId, item.quantity + 1)">+</button>
            </div>
            <button class="cd-remove" @click="handleRemove(item.skuId)">Remove</button>
          </div>
        </li>
      </ul>

      <!-- Footer -->
      <div v-if="displayItems.length" class="cd-foot">
        <p v-if="error" class="auth-error" style="margin-bottom:10px;">{{ error }}</p>
        <div class="cd-subtotal">
          <span>Subtotal</span>
          <span class="cd-subtotal-amount">{{ formatPrice(total) }}</span>
        </div>
        <button class="btn-primary cd-checkout" :disabled="placing" @click="checkout">
          {{ placing ? 'Placing Order…' : `Checkout · ${formatPrice(total)}` }}
        </button>
        <p class="cd-foot-hint">Taxes and shipping calculated at checkout.</p>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.cd-back {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(22,20,15,.45);
  backdrop-filter: blur(4px);
}
.cd {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 201;
  width: min(420px, 100vw);
  background: var(--surface); border-left: 1px solid var(--line);
  display: flex; flex-direction: column;
  box-shadow: -20px 0 48px rgba(22,20,15,.16);
}

/* Transitions */
.backdrop-enter-active, .backdrop-leave-active { transition: opacity .24s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.drawer-enter-active { transition: transform .3s cubic-bezier(.4,0,.2,1); }
.drawer-leave-active { transition: transform .22s cubic-bezier(.4,0,.2,1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }

/* Header */
.cd-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 22px; border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.cd-head-title { font-family: var(--serif); font-size: 18px; font-weight: 400; color: var(--ink); margin: 0; }
.cd-close {
  width: 34px; height: 34px; border-radius: 8px; border: none; background: none;
  color: var(--ink-2); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .14s, color .14s;
}
.cd-close:hover { background: var(--line-2); color: var(--ink); }

/* Empty state */
.cd-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; padding: 40px 24px; text-align: center;
}
.cd-empty-title { font-family: var(--serif); font-size: 18px; font-weight: 400; color: var(--ink); margin: 8px 0 0; }
.cd-empty-sub { font-size: 13px; color: var(--ink-3); margin: 0; }

/* Item list */
.cd-list {
  flex: 1; overflow-y: auto; padding: 16px 22px;
  display: flex; flex-direction: column; gap: 16px;
  list-style: none; margin: 0;
}
.cd-item {
  display: grid; grid-template-columns: 60px 1fr auto; gap: 12px; align-items: start;
  padding-bottom: 16px; border-bottom: 1px solid var(--line);
}
.cd-item:last-child { border-bottom: none; padding-bottom: 0; }

.cd-thumb {
  width: 60px; height: 76px; border-radius: 8px; overflow: hidden;
  border: 1px solid var(--line); flex-shrink: 0;
}
.cd-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cd-thumb-color { width: 100%; height: 100%; }

.cd-info { min-width: 0; }
.cd-item-name { font-size: 13px; font-weight: 600; color: var(--ink); margin: 0 0 3px; line-height: 1.3; }
.cd-item-meta { font-size: 11px; color: var(--ink-3); margin: 0 0 5px; }
.cd-item-price { font-size: 13px; font-weight: 600; color: var(--ink-2); margin: 0; }

.cd-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.cd-qty {
  display: flex; align-items: center;
  border: 1.5px solid var(--line); border-radius: 999px; overflow: hidden;
}
.cd-qty-btn {
  width: 28px; height: 28px; border: none; background: none;
  color: var(--ink); font-size: 15px; cursor: pointer; transition: background .12s;
  display: flex; align-items: center; justify-content: center;
}
.cd-qty-btn:hover { background: var(--line-2); }
.cd-qty-val { min-width: 28px; text-align: center; font-size: 13px; font-weight: 600; color: var(--ink); }
.cd-remove { font-size: 11px; color: var(--ink-3); background: none; border: none; cursor: pointer; padding: 0; font-family: var(--sans); text-decoration: underline; text-underline-offset: 2px; transition: color .14s; }
.cd-remove:hover { color: var(--warn); }

/* Footer */
.cd-foot {
  padding: 18px 22px 24px; border-top: 1px solid var(--line);
  background: var(--line-2); flex-shrink: 0;
}
.cd-subtotal { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.cd-subtotal span:first-child { font-size: 14px; color: var(--ink-2); }
.cd-subtotal-amount { font-family: var(--serif); font-size: 20px; font-weight: 400; color: var(--ink); }
.cd-checkout { width: 100%; padding: 12px; font-size: 14px; }
.cd-foot-hint { font-size: 11px; color: var(--ink-3); text-align: center; margin: 10px 0 0; }
</style>
