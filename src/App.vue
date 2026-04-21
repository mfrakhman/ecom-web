<script setup lang="ts">
import { isServerDown, clearServerDown } from './composables/useServerError'

function retry() {
  clearServerDown()
  window.location.reload()
}
</script>

<template>
  <div v-if="isServerDown" class="server-error-overlay">
    <div class="server-error-box">
      <div class="server-error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9.172 9.172a4 4 0 1 1 5.656 5.656"/>
          <path d="M10.586 10.586 12 12l1.414 1.414"/>
          <path d="M3 3l18 18"/>
          <path d="M10.5 1.5A9 9 0 0 1 21 12"/>
          <path d="M3.273 3.273A9 9 0 0 0 12 21a9 9 0 0 0 8.727-6.727"/>
        </svg>
      </div>
      <h2 class="server-error-title">Cannot reach server</h2>
      <p class="server-error-desc">The server is unavailable or your connection was lost. Please check your internet connection and try again.</p>
      <button class="btn-primary" @click="retry">Try Again</button>
    </div>
  </div>
  <RouterView v-else />
</template>
