<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { getColors, createColor, updateColor, deleteColor } from '../../services/admin'
import type { ColorRef } from '../../services/products'

const colors = ref<ColorRef[]>([])
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')
const editingId = ref<string | null>(null)

const form = ref({ name: '', slug: '', hex: '#000000', displayOrder: 0 })

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

watch(() => form.value.name, (val) => {
  if (!editingId.value) form.value.slug = slugify(val)
})

async function load() {
  loading.value = true
  try {
    const res = await getColors()
    colors.value = res.data ?? []
  } catch {
    error.value = 'Failed to load colors.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', slug: '', hex: '#000000', displayOrder: colors.value.length }
  modalError.value = ''
  showModal.value = true
}

function openEdit(c: ColorRef) {
  editingId.value = c.id
  form.value = { name: c.name, slug: c.slug, hex: c.hex, displayOrder: c.displayOrder ?? 0 }
  modalError.value = ''
  showModal.value = true
}

async function save() {
  modalError.value = ''
  saving.value = true
  try {
    const payload = { name: form.value.name, slug: form.value.slug, hex: form.value.hex, displayOrder: form.value.displayOrder }
    if (editingId.value) {
      await updateColor(editingId.value, payload)
    } else {
      await createColor(payload)
    }
    showModal.value = false
    await load()
  } catch (e) {
    modalError.value = e instanceof Error ? e.message : 'Failed to save.'
  } finally {
    saving.value = false
  }
}

async function remove(c: ColorRef) {
  if (!confirm(`Delete color "${c.name}"?`)) return
  try {
    await deleteColor(c.id)
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
        <h1 class="admin-page-title">Colors</h1>
        <button class="btn-primary btn-sm" @click="openCreate">+ Add Color</button>
      </div>

      <div v-if="loading" class="admin-state">Loading…</div>
      <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width:56px;">Swatch</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Hex</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="colors.length === 0">
              <td colspan="6" style="text-align:center; color:var(--ink-3)">No colors yet.</td>
            </tr>
            <tr v-for="c in colors" :key="c.id">
              <td>
                <span class="color-swatch" :style="{ background: c.hex }" :title="c.hex" />
              </td>
              <td>{{ c.name }}</td>
              <td><code style="font-size:12px;">{{ c.slug }}</code></td>
              <td><code style="font-size:12px; color:var(--ink-2);">{{ c.hex }}</code></td>
              <td style="color:var(--ink-3); font-size:13px;">{{ c.displayOrder ?? '—' }}</td>
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
          <h3 class="modal-title">{{ editingId ? 'Edit Color' : 'New Color' }}</h3>
          <p v-if="modalError" class="auth-error">{{ modalError }}</p>
          <form class="modal-form" @submit.prevent="save">
            <div class="modal-grid">
              <div class="field">
                <label>Name</label>
                <input v-model="form.name" type="text" placeholder="e.g. Forest Green" required />
              </div>
              <div class="field">
                <label>Slug</label>
                <input v-model="form.slug" type="text" placeholder="e.g. forest-green" required />
              </div>
            </div>
            <div class="modal-grid">
              <div class="field">
                <label>Hex Color</label>
                <div class="color-picker-row">
                  <input type="color" v-model="form.hex" class="color-native-input" />
                  <input v-model="form.hex" type="text" placeholder="#000000" class="color-hex-input" required />
                </div>
              </div>
              <div class="field">
                <label>Display Order</label>
                <input v-model.number="form.displayOrder" type="number" min="0" />
              </div>
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
.color-swatch {
  display: inline-block;
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  vertical-align: middle;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-native-input {
  width: 44px; height: 40px;
  border: 1.5px solid var(--line);
  border-radius: 8px;
  padding: 3px;
  cursor: pointer;
  flex-shrink: 0;
  background: var(--bg);
}

.color-hex-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  font-size: 14px;
  font-family: var(--mono);
  color: var(--ink);
  background: var(--bg);
  transition: border-color .18s, box-shadow .18s;
}
.color-hex-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-bg);
  background: var(--surface);
}
</style>
