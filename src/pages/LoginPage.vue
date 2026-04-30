<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { login, saveToken, saveRefreshToken } from '../services/auth'

const router = useRouter()

const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const { access_token, refresh_token } = await login(email.value, password.value)
    saveToken(access_token)
    saveRefreshToken(refresh_token)
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed. Please try again.'
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
          <label for="password">
            Password
            <a href="#" class="label-link">Forgot?</a>
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <label class="checkbox-label">
          <input type="checkbox" v-model="remember" />
          <span>Keep me signed in</span>
        </label>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <p class="auth-footer">
        Don't have an account?
        <RouterLink to="/register" class="link">Sign up free</RouterLink>
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
.label-link { float: right; font-size: 12px; font-weight: 400; color: var(--gold); }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ink-2); cursor: pointer; }
.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--ink-3); }
.link { color: var(--gold); font-weight: 600; }
</style>
