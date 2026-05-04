<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { useCart } from '../composables/useCart'
import { getSkuById, type SkuInfo } from '../services/products'
import { getAddresses, type Address } from '../services/addresses'

const router = useRouter()
const { cart, loading, fetchCart, updateItem, removeItem, doCheckout } = useCart()

const skuMap = ref<Map<string, SkuInfo>>(new Map())
const skuLoading = ref(false)
const placing = ref(false)
const error = ref('')

// address picker
const showAddressPicker = ref(false)
const addresses = ref<Address[]>([])
const selectedAddressId = ref<string | null>(null)
const addressLoading = ref(false)
const addressError = ref('')

const selectedAddress = computed(() =>
  addresses.value.find(a => a.id === selectedAddressId.value) ?? null
)

function formatAddress(a: Address) {
  return [a.street, a.district, a.subdistrict, a.city, a.province, a.postalCode]
    .filter(Boolean).join(', ')
}

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
    const price = Number(item.sku?.price ?? 0)
    return sum + price * item.quantity
  }, 0)
)

async function changeQty(skuId: string, qty: number) {
  if (qty < 1) return
  await updateItem(skuId, qty)
  await loadSkuDetails()
}

async function handleRemove(skuId: string) {
  await removeItem(skuId)
  await loadSkuDetails()
}

async function openAddressPicker() {
  showAddressPicker.value = true
  addressLoading.value = true
  addressError.value = ''
  selectedAddressId.value = null
  addresses.value = []
  try {
    addresses.value = await getAddresses()
    const def = addresses.value.find(a => a.isDefault) ?? addresses.value[0]
    if (def) selectedAddressId.value = def.id
  } catch (e) {
    addressError.value = e instanceof Error ? e.message : 'Failed to load addresses.'
  } finally {
    addressLoading.value = false
  }
}

