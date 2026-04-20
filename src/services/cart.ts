const CART_KEY = 'cart'

export interface CartItem {
  skuId: string
  skuCode: string
  productId: string
  productName: string
  skuName: string
  color: string | null
  size: string | null
  imageUrl: string | null
  price: number
  quantity: number
}

export function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1) {
  const cart = getCart()
  const existing = cart.find(i => i.skuId === item.skuId)
  if (existing) {
    existing.quantity += qty
  } else {
    cart.push({ ...item, quantity: qty })
  }
  saveCart(cart)
  window.dispatchEvent(new Event('cart-updated'))
}

export function updateQty(skuId: string, quantity: number) {
  const cart = getCart().map(i => i.skuId === skuId ? { ...i, quantity } : i)
  saveCart(cart)
  window.dispatchEvent(new Event('cart-updated'))
}

export function removeFromCart(skuId: string) {
  saveCart(getCart().filter(i => i.skuId !== skuId))
  window.dispatchEvent(new Event('cart-updated'))
}

export function clearCart() {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cart-updated'))
}

export function cartCount(): number {
  return getCart().reduce((sum, i) => sum + i.quantity, 0)
}
