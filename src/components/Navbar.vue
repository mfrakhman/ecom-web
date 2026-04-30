<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { clearToken, getToken } from '../services/auth'
import { useCart, openCartDrawer } from '../composables/useCart'
import { safeFetch } from '../services/http'
import type { CategoryRef } from '../services/products'

const router = useRouter()
const search = ref('')
const showCategory = ref(false)
const showUser = ref(false)

const { count, fetchCart, reset } = useCart()
const isLoggedIn = computed(() => !!getToken())

const categories = ref<CategoryRef[]>([])
const topLevel = computed(() => categories.value.filter(c => !c.parentId))

function flattenTree(nodes: any[]): CategoryRef[] {
  const result: CategoryRef[] = []
  for (const node of nodes) {
    result.push({ id: node.id, parentId: node.parentId ?? null, name: node.name, slug: node.slug })
    if (node.children?.length) result.push(...flattenTree(node.children))
  }
  return result
}

onMounted(async () => {
  if (isLoggedIn.value) fetchCart()
  try {
    const BASE = (import.meta.env.VITE_API_URL as string) || '/api'
    const res = await safeFetch(`${BASE}/categories`)
    const json = await res.json()
    categories.value = flattenTree(json.data ?? json)
  } catch {
    // non-critical
  }
})

function submitSearch() {
  const q = search.value.trim()
  router.push({ path: '/', query: q ? { q } : {} })
  search.value = ''
}

function selectCategory(slug: string) {
  router.push({ path: '/', query: slug ? { category: slug } : {} })
  showCategory.value = false
}

function logout() {
  clearToken()
  reset()
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
              <template v-for="cat in topLevel" :key="cat.id">
                <button class="dropdown-item" style="font-weight:600;" @click="selectCategory(cat.slug)">
                  {{ cat.name }}
                </button>
                <button
                  v-for="sub in categories.filter(c => c.parentId === cat.id)"
                  :key="sub.id"
                  class="dropdown-item"
                  style="padding-left:20px;"
                  @click="selectCategory(sub.slug)"
                >
                  {{ sub.name }}
                </button>
              </template>
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
              <RouterLink to="/account" class="dropdown-item" @click="showUser = false">Profile</RouterLink>
              <RouterLink to="/orders" class="dropdown-item" @click="showUser = false">My Orders</RouterLink>
              <button class="dropdown-item dropdown-item--danger" @click="logout">Sign Out</button>
            </template>
            <template v-else>
              <RouterLink to="/login" class="dropdown-item" @click="showUser = false">Sign In</RouterLink>
              <RouterLink to="/register" class="dropdown-item" @click="showUser = false">Register</RouterLink>
            </template>
          </div>
        </div>

        <button class="nav-icon-btn nav-cart-btn" aria-label="Cart" @click="openCartDrawer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span v-if="count > 0" class="nav-cart-badge">{{ count > 99 ? '99+' : count }}</span>
        </button>
      </div>

    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(250,248,244,.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.navbar-inner {
  max-width: 1280px; margin: 0 auto; padding: 0 24px;
  height: 64px; display: flex; align-items: center; gap: 24px;
}
.navbar-left  { display: flex; align-items: center; gap: 24px; flex-shrink: 0; }
.navbar-right { display: flex; align-items: center; gap: 4px;  flex-shrink: 0; }
.nav-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.nav-logo-icon {
  width: 30px; height: 30px; background: var(--ink); color: #FAF8F4;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; font-family: var(--serif);
}
.nav-logo-text { font-family: var(--serif); font-size: 17px; font-weight: 600; color: var(--ink); letter-spacing: -.2px; }
.nav-links { display: flex; align-items: center; gap: 4px; }
.nav-link {
  padding: 6px 12px; font-size: 14px; font-weight: 500; color: var(--ink-2);
  text-decoration: none; border-radius: 8px; border: none; background: none;
  cursor: pointer; font-family: var(--sans); transition: color .15s, background .15s;
}
.nav-link:hover, .nav-link.router-link-active { color: var(--ink); background: var(--line-2); }
.nav-dropdown-btn { display: flex; align-items: center; gap: 4px; }
.nav-dropdown-wrap { position: relative; }
.nav-backdrop { position: fixed; inset: 0; z-index: 10; }
.dropdown-menu {
  position: absolute; top: calc(100% + 8px); left: 0;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 12px; padding: 6px; min-width: 180px;
  box-shadow: var(--shadow-md); z-index: 20;
}
.dropdown-menu--right { left: auto; right: 0; }
.dropdown-item {
  display: block; width: 100%; text-align: left; padding: 9px 12px;
  font-size: 14px; font-weight: 500; color: var(--ink-2);
  background: none; border: none; border-radius: 8px; cursor: pointer;
  font-family: var(--sans); text-decoration: none; transition: background .12s, color .12s;
}
.dropdown-item:hover { background: var(--line-2); color: var(--ink); }
.dropdown-item--danger { color: var(--warn); }
.dropdown-item--danger:hover { background: rgba(180,61,61,.08); color: var(--warn); }
.dropdown-label { display: block; padding: 6px 12px 4px; font-size: 11px; font-weight: 600; letter-spacing: .6px; text-transform: uppercase; color: var(--ink-3); }
.nav-search {
  flex: 1; display: flex; align-items: center; gap: 8px;
  padding: 0 14px; height: 38px; background: var(--line-2);
  border: 1.5px solid transparent; border-radius: 999px;
  transition: border-color .18s, background .18s; color: var(--ink-3);
}
.nav-search:focus-within { border-color: var(--gold); background: var(--surface); }
.nav-search input { flex: 1; background: none; border: none; outline: none; font-size: 14px; font-family: var(--sans); color: var(--ink); }
.nav-search input::placeholder { color: var(--ink-3); }
.nav-icon-btn {
  position: relative; width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px; border: none; background: none;
  color: var(--ink-2); cursor: pointer; transition: background .15s, color .15s;
}
.nav-icon-btn:hover { background: var(--line-2); color: var(--ink); }
.nav-cart-badge {
  position: absolute; top: 3px; right: 3px; min-width: 17px; height: 17px;
  padding: 0 4px; border-radius: 999px; background: var(--ink); color: #FAF8F4;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
</style>
