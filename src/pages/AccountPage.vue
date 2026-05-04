<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import AppFooter from '../components/AppFooter.vue'
import { getUser, clearToken, getMe, updateMe, uploadPhoto, deletePhoto, type Profile } from '../services/auth'
import { useCart } from '../composables/useCart'
import { getMyOrders, type Order } from '../services/orders'
import { getAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress, type Address, type AddressForm } from '../services/addresses'
import { getSkuById, type SkuInfo } from '../services/products'
import { useWishlist } from '../composables/useWishlist'

const router = useRouter()
const { reset } = useCart()

const section = ref<'profile' | 'account' | 'orders' | 'addresses' | 'wishlist' | 'security'>('profile')

const jwtUser = getUser()
const profile  = ref<Profile | null>(null)
const orders   = ref<Order[]>([])
const ordersLoading  = ref(true)
const profileLoading = ref(true)
const saving         = ref(false)
const saveError      = ref('')
const photoUploading = ref(false)
const photoError     = ref('')
const photoInput     = ref<HTMLInputElement | null>(null)

const editForm = ref({
  firstName: '', lastName: '', dob: '', gender: '' as '' | 'MALE' | 'FEMALE', phone: '',
})

function syncForm(p: Profile) {
  editForm.value = {
    firstName: p.firstName ?? '',
    lastName:  p.lastName  ?? '',
    dob:       p.dob       ?? '',
    gender:    p.gender    ?? '',
    phone:     p.phone     ?? '',
  }
}

const displayName = computed(() => {
  if (profile.value?.firstName || profile.value?.lastName)
    return [profile.value.firstName, profile.value.lastName].filter(Boolean).join(' ')
  return profile.value?.username ?? jwtUser?.email?.split('@')[0] ?? 'User'
})

