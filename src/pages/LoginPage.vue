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
