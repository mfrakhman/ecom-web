import { ref, computed } from 'vue'
import { getWishlist, addToWishlist, removeFromWishlist, type WishlistItem } from '../services/wishlist'
import { getUser } from '../services/auth'

const items = ref<WishlistItem[]>([])
const loaded = ref(false)

export function useWishlist() {
  const isLoggedIn = computed(() => !!getUser())

  const skuIds = computed(() => new Set(items.value.map(i => i.skuId)))

  function isWishlisted(skuId: string) {
    return skuIds.value.has(skuId)
  }

  async function load() {
    if (loaded.value || !isLoggedIn.value) return
    await reload()
  }

  async function reload() {
    if (!isLoggedIn.value) return
    try {
      items.value = await getWishlist()
      loaded.value = true
    } catch {}
  }

  async function toggle(skuId: string) {
    if (!isLoggedIn.value) return
    if (isWishlisted(skuId)) {
      items.value = items.value.filter(i => i.skuId !== skuId)
      try { await removeFromWishlist(skuId) } catch {
        items.value = await getWishlist()
      }
    } else {
      const optimistic = { id: '', userId: '', skuId, convertedAt: null, convertedOrderId: null, createdAt: new Date().toISOString() }
      items.value = [...items.value, optimistic]
      try {
        const saved = await addToWishlist(skuId)
        items.value = items.value.map(i => i.skuId === skuId ? saved : i)
      } catch {
        items.value = items.value.filter(i => i.skuId !== skuId)
      }
    }
  }

  function reset() {
    items.value = []
    loaded.value = false
  }

  return { items, isWishlisted, load, reload, toggle, reset }
}
