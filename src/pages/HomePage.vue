<script setup lang="ts">
import { useRouter } from 'vue-router'
import { clearToken } from '../services/auth'

const router = useRouter()

function logout() {
  clearToken()
  router.push('/login')
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card" style="text-align: center;">
      <div class="auth-brand">
        <div class="brand-logo">R</div>
        <div class="brand-name">RetailCo</div>
        <p class="brand-tagline">You are signed in</p>
      </div>
      <button class="btn-primary" style="margin-top: 8px;" @click="logout">Sign Out</button>
    </div>
  </div>
</template>