async function confirmOrder() {
  if (!selectedAddressId.value) return
  error.value = ''
  placing.value = true
  showAddressPicker.value = false
  try {
    const addr = selectedAddress.value
    const order = await doCheckout(addr ? { ...addr } : undefined)
    router.push(`/payment/${order.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to place order.'
  } finally {
    placing.value = false
  }
}

onMounted(async () => {
  await fetchCart()
  await loadSkuDetails()
})
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="cart-container">
      <h1 class="cart-title">Your Cart</h1>

      <div v-if="loading || skuLoading" class="products-state">
        <div class="spinner" />
        <p>Loading cart…</p>
      </div>

      <div v-else-if="!cart?.items.length" class="products-state">
        <p style="color: var(--text);">Your cart is empty.</p>
        <button class="btn-primary" style="margin-top:16px;" @click="router.push('/')">Continue Shopping</button>
      </div>

      <div v-else class="cart-layout">
        <!-- Items -->
        <div class="cart-items">
          <div v-for="item in displayItems" :key="item.skuId" class="cart-item">
            <div class="cart-item-img-wrap">
              <img
                v-if="item.sku?.product?.images?.find(i => i.colorId === item.sku!.colorId)?.imageUrl"
                :src="item.sku!.product!.images!.find(i => i.colorId === item.sku!.colorId)!.imageUrl"
                :alt="item.sku?.product?.name"
                class="cart-item-img"
              />
              <div
                v-else
                class="cart-item-img"
                :style="{ background: item.sku?.color?.hex ?? 'var(--border)', borderRadius: '6px' }"
              />
            </div>
            <div class="cart-item-info">
              <p class="cart-item-product">{{ item.sku?.product?.name ?? item.skuId }}</p>
              <p class="cart-item-sku">
                <span class="cart-item-meta">{{ item.sku?.skuCode }}</span>
                <span v-if="item.sku?.size" class="cart-item-meta">· {{ item.sku.size.name }}</span>
              </p>
              <p class="cart-item-price">{{ item.sku ? formatPrice(Number(item.sku.price)) : '—' }}</p>
            </div>

            <div class="cart-item-actions">
              <div class="qty-control">
                <button class="qty-btn" @click="changeQty(item.skuId, item.quantity - 1)">−</button>
                <span class="qty-value">{{ item.quantity }}</span>
                <button class="qty-btn" @click="changeQty(item.skuId, item.quantity + 1)">+</button>
              </div>
              <p class="cart-item-subtotal">
                {{ item.sku ? formatPrice(Number(item.sku.price) * item.quantity) : '—' }}
              </p>
              <button class="btn-ghost cart-remove-btn" @click="handleRemove(item.skuId)">Remove</button>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="cart-summary">
          <h2 class="cart-summary-title">Order Summary</h2>

          <div class="cart-summary-row" v-for="item in displayItems" :key="item.skuId">
            <span>{{ item.sku?.product?.name ?? item.skuId }} × {{ item.quantity }}</span>
            <span>{{ item.sku ? formatPrice(Number(item.sku.price) * item.quantity) : '—' }}</span>
          </div>

          <div class="cart-summary-divider" />

          <div class="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>{{ formatPrice(total) }}</span>
          </div>

          <p v-if="error" class="auth-error" style="margin-top:12px;">{{ error }}</p>

          <button class="btn-primary" style="width:100%; margin-top:16px;" :disabled="placing" @click="openAddressPicker">
            {{ placing ? 'Placing Order…' : 'Place Order' }}
          </button>
          <button class="btn-ghost" style="width:100%; margin-top:8px;" @click="router.push('/')">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  </main>

  <AppFooter />

  <!-- Address picker modal -->
  <Teleport to="body">
    <div v-if="showAddressPicker" class="modal-backdrop" @click.self="showAddressPicker = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">Select Delivery Address</h3>
          <button class="modal-close" @click="showAddressPicker = false">✕</button>
        </div>

        <div v-if="addressLoading" class="modal-loading">
          <div class="spinner" /><p>Loading addresses…</p>
        </div>

        <div v-else-if="addressError" class="modal-empty">
          <p style="color:var(--warn);">{{ addressError }}</p>
          <button class="btn-outline" style="margin-top:16px;" @click="openAddressPicker">Retry</button>
        </div>

        <template v-else-if="addresses.length">
          <div class="addr-list">
            <label
              v-for="a in addresses"
              :key="a.id"
              class="addr-option"
              :class="{ 'addr-option--selected': selectedAddressId === a.id }"
            >
              <input type="radio" :value="a.id" v-model="selectedAddressId" class="addr-radio" />
              <div class="addr-info">
                <div class="addr-label-row">
                  <span v-if="a.label" class="addr-label">{{ a.label }}</span>
                  <span v-if="a.isDefault" class="addr-default-badge">Default</span>
                </div>
                <p class="addr-line">{{ formatAddress(a) }}</p>
              </div>
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="router.push('/account')">Manage Addresses</button>
            <button class="btn-primary" :disabled="!selectedAddressId" @click="confirmOrder">
              Confirm Order
            </button>
          </div>
        </template>

        <div v-else class="modal-empty">
          <p>No addresses saved yet.</p>
          <button class="btn-primary" style="margin-top:16px;" @click="router.push('/account')">
            Add Address
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cart-container { max-width: 1100px; margin: 0 auto; padding: 40px 24px; width: 100%; }
.cart-title { font-family: var(--serif); font-size: 28px; font-weight: 400; color: var(--ink); margin-bottom: 32px; }
.cart-layout { display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }
@media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } }
.cart-items { display: flex; flex-direction: column; gap: 16px; }
.cart-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 20px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
@media (max-width: 480px) { .cart-item { flex-direction: column; } }
.cart-item-img { width: 72px; height: 72px; object-fit: cover; border-radius: 10px; border: 1px solid var(--line); display: block; flex-shrink: 0; }
.cart-item-info { flex: 1; min-width: 0; }
.cart-item-product { font-weight: 600; color: var(--ink); margin: 0 0 2px; }
.cart-item-sku { font-size: 14px; color: var(--ink-2); margin: 0 0 6px; }
.cart-item-meta { color: var(--ink-2); }
.cart-item-price { font-size: 14px; color: var(--ink-2); margin: 0; }
.cart-item-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.qty-control { display: flex; align-items: center; border: 1.5px solid var(--line); border-radius: 999px; overflow: hidden; }
.qty-btn { width: 32px; height: 32px; border: none; background: transparent; color: var(--ink); font-size: 16px; cursor: pointer; transition: background .15s; }
.qty-btn:hover { background: var(--line-2); }
.qty-value { min-width: 36px; text-align: center; font-size: 14px; font-weight: 600; color: var(--ink); }
.cart-item-subtotal { font-weight: 700; color: var(--ink); margin: 0; font-size: 15px; }
.cart-remove-btn { font-size: 13px; padding: 2px 8px; height: auto; color: var(--ink-3); background: none; border: none; cursor: pointer; font-family: var(--sans); border-radius: 6px; transition: color .15s; }
.cart-remove-btn:hover { color: var(--warn); }
.cart-summary { border: 1px solid var(--line); border-radius: 16px; padding: 24px; background: var(--surface); position: sticky; top: 80px; }
.cart-summary-title { font-family: var(--serif); font-size: 18px; font-weight: 400; color: var(--ink); margin: 0 0 16px; }
.cart-summary-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--ink-2); margin-bottom: 8px; }
.cart-summary-divider { height: 1px; background: var(--line); margin: 12px 0; }
.cart-summary-total { font-weight: 700; font-size: 16px; color: var(--ink); }
.products-state { padding: 80px 24px; text-align: center; color: var(--ink-3); display: flex; flex-direction: column; align-items: center; gap: 16px; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal-box { background: var(--surface); border-radius: 20px; width: 100%; max-width: 480px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 24px 64px -16px rgba(22,20,15,.25); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 24px 0; }
.modal-title { font-family: var(--serif); font-size: 18px; font-weight: 400; color: var(--ink); margin: 0; }
.modal-close { background: none; border: none; font-size: 16px; color: var(--ink-3); cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.modal-close:hover { background: var(--line-2); }
.modal-loading { padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--ink-3); font-size: 14px; }
.modal-empty { padding: 48px 24px; text-align: center; color: var(--ink-3); }
.addr-list { padding: 16px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.addr-option { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border: 1.5px solid var(--line); border-radius: 12px; cursor: pointer; transition: border-color .15s, background .15s; }
.addr-option--selected { border-color: var(--gold); background: rgba(var(--gold-rgb, 180,140,80),.06); }
.addr-option:hover { border-color: var(--ink-3); }
.addr-radio { margin-top: 3px; accent-color: var(--gold); flex-shrink: 0; }
.addr-info { flex: 1; min-width: 0; }
.addr-label-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.addr-label { font-weight: 600; font-size: 14px; color: var(--ink); }
.addr-default-badge { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 999px; background: var(--line-2); color: var(--ink-3); border: 1px solid var(--line); }
.addr-line { font-size: 13px; color: var(--ink-2); margin: 0; line-height: 1.5; }
.modal-footer { display: flex; gap: 10px; padding: 16px 24px 24px; border-top: 1px solid var(--line); margin-top: 4px; }
.modal-footer .btn-ghost { flex: 1; }
.modal-footer .btn-primary { flex: 2; }
</style>
