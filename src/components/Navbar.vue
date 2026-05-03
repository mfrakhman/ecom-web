<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { clearToken, getToken } from '../services/auth'
import { useCart, openCartDrawer } from '../composables/useCart'
import { safeFetch } from '../services/http'
import type { CategoryRef, GenderRef, CategoryGroupRef } from '../services/products'

const router = useRouter()
const search = ref('')
const showCategory = ref(false)
const showUser = ref(false)

const { count, fetchCart, reset } = useCart()
const isLoggedIn = computed(() => !!getToken())

const hoveredGender = ref<GenderRef | null>(null)
const hoveredGroup  = ref<CategoryGroupRef | null>(null)

const genders        = ref<GenderRef[]>([])
const categoryGroups = ref<CategoryGroupRef[]>([])
const categories     = ref<CategoryRef[]>([])

const visibleGroups = computed(() => {
  if (!hoveredGender.value) return []
  const gId = hoveredGender.value.id
  const groupIds = new Set(categories.value.filter(c => c.genderId === gId).map(c => c.groupId))
  return categoryGroups.value
    .filter(g => groupIds.has(g.id))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
})

const visibleCategories = computed(() => {
  if (!hoveredGender.value || !hoveredGroup.value) return []
  return categories.value
    .filter(c => c.genderId === hoveredGender.value!.id && c.groupId === hoveredGroup.value!.id)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
})

onMounted(async () => {
  if (isLoggedIn.value) fetchCart()
  try {
    const BASE = (import.meta.env.VITE_API_URL as string) || '/api'
    const [gRes, grpRes, cRes] = await Promise.all([
      safeFetch(`${BASE}/genders`).then(r => r.json()),
      safeFetch(`${BASE}/category-groups`).then(r => r.json()),
      safeFetch(`${BASE}/categories`).then(r => r.json()),
    ])
    genders.value = (gRes.data ?? gRes).sort((a: GenderRef, b: GenderRef) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    categoryGroups.value = grpRes.data ?? grpRes
    categories.value = cRes.data ?? cRes
  } catch {
    // non-critical
  }
})

function closeMenu() {
  showCategory.value = false
  hoveredGender.value = null
  hoveredGroup.value  = null
}

function submitSearch() {
  const q = search.value.trim()
  router.push({ path: '/', query: q ? { q } : {} })
  search.value = ''
}

function selectCategory(slug: string) {
  router.push({ path: '/', query: slug ? { category: slug } : {} })
  closeMenu()
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

          <div class="nav-dropdown-wrap" @mouseenter="showCategory = true" @mouseleave="closeMenu">
            <button class="nav-link nav-dropdown-btn">
              Category
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <div v-if="showCategory" class="dropdown-mega">
              <!-- Col 1: Genders -->
              <div class="mega-col">
                <button class="dropdown-item" @click="selectCategory('')">All Products</button>
                <div class="dropdown-divider" />
                <button
                  v-for="g in genders"
                  :key="g.id"
                  class="dropdown-item dropdown-item--arrow"
                  :class="{ 'dropdown-item--active': hoveredGender?.id === g.id }"
                  @mouseenter="hoveredGender = g; hoveredGroup = null"
                  @click="selectCategory(g.slug)"
                >
                  {{ g.name }}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>

              <!-- Col 2: Groups -->
              <div v-if="hoveredGender" class="mega-col mega-col--border">
                <div class="mega-col-label">{{ hoveredGender.name }}</div>
                <button
                  v-for="grp in visibleGroups"
                  :key="grp.id"
                  class="dropdown-item dropdown-item--arrow"
                  :class="{ 'dropdown-item--active': hoveredGroup?.id === grp.id }"
                  @mouseenter="hoveredGroup = grp"
                >
                  {{ grp.name }}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>

              <!-- Col 3: Leaf categories -->
              <div v-if="hoveredGroup" class="mega-col mega-col--border">
                <div class="mega-col-label">{{ hoveredGroup.name }}</div>
                <button
                  v-for="cat in visibleCategories"
                  :key="cat.id"
                  class="dropdown-item"
                  @click="selectCategory(cat.slug)"
                >
                  {{ cat.name }}
                </button>
              </div>
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
.dropdown-mega {
  position: absolute; top: 100%; left: 0;
  display: flex;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 12px; overflow: hidden;
  box-shadow: var(--shadow-md); z-index: 20;
}
.mega-col { padding: 6px; min-width: 160px; }
.mega-col--border { border-left: 1px solid var(--line); }
.mega-col-label {
  padding: 6px 12px 4px;
  font-size: 11px; font-weight: 700; letter-spacing: .6px;
  text-transform: uppercase; color: var(--ink-3);
}
.dropdown-menu {
  position: absolute; top: 100%; left: auto; right: 0;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 12px; padding: 6px; min-width: 180px;
  box-shadow: var(--shadow-md); z-index: 20;
}
.dropdown-item {
  display: block; width: 100%; text-align: left; padding: 9px 12px;
  font-size: 14px; font-weight: 500; color: var(--ink-2);
  background: none; border: none; border-radius: 8px; cursor: pointer;
  font-family: var(--sans); text-decoration: none; transition: background .12s, color .12s;
}
.dropdown-item:hover, .dropdown-item--active { background: var(--line-2); color: var(--ink); }
.dropdown-item--danger { color: var(--warn); }
.dropdown-item--danger:hover { background: rgba(180,61,61,.08); color: var(--warn); }
.dropdown-item--arrow { display: flex; align-items: center; justify-content: space-between; }
.dropdown-divider { height: 1px; background: var(--line); margin: 4px 6px; }
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
