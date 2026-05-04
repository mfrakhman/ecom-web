import { ref, computed } from 'vue'
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, checkout, type Cart } from '../services/cart'

const cart = ref<Cart | null>(null)
const loading = ref(false)

export const drawerOpen = ref(false)
export function openCartDrawer() { drawerOpen.value = true }
export function closeCartDrawer() { drawerOpen.value = false }

export function useCart() {
  const count = computed(() =>
    cart.value?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  )

  async function fetchCart() {
    loading.value = true
    try {
      cart.value = await getCart()
    } catch {
      cart.value = null
    } finally {
      loading.value = false
    }
  }

  async function addItem(skuId: string, quantity = 1) {
    cart.value = await addToCart(skuId, quantity)
  }

  async function updateItem(skuId: string, quantity: number) {
    cart.value = await updateCartItem(skuId, quantity)
  }

  async function removeItem(skuId: string) {
    cart.value = await removeFromCart(skuId)
  }

  async function clear() {
    await clearCart()
    cart.value = await getCart()
  }

  async function doCheckout(deliveryAddress?: Record<string, any>) {
    return checkout(deliveryAddress)
  }

  function reset() {
    cart.value = null
  }

  return { cart, count, loading, fetchCart, addItem, updateItem, removeItem, clear, doCheckout, reset }
}
