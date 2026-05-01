<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { resetPassword } from '../services/auth'

const router = useRouter()
const route  = useRoute()

const token    = computed(() => (route.query.token as string) || '')
const password = ref('')
const confirm  = ref('')
const loading  = ref(false)
const error    = ref('')
const success  = ref('')

async function handleSubmit() {
  if (password.value.length < 8) { error.value = 'Password must be at least 8 characters'; return }
  if (password.value !== confirm.value) { error.value = 'Passwords do not match'; return }
  if (!token.value) { error.value = 'Invalid reset link'; return }
  error.value = ''
  loading.value = true
  try {
    await resetPassword(token.value, password.value)
    success.value = 'Password reset! Redirecting to login…'
    setTimeout(() => router.push('/login'), 1500)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Reset failed, please try again'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="brand-logo">R</div>
        <div class="brand-name">RetailCo</div>
      </div>

      <h2 class="title">Set new password</h2>
      <p class="subtitle">Choose a strong password for your account.</p>

      <p v-if="error" class="auth-error">{{ error }}</p>
      <p v-if="success" class="auth-success">{{ success }}</p>

      <form class="auth-form" @submit.prevent="handleSubmit" novalidate>
        <div class="field">
          <label for="password">New password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Min. 8 characters"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>
        <div class="field">
          <label for="confirm">Confirm password</label>
          <input
            id="confirm"
            v-model="confirm"
            type="password"
            placeholder="Repeat your password"
            autocomplete="new-password"
            required
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading || !!success">
          {{ loading ? 'Resetting…' : 'Reset Password' }}
        </button>
      </form>

      <p class="auth-footer">
        <RouterLink to="/login" class="link">Back to sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--bg); }
.auth-card { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: 36px 32px; box-shadow: var(--shadow); display: flex; flex-direction: column; align-items: center; }
.auth-brand { text-align: center; margin-bottom: 24px; }
.brand-logo { width: 40px; height: 40px; background: var(--ink); color: #FAF8F4; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--serif); font-weight: 700; font-size: 18px; margin: 0 auto 10px; }
.brand-name { font-family: var(--serif); font-size: 20px; font-weight: 500; color: var(--ink); }
.title { font-size: 20px; font-weight: 600; color: var(--ink); margin: 0 0 8px; }
.subtitle { font-size: 14px; color: var(--ink-3); text-align: center; margin: 0 0 24px; }
.auth-error { color: #c0392b; font-size: 13px; margin: 0 0 16px; text-align: center; width: 100%; }
.auth-success { color: #27ae60; font-size: 13px; margin: 0 0 16px; text-align: center; width: 100%; }
.auth-form { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.btn-primary { width: 100%; padding: 13px; background: var(--ink); color: #FAF8F4; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity .15s; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--ink-3); }
.link { color: var(--gold); font-weight: 600; text-decoration: none; }
</style>
