<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '../../components/AdminLayout.vue'
import { getProducts, type Product } from '../../services/products'
import {
  createProduct, updateProduct, deleteProduct,
  getCategories, getColors, getSizes,
  type CategoryRef, type ColorRef, type SizeRef,
  type CreateSkuInProductPayload,
} from '../../services/admin'

const products = ref<Product[]>([])
const categories = ref<CategoryRef[]>([])
const colors = ref<ColorRef[]>([])
const loading = ref(false)
const error = ref('')

const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const editingId = ref<string | null>(null)

const SIZE_GROUPS = [
  { value: '', label: 'None (bags, accessories)' },
  { value: 'apparel', label: 'Apparel (XS–XXL)' },
  { value: 'footwear_uk', label: 'Footwear UK (5–12)' },
  { value: 'waist', label: 'Waist (W28–W38)' },
]

const form = ref({
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  sizeGroup: '',
})

const skuForm = ref<CreateSkuInProductPayload>({
  skuCode: '', colorId: '', sizeId: undefined,
  price: 0, isActive: true, quantity: 1,
})

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

watch(() => form.value.name, (val) => {
  if (!editingId.value) form.value.slug = slugify(val)
})

const filteredSizes = ref<SizeRef[]>([])

watch(() => form.value.sizeGroup, async (sg) => {
  if (sg) {
    const res = await getSizes(sg)
    filteredSizes.value = res.data ?? []
  } else {
    filteredSizes.value = []
    skuForm.value.sizeId = undefined
  }
})

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

async function fetchRefData() {
  const [catRes, colorRes] = await Promise.all([getCategories(), getColors()])
  categories.value = catRes.data ?? []
  colors.value = colorRes.data ?? []
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', slug: '', description: '', categoryId: categories.value[0]?.id ?? '', sizeGroup: '' }
  skuForm.value = { skuCode: '', colorId: colors.value[0]?.id ?? '', sizeId: undefined, price: 0, isActive: true, quantity: 1 }
  filteredSizes.value = []
  modalError.value = ''
  showModal.value = true
}

function openEdit(p: Product) {
  editingId.value = p.id
  form.value = {
    name: p.name,
    slug: p.slug,
    description: p.description ?? '',
    categoryId: p.categoryId,
    sizeGroup: p.sizeGroup ?? '',
  }
  modalError.value = ''
  showModal.value = true
}

async function save() {
  modalError.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await updateProduct(editingId.value, {
        name: form.value.name,
        slug: form.value.slug,
        description: form.value.description,
        categoryId: form.value.categoryId,
        sizeGroup: form.value.sizeGroup || undefined,
      })
    } else {
      const payload = {
        name: form.value.name,
        slug: form.value.slug,
        description: form.value.description || undefined,
        categoryId: form.value.categoryId,
        sizeGroup: form.value.sizeGroup || undefined,
        skus: [{ ...skuForm.value, sizeId: skuForm.value.sizeId || undefined }] as [CreateSkuInProductPayload],
      }
      await createProduct(payload)
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

onMounted(async () => {
  await fetchRefData()
  await fetchProducts()
})
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
              <th>Name</th>
              <th>Category</th>
              <th>Slug</th>
              <th>Size Group</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="products.length === 0">
              <td colspan="5" style="text-align:center; color: var(--text);">No products yet.</td>
            </tr>
            <tr v-for="p in products" :key="p.id">
              <td>
                <RouterLink :to="`/admin/products/${p.id}`" class="table-link">{{ p.name }}</RouterLink>
              </td>
              <td><span class="badge">{{ p.category?.name ?? p.categoryId }}</span></td>
              <td><code style="font-size:12px;">{{ p.slug }}</code></td>
              <td>{{ p.sizeGroup ?? '—' }}</td>
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

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box modal-box--wide">
          <h3 class="modal-title">{{ editingId ? 'Edit Product' : 'New Product' }}</h3>
          <p v-if="modalError" class="auth-error">{{ modalError }}</p>

          <form class="modal-form" @submit.prevent="save">
            <div class="modal-grid">
              <div class="field">
                <label>Name</label>
                <input v-model="form.name" type="text" placeholder="Product name" required />
              </div>
              <div class="field">
                <label>Slug</label>
                <input v-model="form.slug" type="text" placeholder="product-slug" required />
              </div>
            </div>

            <div class="field">
              <label>Description</label>
              <textarea v-model="form.description" placeholder="Optional description" rows="2" />
            </div>

            <div class="modal-grid">
              <div class="field">
                <label>Category</label>
                <select v-model="form.categoryId" required>
                  <option value="" disabled>Select category</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="field">
                <label>Size Group</label>
                <select v-model="form.sizeGroup">
                  <option v-for="sg in SIZE_GROUPS" :key="sg.value" :value="sg.value">{{ sg.label }}</option>
                </select>
              </div>
            </div>

            <!-- First SKU — required on create -->
            <template v-if="!editingId">
              <p class="modal-section-label">First SKU <span style="color:var(--accent)">*</span></p>
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
                  <label>Initial Stock</label>
                  <input v-model.number="skuForm.quantity" type="number" min="1" required />
                </div>
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
