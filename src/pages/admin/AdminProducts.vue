<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import { getProducts, type Product } from '../../services/products'
import {
  createProduct, updateProduct, deleteProduct,
  uploadProductImage, deleteProductImage,
  CATEGORIES, type Category, type CreateSkuInProductPayload,
} from '../../services/admin'

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref('')

const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const editingId = ref<string | null>(null)

const form = ref({ name: '', description: '', category: 'BAGS' as Category })

const skuForm = ref<CreateSkuInProductPayload>({
  skuCode: '', name: '', description: '', size: '', color: '',
  price: 0, isActive: true, quantity: 1,
})

const imageUploading = ref<string | null>(null)
const imageInputs = ref<Record<string, HTMLInputElement | null>>({})

async function fetchProducts() {
  loading.value = true
  try {
    products.value = await getProducts({ limit: 200 })
  } catch {
    error.value = 'Failed to load products.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', description: '', category: 'BAGS' }
  skuForm.value = { skuCode: '', name: '', description: '', size: '', color: '', price: 0, isActive: true, quantity: 1 }
  modalError.value = ''
  showModal.value = true
}

function openEdit(p: Product) {
  editingId.value = p.id
  form.value = { name: p.name, description: p.description ?? '', category: p.category }
  modalError.value = ''
  showModal.value = true
}

async function save() {
  modalError.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await updateProduct(editingId.value, { name: form.value.name, description: form.value.description })
    } else {
      await createProduct({ ...form.value, skus: [skuForm.value] })
    }
    showModal.value = false
    await fetchProducts()
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to save.'
  } finally {
    saving.value = false
  }
}

async function remove(p: Product) {
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
  try {
    await deleteProduct(p.id)
    await fetchProducts()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to delete.')
  }
}

function triggerImageUpload(id: string) {
  imageInputs.value[id]?.click()
}

async function onImageSelected(p: Product, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageUploading.value = p.id
  try {
    await uploadProductImage(p.id, file)
    await fetchProducts()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Upload failed.')
  } finally {
    imageUploading.value = null
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function removeImage(p: Product) {
  if (!confirm(`Remove image for "${p.name}"?`)) return
  try {
    await deleteProductImage(p.id)
    await fetchProducts()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to delete image.')
  }
}

onMounted(fetchProducts)
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Products</h1>
        <button class="btn-primary btn-sm" @click="openCreate">+ Add Product</button>
      </div>

      <div v-if="loading" class="admin-state">Loading…</div>
      <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="products.length === 0">
              <td colspan="5" style="text-align:center; color: var(--text);">No products yet.</td>
            </tr>
            <tr v-for="p in products" :key="p.id">
              <td>
                <div class="admin-img-cell">
                  <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="admin-thumb" />
                  <div v-else class="admin-thumb admin-thumb--empty">—</div>

                  <input
                    type="file"
                    accept="image/*"
                    style="display:none"
                    :ref="el => imageInputs[p.id] = el as HTMLInputElement"
                    @change="onImageSelected(p, $event)"
                  />
                  <div class="admin-img-actions">
                    <button
                      class="btn-ghost btn-xs"
                      :disabled="imageUploading === p.id"
                      @click="triggerImageUpload(p.id)"
                    >
                      {{ imageUploading === p.id ? '…' : p.imageUrl ? 'Replace' : 'Upload' }}
                    </button>
                    <button
                      v-if="p.imageUrl"
                      class="btn-ghost btn-xs btn-ghost--danger"
                      @click="removeImage(p)"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </td>
              <td>
                <RouterLink :to="`/admin/products/${p.id}`" class="table-link">{{ p.name }}</RouterLink>
              </td>
              <td><span class="badge" :data-cat="p.category">{{ p.category }}</span></td>
              <td class="td-clamp">{{ p.description ?? '—' }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-ghost" @click="openEdit(p)">Edit</button>
                  <button class="btn-ghost btn-ghost--danger" @click="remove(p)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <h3 class="modal-title">{{ editingId ? 'Edit Product' : 'New Product' }}</h3>

          <p v-if="modalError" class="auth-error">{{ modalError }}</p>

          <form class="modal-form" @submit.prevent="save">
            <div class="field">
              <label>Name</label>
              <input v-model="form.name" type="text" placeholder="Product name" required />
            </div>
            <div class="field">
              <label>Description</label>
              <textarea v-model="form.description" placeholder="Description" rows="3" required />
            </div>
            <div class="field" v-if="!editingId">
              <label>Category</label>
              <select v-model="form.category">
                <option v-for="cat in CATEGORIES" :key="cat" :value="cat">
                  {{ cat.charAt(0) + cat.slice(1).toLowerCase() }}
                </option>
              </select>
            </div>

            <!-- First SKU — required on create -->
            <template v-if="!editingId">
              <p class="modal-section-label">First SKU <span style="color:var(--accent)">*</span></p>
              <div class="modal-grid">
                <div class="field">
                  <label>SKU Code</label>
                  <input v-model="skuForm.skuCode" type="text" placeholder="e.g. SHOE-001-BLK" required />
                </div>
                <div class="field">
                  <label>SKU Name</label>
                  <input v-model="skuForm.name" type="text" placeholder="SKU name" required />
                </div>
                <div class="field">
                  <label>Size</label>
                  <input v-model="skuForm.size" type="text" placeholder="e.g. 42, M, L" required />
                </div>
                <div class="field">
                  <label>Color</label>
                  <input v-model="skuForm.color" type="text" placeholder="e.g. Black" required />
                </div>
                <div class="field">
                  <label>Price (IDR)</label>
                  <input v-model.number="skuForm.price" type="number" min="0" required />
                </div>
                <div class="field">
                  <label>Initial Stock</label>
                  <input v-model.number="skuForm.quantity" type="number" min="1" required />
                </div>
              </div>
              <div class="field">
                <label>SKU Description</label>
                <textarea v-model="skuForm.description" placeholder="SKU description" rows="2" required />
              </div>
              <label class="checkbox-label">
                <input type="checkbox" v-model="skuForm.isActive" />
                <span>Active (visible to customers)</span>
              </label>
            </template>

            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="showModal = false">Cancel</button>
              <button type="submit" class="btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
