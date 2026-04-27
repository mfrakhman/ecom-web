<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Product, SkuInfo, ColorRef } from '../services/products'
import { getProductSkus } from '../services/products'

const props = defineProps<{ product: Product }>()
const router = useRouter()

const hovered = ref(false)
const hasFetched = ref(false)
const skus = ref<SkuInfo[]>([])
const loadingSkus = ref(false)
const selectedColor = ref<ColorRef | null>(null)

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(price)
}

const activeSkus = computed(() => skus.value.filter(s => s.isActive))

const uniqueColors = computed(() => {
  const seen = new Set<string>()
  return activeSkus.value
    .filter(s => { if (seen.has(s.colorId)) return false; seen.add(s.colorId); return true })
    .map(s => s.color)
})

const sizesForColor = computed(() =>
  selectedColor.value
    ? activeSkus.value
        .filter(s => s.colorId === selectedColor.value!.id)
        .map(s => ({ size: s.size?.name ?? '—', inStock: (s.stock?.amount ?? 0) > 0 }))
    : []
)

const minPrice = computed(() => {
  const prices = activeSkus.value.map(s => Number(s.price))
  return prices.length ? Math.min(...prices) : null
})

const displayImageUrl = computed(() => {
  if (selectedColor.value) {
    const img = props.product.images?.find(i => i.colorId === selectedColor.value!.id)
    if (img) return img.imageUrl
  }
  return props.product.images?.[0]?.imageUrl ?? null
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
    <div class="product-card-img" :style="displayImageUrl ? {} : { background: 'var(--border)' }">
      <img v-if="displayImageUrl" :src="displayImageUrl" :alt="product.name" class="product-card-img-photo" />
      <span v-else class="product-card-category">
        {{ product.category?.name ?? '—' }}
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

    <!-- Hover drawer -->
    <Transition name="sku-drawer">
      <div v-if="hovered" class="product-card-drawer">
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
                :key="color.id"
                class="color-dot"
                :class="{ active: selectedColor?.id === color.id }"
                :style="{ background: color.hex }"
                :title="color.name"
                @click.stop="selectedColor = selectedColor?.id === color.id ? null : color"
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
