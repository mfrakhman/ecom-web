<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import {
  getProduct, createSku, updateSku, restockSku,
  getColors, getSizes, uploadColorImage, deleteColorImage,
  type ProductDetail, type ColorRef, type SizeRef, type CreateSkuPayload, type UpdateSkuPayload, type ProductColorImage,
} from '../../services/admin'
import type { SkuInfo } from '../../services/products'

const route = useRoute()
const id = route.params.id as string

const product = ref<ProductDetail | null>(null)
const skus = ref<SkuInfo[]>([])
const loading = ref(false)
const error = ref('')

const colors = ref<ColorRef[]>([])
const sizes = ref<SizeRef[]>([])

const showSkuModal = ref(false)
const showEditSkuModal = ref(false)
const showRestockModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const editSkuTarget = ref<SkuInfo | null>(null)
const restockTarget = ref<SkuInfo | null>(null)
const restockQty = ref(1)

const editSkuForm = ref<UpdateSkuPayload & { skuCode: string; colorId: string; price: number; isActive: boolean }>({
  skuCode: '', colorId: '', sizeId: undefined, price: 0, compareAt: undefined, isActive: true,
})

const skuForm = ref<Omit<CreateSkuPayload, 'product_id'>>({
  skuCode: '', colorId: '', sizeId: undefined,
  price: 0, compareAt: undefined, isActive: true, quantity: 0,
})

const imageUploading = ref<string | null>(null)
const imageInputs = ref<Record<string, HTMLInputElement | null>>({})

function colorImages(colorId: string): ProductColorImage[] {
  return product.value?.images?.filter(img => img.colorId === colorId) ?? []
}

const uniqueColorIds = computed(() => {
  const seen = new Set<string>()
  return skus.value.filter(s => { if (seen.has(s.colorId)) return false; seen.add(s.colorId); return true })
})

const filteredSizes = computed(() => {
  if (!product.value?.sizeGroup) return []
  return sizes.value.filter(s => s.sizeGroup === product.value!.sizeGroup)
})

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
}

async function fetchProduct() {
  loading.value = true
  error.value = ''
  try {
    const res = await getProduct(id)
    product.value = res.data
    skus.value = res.data.skus ?? []
  } catch {
    error.value = 'Failed to load product.'
  } finally {
    loading.value = false
  }
}

function openSkuModal() {
  skuForm.value = {
    skuCode: '', colorId: colors.value[0]?.id ?? '', sizeId: undefined,
    price: 0, compareAt: undefined, isActive: true, quantity: 0,
  }
  modalError.value = ''
  showSkuModal.value = true
}

async function saveSku() {
  modalError.value = ''
  saving.value = true
  try {
    await createSku({ ...skuForm.value, sizeId: skuForm.value.sizeId || undefined, product_id: id })
    showSkuModal.value = false
    await fetchProduct()
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to create SKU.'
  } finally {
    saving.value = false
  }
}

function openEditSku(sku: SkuInfo) {
  editSkuTarget.value = sku
  editSkuForm.value = {
    skuCode:   sku.skuCode,
    colorId:   sku.colorId,
    sizeId:    sku.sizeId ?? undefined,
    price:     Number(sku.price),
    compareAt: sku.compareAt ? Number(sku.compareAt) : undefined,
    isActive:  sku.isActive,
  }
  modalError.value = ''
  showEditSkuModal.value = true
}

async function saveEditSku() {
  if (!editSkuTarget.value) return
  modalError.value = ''
  saving.value = true
  try {
    await updateSku(editSkuTarget.value.id, {
      ...editSkuForm.value,
      sizeId:    editSkuForm.value.sizeId    || null,
      compareAt: editSkuForm.value.compareAt || null,
    })
    showEditSkuModal.value = false
    await fetchProduct()
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to update SKU.'
  } finally {
    saving.value = false
  }
}

function openRestock(sku: SkuInfo) {
  restockTarget.value = sku
  restockQty.value = 1
  modalError.value = ''
  showRestockModal.value = true
}

async function saveRestock() {
  if (!restockTarget.value) return
  modalError.value = ''
  saving.value = true
  try {
    await restockSku(restockTarget.value.id, restockQty.value)
    showRestockModal.value = false
    await fetchProduct()
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to restock.'
  } finally {
    saving.value = false
  }
}

