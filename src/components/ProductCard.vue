<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Product } from '../services/products'
import { getProductSkus, type SkuInfo } from '../services/products'

const props = defineProps<{ product: Product }>()
const router = useRouter()

const hovered = ref(false)
const hasFetched = ref(false)
const skus = ref<SkuInfo[]>([])
const loadingSkus = ref(false)
const selectedColor = ref<string | null>(null)

const categoryGradient: Record<string, string> = {
  BAGS:    'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  SHOES:   'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
  CLOTHES: 'linear-gradient(135deg, #aa3bff 0%, #ec4899 100%)',
  PANTS:   'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
}

const COLORS: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', black: '#1f2937',
  white: '#e5e7eb', yellow: '#eab308', purple: '#a855f7', pink: '#ec4899',
  orange: '#f97316', gray: '#9ca3af', grey: '#9ca3af', brown: '#a16207',
  navy: '#1e3a8a', beige: '#d4a574', teal: '#0d9488', maroon: '#9f1239',
  gold: '#d97706', silver: '#94a3b8', cream: '#fef3c7', olive: '#65a30d',
}

function colorToCSS(c: string) {
  return COLORS[c.toLowerCase().trim()] ?? c.toLowerCase()
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

const activeSkus = computed(() => skus.value.filter(s => s.isActive))

const uniqueColors = computed(() =>
  [...new Set(activeSkus.value.map(s => s.color).filter((c): c is string => !!c))]
)

const sizesForColor = computed(() =>
  selectedColor.value
    ? activeSkus.value
        .filter(s => s.color === selectedColor.value)
        .map(s => ({ size: s.size ?? '?', inStock: (s.stock?.amount ?? 0) > 0 }))
    : []
)

const minPrice = computed(() => {
  const prices = activeSkus.value.map(s => Number(s.price))
  return prices.length ? Math.min(...prices) : null
})

async function onHover() {
  hovered.value = true
  if (hasFetched.value) return
  loadingSkus.value = true
  try {
    skus.value = await getProductSkus(props.product.id)
    hasFetched.value = true
    if (uniqueColors.value.length > 0) selectedColor.value = uniqueColors.value[0]
  } finally {
    loadingSkus.value = false
  }
}
</script>

<template>
  <div class="product-card" @mouseenter="onHover" @mouseleave="hovered = false">
    <!-- Image -->
    <div class="product-card-img" :style="{ background: categoryGradient[product.category] }">
      <span class="product-card-category">
        {{ product.category.charAt(0) + product.category.slice(1).toLowerCase() }}
      </span>
    </div>

    <!-- Default info -->
    <div class="product-card-body">
      <h3 class="product-card-name">{{ product.name }}</h3>
      <p class="product-card-desc">{{ product.description ?? 'No description available.' }}</p>
    </div>

    <div class="product-card-footer">
      <button class="btn-outline" @click="router.push(`/products/${product.id}`)">View Details</button>
    </div>

    <!-- Hover drawer — slides up from bottom -->
    <Transition name="sku-drawer">
      <div v-if="hovered" class="product-card-drawer">
        <!-- Loading -->
        <div v-if="loadingSkus" class="sku-loading">
          <span v-for="i in 4" :key="i" class="sku-dot-skeleton" />
        </div>

        <template v-else>
          <p v-if="activeSkus.length === 0" class="sku-empty">No variants available</p>

          <template v-else>
            <!-- Color swatches -->
            <div class="sku-colors">
              <button
                v-for="color in uniqueColors"
                :key="color"
                class="color-dot"
                :class="{ active: selectedColor === color }"
                :style="{ background: colorToCSS(color) }"
                :title="color"
                @click.stop="selectedColor = selectedColor === color ? null : color"
              />
            </div>

            <!-- Sizes for selected color -->
            <div v-if="sizesForColor.length" class="sku-sizes">
              <span
                v-for="s in sizesForColor"
                :key="s.size"
                class="size-pill"
                :class="{ 'size-pill--oos': !s.inStock }"
                :title="s.inStock ? 'In stock' : 'Out of stock'"
              >{{ s.size }}</span>
            </div>

            <!-- Price -->
            <p v-if="minPrice !== null" class="sku-price">
              From <strong>{{ formatPrice(minPrice) }}</strong>
            </p>
          </template>

          <button class="btn-outline" @click="router.push(`/products/${product.id}`)">View Details</button>
        </template>
      </div>
    </Transition>
  </div>
</template>
