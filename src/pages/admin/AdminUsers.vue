<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { getUsers, deleteUser, type Profile } from '../../services/auth'

const users = ref<Profile[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const deletingId = ref<string | null>(null)
const confirmId = ref<string | null>(null)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.email.toLowerCase().includes(q) ||
    (u.firstName ?? '').toLowerCase().includes(q) ||
    (u.lastName ?? '').toLowerCase().includes(q),
  )
})

onMounted(async () => {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load users.'
  } finally {
    loading.value = false
  }
})

async function confirmDelete(id: string) {
  confirmId.value = id
}

async function doDelete() {
  if (!confirmId.value) return
  deletingId.value = confirmId.value
  confirmId.value = null
  try {
    await deleteUser(deletingId.value)
    users.value = users.value.filter(u => u.id !== deletingId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete user.'
  } finally {
    deletingId.value = null
  }
}

function fullName(u: Profile) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || '—'
}
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page-header">
        <h1 class="admin-page-title">Users</h1>
        <span class="user-count">{{ users.length }} total</span>
      </div>

      <div class="search-bar">
        <input
          v-model="search"
          type="text"
          placeholder="Search by email or name…"
          class="search-input"
        />
      </div>

      <div v-if="loading" class="admin-state">Loading…</div>
      <div v-else-if="error" class="admin-state admin-state--error">{{ error }}</div>
      <div v-else-if="filtered.length === 0" class="admin-state">No users found.</div>

      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filtered" :key="user.id">
              <td>{{ user.email }}</td>
              <td>{{ fullName(user) }}</td>
              <td>
                <span class="role-badge" :data-role="user.role">{{ user.role }}</span>
              </td>
              <td>{{ user.phone ?? '—' }}</td>
              <td style="white-space:nowrap;">
                {{ new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
              <td>
                <button
                  class="btn-delete"
                  :disabled="deletingId === user.id"
                  @click="confirmDelete(user.id)"
                >
                  {{ deletingId === user.id ? '…' : 'Delete' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="confirmId" class="modal-overlay" @click.self="confirmId = null">
        <div class="modal">
          <p class="modal-msg">Delete this user? This cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="confirmId = null">Cancel</button>
            <button class="btn-confirm" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.admin-page-header { display: flex; align-items: center; gap: 12px; }
.user-count { font-size: 13px; color: var(--ink-3); }
.search-bar { margin-bottom: 16px; }
.search-input {
  width: 100%; max-width: 320px; padding: 8px 12px;
  border: 1px solid var(--line); border-radius: 8px;
  font-size: 14px; background: var(--surface); color: var(--ink);
  outline: none;
}
.search-input:focus { border-color: var(--gold); }
.role-badge {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
}
.role-badge[data-role="ADMIN"] { background: #fef9c3; color: #854d0e; }
.role-badge[data-role="USER"]  { background: #f0f9ff; color: #0369a1; }
.btn-delete {
  padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
  border: 1px solid #fca5a5; color: #dc2626; background: #fff5f5;
  cursor: pointer; transition: background .15s;
}
.btn-delete:hover:not(:disabled) { background: #fee2e2; }
.btn-delete:disabled { opacity: .5; cursor: default; }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal {
  background: var(--surface); border-radius: 12px; padding: 24px 28px;
  min-width: 300px; box-shadow: 0 8px 32px rgba(0,0,0,.12);
}
.modal-msg { margin: 0 0 20px; font-size: 15px; color: var(--ink); }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel {
  padding: 8px 16px; border-radius: 8px; font-size: 14px;
  border: 1px solid var(--line); background: var(--surface); color: var(--ink);
  cursor: pointer;
}
.btn-confirm {
  padding: 8px 16px; border-radius: 8px; font-size: 14px;
  border: none; background: #dc2626; color: #fff; cursor: pointer;
}
.btn-confirm:hover { background: #b91c1c; }
</style>
