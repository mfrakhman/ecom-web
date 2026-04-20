<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import {
  getProduct, createSku, restockSku,
  uploadProductImage, deleteProductImage,
  uploadSkuImage, deleteSkuImage,
  type ProductDetail, type CreateSkuPayload,
} from '../../services/admin'
import { type SkuInfo } from '../../services/products'

const route = useRoute()
const id = route.params.id as string

const product = ref<ProductDetail | null>(null)
const skus = ref<SkuInfo[]>([])
const loading = ref(false)
const error = ref('')

const showSkuModal = ref(false)
const showRestockModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const restockTarget = ref<SkuInfo | null>(null)
const restockQty = ref(1)

const skuForm = ref<CreateSkuPayload>({
  name: '', description: '', skuCode: '', size: '', color: '',
  price: 0, isActive: true, product_id: id, quantity: 0,
})

const productImageInput = ref<HTMLInputElement | null>(null)
const productImageUploading = ref(false)
const skuImageInputs = ref<Record<string, HTMLInputElement | null>>({})
const skuImageUploading = ref<string | null>(null)

async function fetchProduct() {
  loading.value = true
  error.value = ''
  try {
    const productRes = await getProduct(id)
    product.value = productRes.data
    skus.value = productRes.data.skus ?? []
  } catch {
    error.value = 'Failed to load product.'
  } finally {
    loading.value = false
  }
}

function openSkuModal() {
  skuForm.value = {
    name: '', description: '', skuCode: '', size: '', color: '',
    price: 0, isActive: true, product_id: id, quantity: 0,
  }
  modalError.value = ''
  showSkuModal.value = true
}

async function saveSku() {
  modalError.value = ''
  saving.value = true
  try {
    await createSku(skuForm.value)
    showSkuModal.value = false
    await fetchProduct()
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to create SKU.'
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

async function onProductImageSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  productImageUploading.value = true
  try {
    await uploadProductImage(id, file)
    await fetchProduct()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Upload failed.')
  } finally {
    productImageUploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function removeProductImage() {
  if (!confirm('Remove product image?')) return
  try {
    await deleteProductImage(id)
    await fetchProduct()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to remove image.')
  }
}

function triggerSkuImageUpload(skuId: string) {
  skuImageInputs.value[skuId]?.click()
}

async function onSkuImageSelected(sku: SkuInfo, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  skuImageUploading.value = sku.id
  try {
    await uploadSkuImage(sku.id, file)
    await fetchProduct()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Upload failed.')
  } finally {
    skuImageUploading.value = null
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function removeSkuImage(sku: SkuInfo) {
  if (!confirm(`Remove image for SKU "${sku.skuCode}"?`)) return
  try {
    await deleteSkuImage(sku.id)
    await fetchProduct()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to remove image.')
  }
}

onMounted(fetchProduct)
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <RouterLink to="/admin/products" class="back-link">← Back to Products</RouterLink>

      <div v-if="loading" class="admin-state">Loading…</div>
      <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>

      <template v-else-if="product">
        <!-- Product info -->
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">{{ product.name }}</h1>
            <div style="display:flex; gap:8px; margin-top:4px;">
              <span class="badge" :data-cat="product.category">{{ product.category }}</span>
            </div>
          </div>
        </div>

        <!-- Product image management -->
        <div class="admin-product-image-section">
          <div class="admin-product-image-wrap">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="admin-product-image" />
            <div v-else class="admin-product-image admin-product-image--empty">No image</div>
          </div>
          <div class="admin-img-actions" style="flex-direction: row; margin-top: 8px;">
            <input
              ref="productImageInput"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onProductImageSelected"
            />
            <button
              class="btn-outline btn-sm"
              :disabled="productImageUploading"
              @click="productImageInput?.click()"
            >
              {{ productImageUploading ? 'Uploading…' : product.imageUrl ? 'Replace Image' : 'Upload Image' }}
            </button>
            <button
              v-if="product.imageUrl"
              class="btn-ghost btn-sm btn-ghost--danger"
              @click="removeProductImage"
            >
              Remove Image
            </button>
          </div>
        </div>

        <div class="info-card">
          <p class="info-label">Description</p>
          <p>{{ product.description ?? '—' }}</p>
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
                <th>Image</th>
                <th>SKU Code</th>
                <th>Name</th>
                <th>Size</th>
                <th>Color</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="skus.length === 0">
                <td colspan="9" style="text-align:center; color: var(--text);">No SKUs yet.</td>
              </tr>
              <tr v-for="sku in skus" :key="sku.id">
                <td>
                  <div class="admin-img-cell">
                    <img v-if="sku.imageUrl" :src="sku.imageUrl" :alt="sku.name" class="admin-thumb" />
                    <div v-else class="admin-thumb admin-thumb--empty">—</div>

                    <input
                      type="file"
                      accept="image/*"
                      style="display:none"
                      :ref="el => skuImageInputs[sku.id] = el as HTMLInputElement"
                      @change="onSkuImageSelected(sku, $event)"
                    />
                    <div class="admin-img-actions">
                      <button
                        class="btn-ghost btn-xs"
                        :disabled="skuImageUploading === sku.id"
                        @click="triggerSkuImageUpload(sku.id)"
                      >
                        {{ skuImageUploading === sku.id ? '…' : sku.imageUrl ? 'Replace' : 'Upload' }}
                      </button>
                      <button
                        v-if="sku.imageUrl"
                        class="btn-ghost btn-xs btn-ghost--danger"
                        @click="removeSkuImage(sku)"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </td>
                <td><code style="font-size:13px;">{{ sku.skuCode }}</code></td>
                <td>{{ sku.name }}</td>
                <td>{{ sku.size ?? '—' }}</td>
                <td>{{ sku.color ?? '—' }}</td>
                <td>{{ Number(sku.price).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }) }}</td>
                <td>{{ sku.stock?.amount ?? '—' }}</td>
                <td>
                  <span class="badge" :style="sku.isActive ? 'background:rgba(16,185,129,.15);color:#059669' : 'background:var(--code-bg);color:var(--text)'">
                    {{ sku.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <button class="btn-ghost" @click="openRestock(sku)">Restock</button>
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
                <input v-model="skuForm.skuCode" type="text" placeholder="e.g. BAG-001-RED" required />
              </div>
              <div class="field">
                <label>Name</label>
                <input v-model="skuForm.name" type="text" placeholder="SKU name" required />
              </div>
              <div class="field">
                <label>Size</label>
                <input v-model="skuForm.size" type="text" placeholder="e.g. M, L, 42" required />
              </div>
              <div class="field">
                <label>Color</label>
                <input v-model="skuForm.color" type="text" placeholder="e.g. Red" required />
              </div>
              <div class="field">
                <label>Price (IDR)</label>
                <input v-model.number="skuForm.price" type="number" min="0" placeholder="0" required />
              </div>
              <div class="field">
                <label>Initial Stock</label>
                <input v-model.number="skuForm.quantity" type="number" min="0" placeholder="0" required />
              </div>
            </div>

            <div class="field">
              <label>Description</label>
              <textarea v-model="skuForm.description" placeholder="SKU description" rows="2" required />
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

    <!-- Restock modal -->
    <Teleport to="body">
      <div v-if="showRestockModal" class="modal-overlay" @click.self="showRestockModal = false">
        <div class="modal-box">
          <h3 class="modal-title">Restock — {{ restockTarget?.name }}</h3>
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
