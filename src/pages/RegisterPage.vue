<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { register } from '../services/auth'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await register(email.value, username.value, password.value)
    router.push(`/verify-email?email=${encodeURIComponent(email.value)}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Registration failed. Please try again.'
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
        <p class="brand-tagline">Your favourite shopping destination</p>
      </div>

      <div class="auth-tabs">
        <RouterLink to="/login" class="tab">Sign In</RouterLink>
        <RouterLink to="/register" class="tab">Create Account</RouterLink>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit" novalidate>
        <p v-if="error" class="auth-error">{{ error }}</p>

        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="e.g. john_doe"
            autocomplete="username"
            required
          />
        </div>

        <div class="field">
          <label for="email">Email address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
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

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Creating account…' : 'Create Account' }}
        </button>

        <p class="terms">
          By creating an account you agree to our
          <a href="#" class="link">Terms of Service</a> and
          <a href="#" class="link">Privacy Policy</a>.
        </p>
      </form>

      <p class="auth-footer">
        Already have an account?
        <RouterLink to="/login" class="link">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--bg); }
.auth-card { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: 36px 32px; box-shadow: var(--shadow); }
.auth-brand { text-align: center; margin-bottom: 28px; }
.brand-logo { width: 40px; height: 40px; background: var(--ink); color: #FAF8F4; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--serif); font-weight: 700; font-size: 18px; margin: 0 auto 10px; }
.brand-name { font-family: var(--serif); font-size: 20px; font-weight: 500; color: var(--ink); margin-bottom: 4px; }
.brand-tagline { font-size: 13px; color: var(--ink-3); margin: 0; }
.auth-tabs { display: flex; border-bottom: 1px solid var(--line); margin-bottom: 24px; }
.tab { flex: 1; padding: 10px; text-align: center; font-size: 14px; font-weight: 500; color: var(--ink-3); text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color .15s, border-color .15s; }
.tab.router-link-active { color: var(--ink); border-bottom-color: var(--gold); }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--ink-3); }
.link { color: var(--gold); font-weight: 600; }
.terms { font-size: 12px; color: var(--ink-3); text-align: center; margin: 0; }
.terms .link { font-weight: 500; }
</style>
