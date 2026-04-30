<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  type CategoryNode,
} from '../../services/admin'
import type { CategoryRef } from '../../services/products'

interface FlatCat { id: string; name: string; slug: string; parentId: string | null; displayOrder: number; level: number }

const flat = ref<FlatCat[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const editingId = ref<string | null>(null)

const form = ref({ name: '', slug: '', parentId: '', displayOrder: 0 })

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

watch(() => form.value.name, (val) => {
  if (!editingId.value) form.value.slug = slugify(val)
})

function flattenTree(nodes: CategoryNode[], level = 0): FlatCat[] {
  const result: FlatCat[] = []
  for (const n of nodes) {
    result.push({ id: n.id, name: n.name, slug: n.slug, parentId: n.parentId, displayOrder: n.displayOrder ?? 0, level })
    if (n.children?.length) result.push(...flattenTree(n.children, level + 1))
  }
  return result
}

async function load() {
  loading.value = true
  try {
    const res = await getCategories()
    flat.value = flattenTree(res.data ?? [])
  } catch {
    error.value = 'Failed to load categories.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', slug: '', parentId: '', displayOrder: 0 }
  modalError.value = ''
  showModal.value = true
}

function openEdit(c: FlatCat) {
  editingId.value = c.id
  form.value = { name: c.name, slug: c.slug, parentId: c.parentId ?? '', displayOrder: c.displayOrder }
  modalError.value = ''
  showModal.value = true
}

async function save() {
  modalError.value = ''
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      slug: form.value.slug,
      parentId: form.value.parentId || undefined,
      displayOrder: form.value.displayOrder,
    }
    if (editingId.value) {
      await updateCategory(editingId.value, payload)
    } else {
      await createCategory(payload)
    }
    showModal.value = false
    await load()
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to save.'
  } finally {
    saving.value = false
  }
}

async function remove(c: FlatCat) {
  if (!confirm(`Delete "${c.name}"? Child categories may also be removed.`)) return
  try {
    await deleteCategory(c.id)
    await load()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to delete.')
  }
}

// Only top-level categories are eligible parents (depth 0 → you can select level-0 to create level-1)
// Actually show all except the item being edited to avoid circular refs
const parentOptions = () => flat.value.filter(c => c.id !== editingId.value)

onMounted(load)
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Categories</h1>
        <button class="btn-primary btn-sm" @click="openCreate">+ Add Category</button>
      </div>

      <div v-if="loading" class="admin-state">Loading…</div>
      <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Parent</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="flat.length === 0">
              <td colspan="5" style="text-align:center; color:var(--ink-3)">No categories yet.</td>
            </tr>
            <tr v-for="c in flat" :key="c.id">
              <td>
                <span :style="{ paddingLeft: `${c.level * 20}px` }">
                  <span v-if="c.level > 0" style="color:var(--ink-3); margin-right:6px;">↳</span>
                  {{ c.name }}
                </span>
              </td>
              <td><code style="font-size:12px;">{{ c.slug }}</code></td>
              <td>
                <span class="badge" v-if="c.parentId">
                  {{ flat.find(x => x.id === c.parentId)?.name ?? '—' }}
                </span>
                <span v-else style="color:var(--ink-3); font-size:13px;">—</span>
              </td>
              <td style="color:var(--ink-3); font-size:13px;">{{ c.displayOrder }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-ghost" @click="openEdit(c)">Edit</button>
                  <button class="btn-ghost btn-ghost--danger" @click="remove(c)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <h3 class="modal-title">{{ editingId ? 'Edit Category' : 'New Category' }}</h3>
          <p v-if="modalError" class="auth-error">{{ modalError }}</p>
          <form class="modal-form" @submit.prevent="save">
            <div class="field">
              <label>Name</label>
              <input v-model="form.name" type="text" placeholder="e.g. Jackets" required />
            </div>
            <div class="field">
              <label>Slug</label>
              <input v-model="form.slug" type="text" placeholder="e.g. mens-jackets" required />
            </div>
            <div class="field">
              <label>Parent Category</label>
              <select v-model="form.parentId">
                <option value="">None (top-level)</option>
                <option v-for="c in parentOptions()" :key="c.id" :value="c.id">
                  {{ '—'.repeat(c.level) }} {{ c.name }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>Display Order</label>
              <input v-model.number="form.displayOrder" type="number" min="0" />
            </div>
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
