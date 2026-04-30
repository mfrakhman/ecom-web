<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { getSizes, createSize, updateSize, deleteSize } from '../../services/admin'
import type { SizeRef } from '../../services/products'

const SIZE_GROUPS = [
  { value: 'apparel',     label: 'Apparel' },
  { value: 'pants',       label: 'Pants' },
  { value: 'shoes',       label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
]

const sizes = ref<SizeRef[]>([])
const activeGroup = ref('apparel')
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const editingId = ref<string | null>(null)

const form = ref({ sizeGroup: 'apparel', name: '', slug: '', sortOrder: 1 })

const filtered = computed(() =>
  [...sizes.value.filter(s => s.sizeGroup === activeGroup.value)]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
)

async function load() {
  loading.value = true
  try {
    const res = await getSizes()
    sizes.value = res.data ?? []
  } catch {
    error.value = 'Failed to load sizes.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  const max = filtered.value.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0)
  form.value = { sizeGroup: activeGroup.value, name: '', slug: '', sortOrder: max + 1 }
  modalError.value = ''
  showModal.value = true
}

function openEdit(s: SizeRef) {
  editingId.value = s.id
  form.value = { sizeGroup: s.sizeGroup, name: s.name, slug: s.slug, sortOrder: s.sortOrder ?? 1 }
  modalError.value = ''
  showModal.value = true
}

async function save() {
  modalError.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await updateSize(editingId.value, form.value)
    } else {
      await createSize(form.value)
    }
    showModal.value = false
    await load()
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to save.'
  } finally {
    saving.value = false
  }
}

async function remove(s: SizeRef) {
  if (!confirm(`Delete size "${s.name}" (${s.sizeGroup})?`)) return
  try {
    await deleteSize(s.id)
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
        <h1 class="admin-page-title">Sizes</h1>
        <button class="btn-primary btn-sm" @click="openCreate">+ Add Size</button>
      </div>

      <div class="size-tabs">
        <button
          v-for="g in SIZE_GROUPS"
          :key="g.value"
          class="size-tab"
          :class="{ active: activeGroup === g.value }"
          @click="activeGroup = g.value"
        >
          {{ g.label }}
          <span class="tab-count">{{ sizes.filter(s => s.sizeGroup === g.value).length }}</span>
        </button>
      </div>

      <div v-if="loading" class="admin-state">Loading…</div>
      <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="4" style="text-align:center; color:var(--ink-3)">No sizes in this group.</td>
            </tr>
            <tr v-for="s in filtered" :key="s.id">
              <td><strong style="font-size:15px;">{{ s.name }}</strong></td>
              <td><code style="font-size:12px;">{{ s.slug }}</code></td>
              <td style="color:var(--ink-3); font-size:13px;">{{ s.sortOrder ?? '—' }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-ghost" @click="openEdit(s)">Edit</button>
                  <button class="btn-ghost btn-ghost--danger" @click="remove(s)">Delete</button>
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
          <h3 class="modal-title">{{ editingId ? 'Edit Size' : 'New Size' }}</h3>
          <p v-if="modalError" class="auth-error">{{ modalError }}</p>
          <form class="modal-form" @submit.prevent="save">
            <div class="field">
              <label>Size Group</label>
              <select v-model="form.sizeGroup">
                <option v-for="g in SIZE_GROUPS" :key="g.value" :value="g.value">{{ g.label }}</option>
              </select>
            </div>
            <div class="modal-grid">
              <div class="field">
                <label>Name</label>
                <input v-model="form.name" type="text" placeholder="e.g. XL" required />
              </div>
              <div class="field">
                <label>Slug</label>
                <input v-model="form.slug" type="text" placeholder="e.g. xl" required />
              </div>
            </div>
            <div class="field">
              <label>Sort Order</label>
              <input v-model.number="form.sortOrder" type="number" min="1" required />
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

<style scoped>
.size-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 1.5px solid var(--line);
}

.size-tab {
  padding: 9px 18px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  font-family: var(--sans);
  color: var(--ink-2);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1.5px;
  display: flex;
  align-items: center;
  gap: 7px;
  transition: color .15s;
}
.size-tab:hover { color: var(--ink); }
.size-tab.active { color: var(--gold); border-bottom-color: var(--gold); }

.tab-count {
  background: var(--line-2);
  color: var(--ink-3);
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
}
.size-tab.active .tab-count { background: var(--gold-bg); color: var(--gold); }
</style>
