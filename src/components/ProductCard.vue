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
  <div class="pc" @mouseenter="onHover" @mouseleave="hovered = false" @click="router.push(`/products/${product.id}`)">
    <!-- Image -->
    <div class="pc-img">
      <img v-if="displayImageUrl" :src="displayImageUrl" :alt="product.name" class="pc-img-photo" />
      <span v-else class="pc-img-placeholder">{{ product.category?.name ?? '—' }}</span>
    </div>

    <!-- Info -->
    <div class="pc-body">
      <p class="pc-category">{{ product.category?.name ?? '' }}</p>
      <h3 class="pc-name">{{ product.name }}</h3>
      <p v-if="minPrice !== null" class="pc-price">{{ formatPrice(minPrice) }}</p>
      <p v-else class="pc-price pc-price--empty">&nbsp;</p>
    </div>

    <!-- Hover drawer -->
    <Transition name="sku-drawer">
      <div v-if="hovered" class="pc-drawer" @click.stop>
        <div v-if="loadingSkus" class="sku-loading">
          <span v-for="i in 4" :key="i" class="sku-dot-skeleton" />
        </div>

        <template v-else-if="activeSkus.length > 0">
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

          <div v-if="sizesForColor.length" class="sku-sizes">
            <span
              v-for="s in sizesForColor"
              :key="s.size"
              class="size-pill"
              :class="{ 'size-pill--oos': !s.inStock }"
            >{{ s.size }}</span>
          </div>

          <button class="pc-cta" @click.stop="router.push(`/products/${product.id}`)">
            View Details
          </button>
        </template>

        <template v-else>
          <p class="sku-empty">No variants available</p>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pc {
  position: relative; background: var(--surface); border: 1px solid var(--line);
  border-radius: 14px; overflow: hidden; cursor: pointer;
  display: flex; flex-direction: column;
  transition: box-shadow .2s, transform .2s;
}
.pc:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.pc-img { aspect-ratio: 3/4; background: var(--line-2); position: relative; overflow: hidden; flex-shrink: 0; }
.pc-img-photo { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s ease; }
.pc:hover .pc-img-photo { transform: scale(1.04); }
.pc-img-placeholder {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 500; color: var(--ink-3);
  letter-spacing: .5px; text-transform: uppercase;
}
.pc-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.pc-category { font-size: 11px; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; color: var(--ink-3); margin: 0; }
.pc-name { font-family: var(--serif); font-size: 15px; font-weight: 400; color: var(--ink); margin: 0; line-height: 1.3; }
.pc-price { font-size: 13px; font-weight: 600; color: var(--ink-2); margin: 4px 0 0; }
.pc-price--empty { visibility: hidden; }
.pc-drawer {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(250,248,244,.97); backdrop-filter: blur(4px);
  border-top: 1px solid var(--line); padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.pc-cta {
  display: block; width: 100%; padding: 9px;
  background: var(--ink); color: #FAF8F4;
  border: none; border-radius: 999px;
  font-size: 13px; font-weight: 600; font-family: var(--sans);
  cursor: pointer; transition: background .15s; margin-top: 2px;
}
.pc-cta:hover { background: #2e2a21; }
.sku-loading { display: flex; gap: 6px; align-items: center; padding: 4px 0; }
.sku-dot-skeleton {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--line); animation: sku-pulse 1.2s ease-in-out infinite;
}
.sku-dot-skeleton:nth-child(2) { animation-delay: .15s; }
.sku-dot-skeleton:nth-child(3) { animation-delay: .30s; }
.sku-dot-skeleton:nth-child(4) { animation-delay: .45s; }
@keyframes sku-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.sku-empty { font-size: 12px; color: var(--ink-3); margin: 0; }
.sku-colors { display: flex; gap: 6px; flex-wrap: wrap; }
.color-dot {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid transparent; outline: none; cursor: pointer; padding: 0;
  box-shadow: 0 0 0 1px rgba(22,20,15,.18);
  transition: transform .15s, box-shadow .15s; flex-shrink: 0;
}
.color-dot:hover { transform: scale(1.2); }
.color-dot.active { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--ink); transform: scale(1.15); }
.sku-sizes { display: flex; gap: 4px; flex-wrap: wrap; }
.size-pill {
  padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600;
  background: var(--gold-bg); color: var(--gold); border: 1px solid var(--gold-border);
}
.size-pill--oos { background: var(--line-2); color: var(--ink-3); border-color: var(--line); text-decoration: line-through; opacity: .5; }
</style>

<style>
/* Transition — must be global; Vue applies these classes without the scoped attribute */
.sku-drawer-enter-active { transition: transform .22s ease, opacity .18s ease; }
.sku-drawer-leave-active { transition: transform .16s ease, opacity .14s ease; }
.sku-drawer-enter-from, .sku-drawer-leave-to { transform: translateY(100%); opacity: 0; }
</style>
