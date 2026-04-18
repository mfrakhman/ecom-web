<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { clearToken, getToken } from '../services/auth'
import { cartCount } from '../services/cart'

const router = useRouter()
const search = ref('')
const showCategory = ref(false)
const showUser = ref(false)
const count = ref(cartCount())

const isLoggedIn = computed(() => !!getToken())
const CATEGORIES = ['BAGS', 'SHOES', 'CLOTHES', 'PANTS']

function onCartUpdated() { count.value = cartCount() }

onMounted(() => window.addEventListener('cart-updated', onCartUpdated))
onUnmounted(() => window.removeEventListener('cart-updated', onCartUpdated))

function submitSearch() {
  const q = search.value.trim()
  router.push({ path: '/', query: q ? { q } : {} })
  search.value = ''
}

function selectCategory(cat: string) {
  router.push({ path: '/', query: cat ? { category: cat } : {} })
  showCategory.value = false
}

function logout() {
  clearToken()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-inner">

      <!-- Left: logo + nav links -->
      <div class="navbar-left">
        <RouterLink to="/" class="nav-logo">
          <span class="nav-logo-icon">R</span>
          <span class="nav-logo-text">RetailCo</span>
        </RouterLink>

        <nav class="nav-links">
          <RouterLink to="/" class="nav-link">Home</RouterLink>

          <div class="nav-dropdown-wrap">
            <button class="nav-link nav-dropdown-btn" @click="showCategory = !showCategory">
              Category
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div v-if="showCategory" class="nav-backdrop" @click="showCategory = false" />
            <div v-if="showCategory" class="dropdown-menu">
              <button class="dropdown-item" @click="selectCategory('')">All Categories</button>
              <button
                v-for="cat in CATEGORIES"
                :key="cat"
                class="dropdown-item"
                @click="selectCategory(cat)"
              >{{ cat.charAt(0) + cat.slice(1).toLowerCase() }}</button>
            </div>
          </div>
        </nav>
      </div>

      <!-- Center: search -->
      <form class="nav-search" @submit.prevent="submitSearch">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="search" type="search" placeholder="Search products…" />
      </form>

      <!-- Right: user + cart -->
      <div class="navbar-right">
        <div class="nav-dropdown-wrap">
          <button class="nav-icon-btn" @click="showUser = !showUser" :aria-label="isLoggedIn ? 'Account menu' : 'Sign in'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </button>
          <div v-if="showUser" class="nav-backdrop" @click="showUser = false" />
          <div v-if="showUser" class="dropdown-menu dropdown-menu--right">
            <template v-if="isLoggedIn">
              <span class="dropdown-label">Account</span>
              <RouterLink to="/orders" class="dropdown-item" @click="showUser = false">My Orders</RouterLink>
              <button class="dropdown-item dropdown-item--danger" @click="logout">Sign Out</button>
            </template>
            <template v-else>
              <RouterLink to="/login" class="dropdown-item" @click="showUser = false">Sign In</RouterLink>
              <RouterLink to="/register" class="dropdown-item" @click="showUser = false">Register</RouterLink>
            </template>
          </div>
        </div>

        <RouterLink to="/cart" class="nav-icon-btn nav-cart-btn" aria-label="Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span v-if="count > 0" class="nav-cart-badge">{{ count > 99 ? '99+' : count }}</span>
        </RouterLink>
      </div>

    </div>
  </header>
</template>
