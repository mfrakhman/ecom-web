<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { sendForgotPasswordOtp, verifyForgotPasswordOtp } from '../services/auth'

const router = useRouter()

const step     = ref<'email' | 'code'>('email')
const email    = ref('')
const digits   = ref(['', '', '', '', '', ''])
const loading  = ref(false)
const error    = ref('')
const cooldown = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

function startCooldown(seconds = 60) {
  cooldown.value = seconds
  timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0 && timer) { clearInterval(timer); timer = null }
  }, 1000)
}

onUnmounted(() => { if (timer) clearInterval(timer) })

const code = computed(() => digits.value.join(''))

async function handleSend() {
  if (!email.value) { error.value = 'Enter your email'; return }
  error.value = ''
  loading.value = true
  try {
    await sendForgotPasswordOtp(email.value)
    step.value = 'code'
    startCooldown()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to send code'
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  if (cooldown.value > 0) return
  error.value = ''
  try {
    await sendForgotPasswordOtp(email.value)
    startCooldown()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to resend'
  }
}

async function handleVerify() {
  if (code.value.length < 6) { error.value = 'Enter all 6 digits'; return }
  error.value = ''
  loading.value = true
  try {
    const { reset_token } = await verifyForgotPasswordOtp(email.value, code.value)
    router.push(`/reset-password?token=${encodeURIComponent(reset_token)}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Invalid code'
    digits.value = ['', '', '', '', '', '']
    document.getElementById('digit-0')?.focus()
  } finally {
    loading.value = false
  }
}

function onDigitInput(index: number, e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '').slice(-1)
  digits.value[index] = val
  if (val && index < 5) document.getElementById(`digit-${index + 1}`)?.focus()
}

function onDigitKeydown(index: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[index] && index > 0)
    document.getElementById(`digit-${index - 1}`)?.focus()
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
  text.split('').forEach((ch, i) => { digits.value[i] = ch })
  document.getElementById(`digit-${Math.min(text.length, 5)}`)?.focus()
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="brand-logo">R</div>
        <div class="brand-name">RetailCo</div>
      </div>

      <h2 class="title">{{ step === 'email' ? 'Forgot password?' : 'Enter reset code' }}</h2>
      <p class="subtitle" v-if="step === 'email'">
        Enter your email and we'll send you a reset code.
      </p>
      <p class="subtitle" v-else>
        We sent a 6-digit code to<br><strong>{{ email }}</strong>
      </p>

      <p v-if="error" class="auth-error">{{ error }}</p>

      <!-- Step 1: email -->
      <template v-if="step === 'email'">
        <form class="auth-form" @submit.prevent="handleSend" novalidate>
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
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Sending…' : 'Send Reset Code' }}
          </button>
        </form>
      </template>

      <!-- Step 2: OTP -->
      <template v-else>
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
          {{ loading ? 'Verifying…' : 'Continue' }}
        </button>
        <div class="resend-row">
          <span class="hint">Didn't receive it? Check your spam folder.</span>
          <button class="resend-btn" :disabled="cooldown > 0" @click="handleResend">
            {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code' }}
          </button>
        </div>
        <button class="back-btn" @click="step = 'email'; error = ''">← Change email</button>
      </template>

      <p class="auth-footer">
        Remember your password?
        <RouterLink to="/login" class="link">Sign in</RouterLink>
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
.subtitle { font-size: 14px; color: var(--ink-3); text-align: center; margin: 0 0 24px; line-height: 1.5; }
.auth-error { color: #c0392b; font-size: 13px; margin: 0 0 16px; text-align: center; width: 100%; }
.auth-form { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.digits { display: flex; gap: 10px; margin-bottom: 20px; }
.digit-input { width: 46px; height: 56px; border: 1.5px solid var(--line); border-radius: 10px; font-size: 24px; font-weight: 600; text-align: center; background: var(--bg); color: var(--ink); outline: none; transition: border-color .15s; }
.digit-input:focus { border-color: var(--gold); }
.btn-primary { width: 100%; padding: 13px; background: var(--ink); color: #FAF8F4; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity .15s; margin-bottom: 16px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.resend-row { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; margin-bottom: 12px; }
.hint { font-size: 12px; color: var(--ink-3); text-align: center; }
.resend-btn { background: none; border: none; color: var(--gold); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; }
.resend-btn:disabled { color: var(--ink-3); cursor: not-allowed; }
.back-btn { background: none; border: none; color: var(--ink-3); font-size: 13px; cursor: pointer; padding: 0; margin-bottom: 8px; }
.auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--ink-3); }
.link { color: var(--gold); font-weight: 600; text-decoration: none; }
</style>
