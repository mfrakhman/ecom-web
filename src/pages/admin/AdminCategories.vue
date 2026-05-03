<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import {
  getCategories, getGenders, getCategoryGroups,
  createCategory, updateCategory, deleteCategory,
  type CategoryRef, type GenderRef, type CategoryGroupRef,
} from '../../services/admin'

const cats = ref<CategoryRef[]>([])
const genders = ref<GenderRef[]>([])
const groups = ref<CategoryGroupRef[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const editingId = ref<string | null>(null)

const form = ref({ name: '', slug: '', genderId: '', groupId: '', displayOrder: 0 })

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

watch(() => form.value.name, (val) => {
  if (!editingId.value) form.value.slug = slugify(val)
})

async function load() {
  loading.value = true
  try {
    const [cRes, gRes, grpRes] = await Promise.all([getCategories(), getGenders(), getCategoryGroups()])
    cats.value = (cRes.data ?? []).sort((a, b) => {
      const gA = a.gender?.displayOrder ?? 0, gB = b.gender?.displayOrder ?? 0
      if (gA !== gB) return gA - gB
      const grA = a.group?.displayOrder ?? 0, grB = b.group?.displayOrder ?? 0
      if (grA !== grB) return grA - grB
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    })
    genders.value = gRes.data ?? []
    groups.value = grpRes.data ?? []
  } catch {
    error.value = 'Failed to load categories.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', slug: '', genderId: genders.value[0]?.id ?? '', groupId: groups.value[0]?.id ?? '', displayOrder: 0 }
  modalError.value = ''
  showModal.value = true
}

function openEdit(c: CategoryRef) {
  editingId.value = c.id
  form.value = { name: c.name, slug: c.slug, genderId: c.genderId, groupId: c.groupId, displayOrder: c.displayOrder ?? 0 }
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
      genderId: form.value.genderId,
      groupId: form.value.groupId,
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

async function remove(c: CategoryRef) {
  if (!confirm(`Delete "${c.name}"?`)) return
  try {
    await deleteCategory(c.id)
    await load()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to delete.')
  }
}

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
              <th>Gender</th>
              <th>Group</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cats.length === 0">
              <td colspan="6" style="text-align:center; color:var(--ink-3)">No categories yet.</td>
            </tr>
            <tr v-for="c in cats" :key="c.id">
              <td>{{ c.name }}</td>
              <td><code style="font-size:12px;">{{ c.slug }}</code></td>
              <td><span class="badge">{{ c.gender?.name ?? '—' }}</span></td>
              <td><span class="badge badge--outline">{{ c.group?.name ?? '—' }}</span></td>
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
              <label>Gender</label>
              <select v-model="form.genderId" required>
                <option value="" disabled>Select gender</option>
                <option v-for="g in genders" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>Group</label>
              <select v-model="form.groupId" required>
                <option value="" disabled>Select group</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
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