function triggerImageUpload(colorId: string) {
  imageInputs.value[colorId]?.click()
}

async function onImageSelected(colorId: string, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageUploading.value = colorId
  try {
    await uploadColorImage(id, colorId, file)
    await fetchProduct()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Upload failed.')
  } finally {
    imageUploading.value = null
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function removeImage(colorId: string, imageId: string) {
  if (!confirm('Remove this image?')) return
  try {
    await deleteColorImage(id, colorId, imageId)
    await fetchProduct()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to remove image.')
  }
}

onMounted(async () => {
  const [colorRes, sizeRes] = await Promise.all([getColors(), getSizes()])
  colors.value = colorRes.data ?? []
  sizes.value = sizeRes.data ?? []
  await fetchProduct()
})
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <RouterLink to="/admin/products" class="back-link">← Back to Products</RouterLink>

      <div v-if="loading" class="admin-state">Loading…</div>
      <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>

      <template v-else-if="product">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">{{ product.name }}</h1>
            <div style="display:flex; gap:8px; margin-top:4px;">
              <span class="badge">{{ product.category?.name }}</span>
              <span v-if="product.sizeGroup" class="badge">{{ product.sizeGroup }}</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <p class="info-label">Description</p>
          <p>{{ product.description ?? '—' }}</p>
        </div>

        <!-- Color images -->
        <div style="margin-top: 24px;">
          <h2 class="admin-section-title" style="margin-bottom:12px;">Color Images</h2>
          <div v-if="uniqueColorIds.length === 0" style="color:var(--text);font-size:14px;">No SKUs yet — add a SKU first.</div>
          <div v-for="sku in uniqueColorIds" :key="sku.colorId" style="margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span
                style="width:14px;height:14px;border-radius:50%;border:1px solid var(--border);display:inline-block;"
                :style="{ background: sku.color?.hex ?? '#ccc' }"
              />
              <strong style="font-size:14px;">{{ sku.color?.name }}</strong>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
              <div v-for="img in colorImages(sku.colorId)" :key="img.id" style="position:relative;">
                <img :src="img.imageUrl" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border);" />
                <button
                  class="btn-ghost btn-xs btn-ghost--danger"
                  style="position:absolute;top:2px;right:2px;padding:2px 5px;"
                  @click="removeImage(sku.colorId, img.id)"
                >×</button>
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  style="display:none"
                  :ref="el => imageInputs[sku.colorId] = el as HTMLInputElement"
                  @change="onImageSelected(sku.colorId, $event)"
                />
                <button
                  class="btn-outline btn-sm"
                  :disabled="imageUploading === sku.colorId"
                  @click="triggerImageUpload(sku.colorId)"
                >
                  {{ imageUploading === sku.colorId ? 'Uploading…' : '+ Add Image' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SKUs -->
        <div class="admin-page-header" style="margin-top: 32px;">
          <h2 class="admin-section-title">SKUs</h2>
          <button class="btn-primary btn-sm" @click="openSkuModal">+ Add SKU</button>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Color</th>
                <th>Size</th>
                <th>Price</th>
                <th>Compare At</th>
                <th>Stock</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="skus.length === 0">
                <td colspan="8" style="text-align:center; color: var(--text);">No SKUs yet.</td>
              </tr>
              <tr v-for="sku in skus" :key="sku.id">
                <td><code style="font-size:13px;">{{ sku.skuCode }}</code></td>
                <td>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span
                      style="width:12px;height:12px;border-radius:50%;border:1px solid var(--border);flex-shrink:0;"
                      :style="{ background: sku.color?.hex }"
                    />
                    {{ sku.color?.name }}
                  </div>
                </td>
                <td>{{ sku.size?.name ?? '—' }}</td>
                <td>{{ formatPrice(Number(sku.price)) }}</td>
                <td>{{ sku.compareAt ? formatPrice(Number(sku.compareAt)) : '—' }}</td>
                <td>{{ sku.stock?.amount ?? '—' }}</td>
                <td>
                  <span class="badge" :style="sku.isActive ? 'background:rgba(16,185,129,.15);color:#059669' : 'background:var(--code-bg);color:var(--text)'">
                    {{ sku.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="btn-ghost" @click="openEditSku(sku)">Edit</button>
                    <button class="btn-ghost" @click="openRestock(sku)">Restock</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Add SKU modal -->
    <Teleport to="body">
      <div v-if="showSkuModal" class="modal-overlay" @click.self="showSkuModal = false">
        <div class="modal-box modal-box--wide">
          <h3 class="modal-title">New SKU</h3>
          <p v-if="modalError" class="auth-error">{{ modalError }}</p>

          <form class="modal-form" @submit.prevent="saveSku">
            <div class="modal-grid">
              <div class="field">
                <label>SKU Code</label>
                <input v-model="skuForm.skuCode" type="text" placeholder="e.g. COAT-001-BLK-M" required />
              </div>
              <div class="field">
                <label>Color</label>
                <select v-model="skuForm.colorId" required>
                  <option value="" disabled>Select color</option>
                  <option v-for="c in colors" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="field" v-if="filteredSizes.length > 0">
                <label>Size</label>
                <select v-model="skuForm.sizeId">
                  <option value="">None</option>
                  <option v-for="s in filteredSizes" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="field">
                <label>Price (IDR)</label>
                <input v-model.number="skuForm.price" type="number" min="0" required />
              </div>
              <div class="field">
                <label>Compare At (IDR)</label>
                <input v-model.number="skuForm.compareAt" type="number" min="0" placeholder="Optional" />
              </div>
              <div class="field">
                <label>Initial Stock</label>
                <input v-model.number="skuForm.quantity" type="number" min="1" required />
              </div>
            </div>

            <label class="checkbox-label">
              <input type="checkbox" v-model="skuForm.isActive" />
              <span>Active (visible to customers)</span>
            </label>

            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="showSkuModal = false">Cancel</button>
              <button type="submit" class="btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Creating…' : 'Create SKU' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Edit SKU modal -->
    <Teleport to="body">
      <div v-if="showEditSkuModal" class="modal-overlay" @click.self="showEditSkuModal = false">
        <div class="modal-box modal-box--wide">
          <h3 class="modal-title">Edit SKU</h3>
          <p v-if="modalError" class="auth-error">{{ modalError }}</p>

          <form class="modal-form" @submit.prevent="saveEditSku">
            <div class="modal-grid">
              <div class="field">
                <label>SKU Code</label>
                <input v-model="editSkuForm.skuCode" type="text" required />
              </div>
              <div class="field">
                <label>Color</label>
                <select v-model="editSkuForm.colorId" required>
                  <option v-for="c in colors" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="field" v-if="filteredSizes.length > 0">
                <label>Size</label>
                <select v-model="editSkuForm.sizeId">
                  <option value="">None</option>
                  <option v-for="s in filteredSizes" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="field">
                <label>Price (IDR)</label>
                <input v-model.number="editSkuForm.price" type="number" min="0" required />
              </div>
              <div class="field">
                <label>Compare At (IDR)</label>
                <input v-model.number="editSkuForm.compareAt" type="number" min="0" placeholder="Optional" />
              </div>
            </div>

            <label class="checkbox-label">
              <input type="checkbox" v-model="editSkuForm.isActive" />
              <span>Active (visible to customers)</span>
            </label>

            <div style="background:var(--line-2); border-radius:10px; padding:12px 14px; font-size:13px; color:var(--ink-3);">
              Current stock: <strong style="color:var(--ink);">{{ editSkuTarget?.stock?.amount ?? 0 }}</strong>
              — use <em>Restock</em> to adjust quantity.
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="showEditSkuModal = false">Cancel</button>
              <button type="submit" class="btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Restock modal -->
    <Teleport to="body">
      <div v-if="showRestockModal" class="modal-overlay" @click.self="showRestockModal = false">
        <div class="modal-box">
          <h3 class="modal-title">Restock — {{ restockTarget?.skuCode }}</h3>
          <p class="modal-sub">Current stock: <strong>{{ restockTarget?.stock?.amount ?? 0 }}</strong></p>
          <p v-if="modalError" class="auth-error">{{ modalError }}</p>

          <form class="modal-form" @submit.prevent="saveRestock">
            <div class="field">
              <label>Quantity to add</label>
              <input v-model.number="restockQty" type="number" min="1" required />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="showRestockModal = false">Cancel</button>
              <button type="submit" class="btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Saving…' : 'Restock' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
