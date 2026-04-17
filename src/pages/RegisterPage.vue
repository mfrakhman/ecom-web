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
    router.push('/login')
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
