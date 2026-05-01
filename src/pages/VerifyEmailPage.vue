<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { sendVerificationOtp, verifyEmail, saveToken, saveRefreshToken } from '../services/auth'

const router = useRouter()
const route  = useRoute()

const email   = computed(() => (route.query.email as string) || '')
const digits  = ref(['', '', '', '', '', ''])
const loading = ref(false)
const error   = ref('')
const success = ref('')
const cooldown = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

function startCooldown(seconds = 60) {
  cooldown.value = seconds
  timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

onMounted(() => startCooldown())
onUnmounted(() => { if (timer) clearInterval(timer) })

function onDigitInput(index: number, e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '').slice(-1)
  digits.value[index] = val
  if (val && index < 5) {
    const next = document.getElementById(`digit-${index + 1}`)
    next?.focus()
  }
}

function onDigitKeydown(index: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[index] && index > 0) {
    const prev = document.getElementById(`digit-${index - 1}`)
    prev?.focus()
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
  text.split('').forEach((ch, i) => { digits.value[i] = ch })
  const last = document.getElementById(`digit-${Math.min(text.length, 5)}`)
  last?.focus()
}

const code = computed(() => digits.value.join(''))

async function handleVerify() {
  if (code.value.length < 6) { error.value = 'Enter all 6 digits'; return }
  error.value = ''
  loading.value = true
  try {
    const res = await verifyEmail(email.value, code.value)
    saveToken(res.access_token)
    saveRefreshToken(res.refresh_token)
    success.value = 'Email verified!'
    setTimeout(() => router.push('/'), 800)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Verification failed'
    digits.value = ['', '', '', '', '', '']
    document.getElementById('digit-0')?.focus()
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  if (cooldown.value > 0) return
  error.value = ''
  try {
    await sendVerificationOtp(email.value)
    startCooldown()
    success.value = 'Code resent! Check your inbox.'
    setTimeout(() => success.value = '', 3000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to resend'
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

      <h2 class="title">Verify your email</h2>
      <p class="subtitle">
        We sent a 6-digit code to<br>
        <strong>{{ email }}</strong>
      </p>

      <p v-if="error" class="auth-error">{{ error }}</p>
      <p v-if="success" class="auth-success">{{ success }}</p>

      <div class="digits" @paste="onPaste">
        <input
          v-for="(_, i) in digits"
          :id="`digit-${i}`"
          :key="i"
          v-model="digits[i]"
          class="digit-input"
          type="text"
          inputmode="numeric"
          maxlength="1"
          @input="onDigitInput(i, $event)"
          @keydown="onDigitKeydown(i, $event)"
        />
      </div>

      <button class="btn-primary" :disabled="loading || code.length < 6" @click="handleVerify">
        {{ loading ? 'Verifying…' : 'Verify Email' }}
      </button>

      <div class="resend-row">
        <span class="hint">Didn't receive it? Check your spam folder.</span>
        <button class="resend-btn" :disabled="cooldown > 0" @click="handleResend">
          {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code' }}
        </button>
      </div>
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
.subtitle { font-size: 14px; color: var(--ink-3); text-align: center; margin: 0 0 24px; line-height: 1.5; }
.auth-error { color: #c0392b; font-size: 13px; margin: 0 0 16px; text-align: center; }
.auth-success { color: #27ae60; font-size: 13px; margin: 0 0 16px; text-align: center; }
.digits { display: flex; gap: 10px; margin-bottom: 24px; }
.digit-input { width: 46px; height: 56px; border: 1.5px solid var(--line); border-radius: 10px; font-size: 24px; font-weight: 600; text-align: center; background: var(--bg); color: var(--ink); outline: none; transition: border-color .15s; }
.digit-input:focus { border-color: var(--gold); }
.btn-primary { width: 100%; padding: 13px; background: var(--ink); color: #FAF8F4; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity .15s; margin-bottom: 20px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.resend-row { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
.hint { font-size: 12px; color: var(--ink-3); text-align: center; }
.resend-btn { background: none; border: none; color: var(--gold); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; }
.resend-btn:disabled { color: var(--ink-3); cursor: not-allowed; }
</style>