const initials = computed(() => {
  const name = displayName.value
  return name
    .split(/[\s@._-]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'U'
})

const memberSince = computed(() => {
  if (!jwtUser?.iat) return null
  return new Date(jwtUser.iat * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const stats = computed(() => {
  const placed = orders.value.filter(o => o.status !== 'CART')
  const spent  = placed.reduce((s, o) => s + o.items.reduce((si, i) => si + Number(i.price) * i.quantity, 0), 0)
  const paidCount = placed.filter(o => o.paymentStatus === 'PAID').length
  return { orders: placed.length, spent, paid: paidCount }
})

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

const { reset: resetWishlist } = useWishlist()

function logout() {
  clearToken()
  reset()
  resetWishlist()
  router.push('/login')
}

async function saveProfile() {
  saving.value = true
  saveError.value = ''
  try {
    const payload: any = { ...editForm.value }
    if (!payload.gender) delete payload.gender
    if (!payload.dob) delete payload.dob
    if (!payload.phone) delete payload.phone
    profile.value = await updateMe(payload)
  } catch (e: any) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

async function handlePhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  photoError.value = ''
  photoUploading.value = true
  try {
    profile.value = await uploadPhoto(file)
  } catch (err: any) {
    photoError.value = err.message
  } finally {
    photoUploading.value = false
    if (photoInput.value) photoInput.value.value = ''
  }
}

async function handleDeletePhoto() {
  photoError.value = ''
  photoUploading.value = true
  try {
    profile.value = await deletePhoto()
  } catch (err: any) {
    photoError.value = err.message
  } finally {
    photoUploading.value = false
  }
}

// ── Addresses ──
const addrList = ref<Address[]>([])
const addrLoading = ref(false)
const addrSaving = ref(false)
const addrError = ref('')
const showAddForm = ref(false)
const editingId = ref<string | null>(null)
const addrForm = ref<AddressForm>({ street: '', city: '', province: '', country: 'Indonesia' })

function emptyAddrForm(): AddressForm {
  return { label: '', street: '', district: '', subdistrict: '', city: '', province: '', postalCode: '', country: 'Indonesia', isDefault: false }
}

async function loadAddresses() {
  addrLoading.value = true
  try { addrList.value = await getAddresses() } catch { addrList.value = [] } finally { addrLoading.value = false }
}

function openAddForm() {
  editingId.value = null
  addrForm.value = emptyAddrForm()
  showAddForm.value = true
}

function startEdit(addr: Address) {
  editingId.value = addr.id
  showAddForm.value = false
  addrForm.value = {
    label: addr.label ?? '',
    street: addr.street,
    district: addr.district ?? '',
    subdistrict: addr.subdistrict ?? '',
    city: addr.city,
    province: addr.province,
    postalCode: addr.postalCode ?? '',
    country: addr.country,
    isDefault: addr.isDefault,
  }
}

function cancelAddrForm() {
  showAddForm.value = false
  editingId.value = null
  addrError.value = ''
}

async function submitAddrForm() {
  addrSaving.value = true
  addrError.value = ''
  try {
    const data: AddressForm = { ...addrForm.value }
    if (!data.label) delete data.label
    if (!data.district) delete data.district
    if (!data.subdistrict) delete data.subdistrict
    if (!data.postalCode) delete data.postalCode
    if (editingId.value) {
      await updateAddress(editingId.value, data)
    } else {
      await createAddress(data)
    }
    cancelAddrForm()
    await loadAddresses()
  } catch (e: any) {
    addrError.value = e.message
  } finally {
    addrSaving.value = false
  }
}

async function doSetDefault(id: string) {
  try { await setDefaultAddress(id); await loadAddresses() } catch {}
}

async function doDelete(id: string) {
  try { await deleteAddress(id); await loadAddresses() } catch {}
}

function goSection(s: typeof section.value) {
  section.value = s
  if (s === 'addresses' && !addrList.value.length) loadAddresses()
  if (s === 'wishlist') loadWishlistSection()
}

// ── Wishlist ──
const { items: wishlistItems, toggle: toggleWishlist, reload: reloadWishlist } = useWishlist()
const wishlistSkuMap = ref<Map<string, SkuInfo>>(new Map())
const wishlistLoading = ref(false)

async function loadWishlistSection() {
  wishlistLoading.value = true
  try {
    await reloadWishlist()
    const ids = wishlistItems.value.map(i => i.skuId)
    const results = await Promise.allSettled(ids.map(id => getSkuById(id)))
    const map = new Map<string, SkuInfo>()
    results.forEach((r, i) => { if (r.status === 'fulfilled') map.set(ids[i], r.value) })
    wishlistSkuMap.value = map
  } finally {
    wishlistLoading.value = false
  }
}

function formatAddress(a: Address) {
  return [a.street, a.district, a.subdistrict, a.city, a.province, a.postalCode]
    .filter(Boolean).join(', ')
}

onMounted(async () => {
  await Promise.allSettled([
    getMe().then(p => { profile.value = p; syncForm(p) }).finally(() => { profileLoading.value = false }),
    getMyOrders().then(o => { orders.value = o }).finally(() => { ordersLoading.value = false }),
  ])
})
</script>

<template>
  <Navbar />

  <main class="page-main">
    <div class="acct-wrap">

      <!-- Sidebar -->
      <aside class="acct-side">
        <div class="acct-side-user">
          <div class="acct-avatar">
            <img v-if="profile?.profilePhotoUrl" :src="profile.profilePhotoUrl" alt="avatar" />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="acct-side-user-info">
            <p class="acct-side-name">{{ displayName }}</p>
            <span class="acct-side-email">{{ jwtUser?.email }}</span>
          </div>
        </div>

        <nav class="acct-nav">
          <button class="acct-nav-item" :class="{ active: section === 'profile' }" @click="goSection('profile')">
            <span>Profile</span>
          </button>
          <button class="acct-nav-item" :class="{ active: section === 'account' }" @click="goSection('account')">
            <span>Account</span>
          </button>
          <button class="acct-nav-item" :class="{ active: section === 'orders' }" @click="goSection('orders')">
            <span>My Orders</span>
            <span v-if="!ordersLoading && stats.orders > 0" class="acct-nav-badge">{{ stats.orders }}</span>
          </button>
          <button class="acct-nav-item" :class="{ active: section === 'addresses' }" @click="goSection('addresses')">
            <span>Addresses</span>
          </button>
          <button class="acct-nav-item" :class="{ active: section === 'wishlist' }" @click="goSection('wishlist')">
            <span>Wishlist</span>
            <span v-if="wishlistItems.length" class="acct-nav-badge">{{ wishlistItems.length }}</span>
          </button>
          <button class="acct-nav-item" :class="{ active: section === 'security' }" @click="goSection('security')">
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
              <!-- Avatar with photo controls -->
              <div class="acct-banner-avatar-wrap">
                <div class="acct-banner-avatar" :class="{ 'is-uploading': photoUploading }">
                  <img v-if="profile?.profilePhotoUrl" :src="profile.profilePhotoUrl" alt="Profile photo" />
                  <span v-else>{{ initials }}</span>
                  <div class="avatar-overlay" @click="photoInput?.click()">
                    <span v-if="!photoUploading">{{ profile?.profilePhotoUrl ? '✎' : '+' }}</span>
                    <span v-else class="avatar-spinner" />
                  </div>
                </div>
                <button
                  v-if="profile?.profilePhotoUrl"
                  class="photo-remove-btn"
                  :disabled="photoUploading"
                  @click="handleDeletePhoto"
                >
                  Remove photo
                </button>
              </div>
              <input ref="photoInput" type="file" accept="image/*" class="hidden-input" @change="handlePhotoChange" />
            </div>
            <div class="acct-banner-body">
              <p v-if="photoError" class="field-error" style="margin-bottom:8px;">{{ photoError }}</p>
              <div class="acct-name-row">
                <h2 class="acct-display-name">{{ displayName }}</h2>
                <span class="acct-tier">★ Member</span>
              </div>
              <div class="acct-meta">
                <span>{{ jwtUser?.email }}</span>
                <template v-if="memberSince">
                  <span class="acct-meta-dot">·</span>
                  <span>Member since {{ memberSince }}</span>
                </template>
              </div>

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

          <!-- Edit profile -->
          <div class="acct-card">
            <div class="acct-card-head">
              <h3 class="acct-card-title">Personal information</h3>
            </div>

            <div v-if="profileLoading" class="acct-state">
              <div class="spinner" />
            </div>

            <form v-else @submit.prevent="saveProfile">
              <div class="acct-fields">
                <div class="acct-field">
                  <label>First name</label>
                  <input v-model="editForm.firstName" placeholder="First name" />
                </div>
                <div class="acct-field">
                  <label>Last name</label>
                  <input v-model="editForm.lastName" placeholder="Last name" />
                </div>
                <div class="acct-field">
                  <label>Date of birth</label>
                  <input v-model="editForm.dob" type="date" />
                </div>
                <div class="acct-field">
                  <label>Gender</label>
                  <select v-model="editForm.gender" class="acct-select">
                    <option value="">Prefer not to say</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div class="acct-field">
                  <label>Phone</label>
                  <input v-model="editForm.phone" placeholder="+628123456789" />
                </div>
              </div>

              <p v-if="saveError" class="field-error" style="margin-top:12px;">{{ saveError }}</p>
              <div class="acct-form-actions">
                <button type="submit" class="btn-primary" :disabled="saving">
                  {{ saving ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </form>
          </div>

        </template>

        <!-- ── Account section ── -->
        <template v-else-if="section === 'account'">
          <div class="acct-card">
            <div class="acct-card-head">
              <h3 class="acct-card-title">Account information</h3>
            </div>
            <div class="acct-fields">
              <div class="acct-field">
                <label>Username</label>
                <input :value="profile?.username" readonly />
              </div>
              <div class="acct-field">
                <label>Email</label>
                <input :value="profile?.email" readonly />
              </div>
            </div>
            <div class="acct-form-actions" style="margin-top:18px;">
              <button type="button" class="btn-outline" @click="router.push('/forgot-password')">
                Reset password
              </button>
            </div>
          </div>
        </template>

        <!-- ── Orders section ── -->
        <template v-else-if="section === 'orders'">
          <div class="acct-card">
            <div class="acct-card-head">
              <h3 class="acct-card-title">My Orders</h3>
              <button class="btn-ghost" style="font-size:12px; padding:6px 12px;" @click="router.push('/orders')">View all</button>
            </div>

            <div v-if="ordersLoading" class="acct-state"><div class="spinner" /></div>

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

        <!-- ── Addresses section ── -->
        <template v-else-if="section === 'addresses'">
          <div class="acct-card">
            <div class="acct-card-head">
              <h3 class="acct-card-title">Delivery Addresses</h3>
              <button class="btn-outline" style="font-size:12px; padding:6px 14px;" @click="openAddForm" :disabled="showAddForm">
                + Add new
              </button>
            </div>

            <div v-if="addrLoading" class="acct-state"><div class="spinner" /></div>

            <template v-else>
              <!-- Address list -->
              <div v-if="addrList.length" class="addr-list">
                <template v-for="addr in addrList" :key="addr.id">
                  <!-- View mode -->
                  <div v-if="editingId !== addr.id" class="addr-card">
                    <div class="addr-card-body">
                      <div class="addr-card-label-row">
                        <span v-if="addr.label" class="addr-card-label">{{ addr.label }}</span>
                        <span v-if="addr.isDefault" class="addr-default-badge">Default</span>
                      </div>
                      <p class="addr-card-line">{{ formatAddress(addr) }}</p>
                    </div>
                    <div class="addr-card-actions">
                      <button v-if="!addr.isDefault" class="addr-action-btn" @click="doSetDefault(addr.id)">Set default</button>
                      <button class="addr-action-btn" @click="startEdit(addr)">Edit</button>
                      <button class="addr-action-btn addr-action-btn--danger" @click="doDelete(addr.id)">Delete</button>
                    </div>
                  </div>

                  <!-- Inline edit form -->
                  <div v-else class="addr-form-box">
                    <p class="addr-form-title">Edit address</p>
                    <div class="acct-fields" style="margin-bottom:12px;">
                      <div class="acct-field">
                        <label>Label (optional)</label>
                        <input v-model="addrForm.label" placeholder="Home, Office…" />
                      </div>
                      <div class="acct-field acct-field--full">
                        <label>Street *</label>
                        <input v-model="addrForm.street" placeholder="Street address" />
                      </div>
                      <div class="acct-field">
                        <label>District</label>
                        <input v-model="addrForm.district" placeholder="District" />
                      </div>
                      <div class="acct-field">
                        <label>Subdistrict</label>
                        <input v-model="addrForm.subdistrict" placeholder="Subdistrict" />
                      </div>
                      <div class="acct-field">
                        <label>City *</label>
                        <input v-model="addrForm.city" placeholder="City" />
                      </div>
                      <div class="acct-field">
                        <label>Province *</label>
                        <input v-model="addrForm.province" placeholder="Province" />
                      </div>
                      <div class="acct-field">
                        <label>Postal code</label>
                        <input v-model="addrForm.postalCode" placeholder="12345" />
                      </div>
                      <div class="acct-field">
                        <label>Country</label>
                        <input v-model="addrForm.country" placeholder="Indonesia" />
                      </div>
                    </div>
                    <label class="addr-default-check">
                      <input type="checkbox" v-model="addrForm.isDefault" /> Set as default
                    </label>
                    <p v-if="addrError" class="field-error" style="margin-top:8px;">{{ addrError }}</p>
                    <div class="addr-form-actions">
                      <button class="btn-ghost" @click="cancelAddrForm">Cancel</button>
                      <button class="btn-primary" :disabled="addrSaving || !addrForm.street || !addrForm.city || !addrForm.province" @click="submitAddrForm">
                        {{ addrSaving ? 'Saving…' : 'Save' }}
                      </button>
                    </div>
                  </div>
                </template>
              </div>

              <div v-else-if="!showAddForm" class="acct-state">
                <p>No addresses saved yet.</p>
              </div>

              <!-- Add form -->
              <div v-if="showAddForm" class="addr-form-box" :style="addrList.length ? 'margin-top:16px;' : ''">
                <p class="addr-form-title">New address</p>
                <div class="acct-fields" style="margin-bottom:12px;">
                  <div class="acct-field">
                    <label>Label (optional)</label>
                    <input v-model="addrForm.label" placeholder="Home, Office…" />
                  </div>
                  <div class="acct-field acct-field--full">
                    <label>Street *</label>
                    <input v-model="addrForm.street" placeholder="Street address" />
                  </div>
                  <div class="acct-field">
                    <label>District</label>
                    <input v-model="addrForm.district" placeholder="District" />
                  </div>
                  <div class="acct-field">
                    <label>Subdistrict</label>
                    <input v-model="addrForm.subdistrict" placeholder="Subdistrict" />
                  </div>
                  <div class="acct-field">
                    <label>City *</label>
                    <input v-model="addrForm.city" placeholder="City" />
                  </div>
                  <div class="acct-field">
                    <label>Province *</label>
                    <input v-model="addrForm.province" placeholder="Province" />
                  </div>
                  <div class="acct-field">
                    <label>Postal code</label>
                    <input v-model="addrForm.postalCode" placeholder="12345" />
                  </div>
                  <div class="acct-field">
                    <label>Country</label>
                    <input v-model="addrForm.country" placeholder="Indonesia" />
                  </div>
                </div>
                <label class="addr-default-check">
                  <input type="checkbox" v-model="addrForm.isDefault" /> Set as default
                </label>
                <p v-if="addrError" class="field-error" style="margin-top:8px;">{{ addrError }}</p>
                <div class="addr-form-actions">
                  <button class="btn-ghost" @click="cancelAddrForm">Cancel</button>
                  <button class="btn-primary" :disabled="addrSaving || !addrForm.street || !addrForm.city || !addrForm.province" @click="submitAddrForm">
                    {{ addrSaving ? 'Saving…' : 'Add address' }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </template>

        <!-- ── Wishlist section ── -->
        <template v-else-if="section === 'wishlist'">
          <div class="acct-card">
            <div class="acct-card-head">
              <h3 class="acct-card-title">Wishlist</h3>
              <span class="acct-card-count" v-if="!wishlistLoading">{{ wishlistItems.length }} saved</span>
            </div>

            <div v-if="wishlistLoading" class="acct-state"><div class="spinner" /></div>

            <div v-else-if="!wishlistItems.length" class="acct-state">
              <p>Nothing saved yet.</p>
              <button class="btn-outline" style="margin-top:12px;" @click="router.push('/')">Browse products</button>
            </div>

            <div v-else class="wl-list">
              <div v-for="item in wishlistItems" :key="item.id" class="wl-row">
                <div class="wl-img-wrap">
                  <img
                    v-if="wishlistSkuMap.get(item.skuId)?.product?.images?.find(i => i.colorId === wishlistSkuMap.get(item.skuId)!.colorId)?.imageUrl"
                    :src="wishlistSkuMap.get(item.skuId)!.product!.images!.find(i => i.colorId === wishlistSkuMap.get(item.skuId)!.colorId)!.imageUrl"
                    class="wl-img"
                  />
                  <div v-else class="wl-img" :style="{ background: wishlistSkuMap.get(item.skuId)?.color?.hex ?? 'var(--line)' }" />
                </div>
                <div class="wl-info">
                  <p class="wl-name">{{ wishlistSkuMap.get(item.skuId)?.product?.name ?? item.skuId.slice(0, 8) + '…' }}</p>
                  <p class="wl-meta">
                    <span v-if="wishlistSkuMap.get(item.skuId)?.skuCode">{{ wishlistSkuMap.get(item.skuId)?.skuCode }}</span>
                    <span v-if="wishlistSkuMap.get(item.skuId)?.size"> · {{ wishlistSkuMap.get(item.skuId)?.size?.name }}</span>
                  </p>
                  <p class="wl-price">{{ wishlistSkuMap.get(item.skuId) ? formatPrice(Number(wishlistSkuMap.get(item.skuId)!.price)) : '—' }}</p>
                </div>
                <div class="wl-actions">
                  <button
                    class="btn-primary"
                    style="font-size:12px; padding:7px 14px;"
                    @click="router.push(`/products/${wishlistSkuMap.get(item.skuId)?.product?.id ?? ''}`)"
                  >
                    View
                  </button>
                  <button class="wl-remove-btn" @click="toggleWishlist(item.skuId)">Remove</button>
                </div>
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
  overflow: hidden;
}
.acct-avatar img { width: 100%; height: 100%; object-fit: cover; }
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
.acct-banner-avatar-wrap {
  position: absolute; left: 24px; bottom: -40px;
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
}
.acct-banner-avatar {
  width: 72px; height: 72px; border-radius: 16px;
  background: var(--gold); color: #FAF8F4;
  font-family: var(--serif); font-size: 28px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 4px solid var(--surface);
  box-shadow: 0 8px 24px rgba(22,20,15,.18);
  position: relative; overflow: hidden; cursor: pointer;
}
.acct-banner-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.45); opacity: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; transition: opacity .18s;
}
.acct-banner-avatar:hover .avatar-overlay { opacity: 1; }
.acct-banner-avatar.is-uploading .avatar-overlay { opacity: 1; }
.avatar-spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.photo-remove-btn {
  font-size: 10px; color: var(--warn); background: none; border: none;
  cursor: pointer; padding: 0; font-family: var(--sans);
  white-space: nowrap;
}
.photo-remove-btn:hover { text-decoration: underline; }
.photo-remove-btn:disabled { opacity: .5; cursor: default; }

.hidden-input { display: none; }

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
.acct-field--full { grid-column: 1 / -1; }
.acct-field label { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
.acct-field input, .acct-select {
  height: 40px; padding: 0 12px;
  background: var(--line-2); border: 1px solid var(--line);
  border-radius: 9px; font-size: 13px; color: var(--ink);
  font-family: var(--sans); width: 100%; box-sizing: border-box;
}
.acct-field input:focus, .acct-select:focus {
  outline: none; border-color: var(--ink-3);
}
.acct-field input[readonly] { cursor: default; }
.acct-select { cursor: pointer; }

.acct-section-label {
  font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-3); margin: 20px 0 12px;
}

.field-error { font-size: 12px; color: var(--warn); margin: 0; }

.acct-form-actions { display: flex; justify-content: flex-end; margin-top: 20px; }

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

/* Wishlist */
.wl-list { display: flex; flex-direction: column; }
.wl-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
.wl-row:last-child { border-bottom: none; }
.wl-img { width: 56px; height: 56px; object-fit: cover; border-radius: 10px; border: 1px solid var(--line); display: block; flex-shrink: 0; }
.wl-info { flex: 1; min-width: 0; }
.wl-name { font-size: 14px; font-weight: 500; color: var(--ink); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wl-meta { font-size: 12px; color: var(--ink-3); margin: 0 0 4px; }
.wl-price { font-size: 13px; font-weight: 600; color: var(--ink-2); margin: 0; }
.wl-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.wl-remove-btn { font-size: 11px; color: var(--ink-3); background: none; border: none; cursor: pointer; font-family: var(--sans); padding: 2px 6px; border-radius: 6px; }
.wl-remove-btn:hover { color: var(--warn); }

/* Security */
.acct-security-note { font-size: 14px; color: var(--ink-3); margin: 0 0 20px; line-height: 1.6; }

/* Addresses */
.addr-list { display: flex; flex-direction: column; gap: 12px; }
.addr-card {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  padding: 14px 16px; border: 1.5px solid var(--line); border-radius: 12px;
}
.addr-card-body { flex: 1; min-width: 0; }
.addr-card-label-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.addr-card-label { font-weight: 600; font-size: 14px; color: var(--ink); }
.addr-default-badge {
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px;
  background: var(--line-2); color: var(--ink-3); border: 1px solid var(--line);
}
.addr-card-line { font-size: 13px; color: var(--ink-2); margin: 0; line-height: 1.5; }
.addr-card-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.addr-action-btn {
  font-size: 12px; color: var(--ink-3); background: none; border: none; cursor: pointer;
  padding: 2px 6px; border-radius: 6px; font-family: var(--sans); white-space: nowrap; transition: color .14s;
}
.addr-action-btn:hover { color: var(--ink); background: var(--line-2); }
.addr-action-btn--danger:hover { color: var(--warn); background: rgba(180,61,61,.06); }
.addr-form-box {
  padding: 18px; background: var(--line-2); border-radius: 12px; border: 1.5px solid var(--line);
}
.addr-form-title { font-size: 13px; font-weight: 600; color: var(--ink); margin: 0 0 14px; }
.addr-default-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-2); cursor: pointer; }
.addr-form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; }
</style>
