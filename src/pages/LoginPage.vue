<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { login, sendLoginOtp, verifyLoginOtp, saveToken, saveRefreshToken } from '../services/auth'

const router = useRouter()

const mode     = ref<'otp' | 'password'>('otp')
const otpStep  = ref<'email' | 'code'>('email')

const email    = ref('')
const password = ref('')
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

function switchMode(m: 'otp' | 'password') {
  mode.value = m
  otpStep.value = 'email'
  error.value = ''
  digits.value = ['', '', '', '', '', '']
}

// ── OTP mode ──────────────────────────────────────────────────────────────

function redirectToVerify() {
  router.push(`/verify-email?email=${encodeURIComponent(email.value)}`)
}

async function handleSendOtp() {
  if (!email.value) { error.value = 'Enter your email'; return }
  error.value = ''
  loading.value = true
  try {
    await sendLoginOtp(email.value)
    otpStep.value = 'code'
    startCooldown()
  } catch (e) {
    if (e instanceof Error && e.message === 'EMAIL_NOT_VERIFIED') {
      redirectToVerify()
    } else {
      error.value = e instanceof Error ? e.message : 'Failed to send code'
    }
  } finally {
    loading.value = false
  }
}

async function handleResendOtp() {
  if (cooldown.value > 0) return
  error.value = ''
  try {
    await sendLoginOtp(email.value)
    startCooldown()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to resend'
  }
}

async function handleVerifyOtp() {
  if (code.value.length < 6) { error.value = 'Enter all 6 digits'; return }
  error.value = ''
  loading.value = true
  try {
    const { access_token, refresh_token } = await verifyLoginOtp(email.value, code.value)
    saveToken(access_token)
    saveRefreshToken(refresh_token)
    router.push('/')
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

// ── Password mode ─────────────────────────────────────────────────────────

async function handlePasswordLogin() {
  error.value = ''
  loading.value = true
  try {
    const { access_token, refresh_token } = await login(email.value, password.value)
    saveToken(access_token)
    saveRefreshToken(refresh_token)
    router.push('/')
  } catch (e) {
    if (e instanceof Error && e.message === 'EMAIL_NOT_VERIFIED') {
      redirectToVerify()
    } else {
      error.value = e instanceof Error ? e.message : 'Login failed. Please try again.'
    }
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

      <p v-if="error" class="auth-error">{{ error }}</p>

      <!-- ── OTP mode ── -->
      <template v-if="mode === 'otp'">

        <!-- Step 1: email -->
        <template v-if="otpStep === 'email'">
          <p class="otp-hint">Enter your email and we'll send you a sign-in code.</p>
          <form class="auth-form" @submit.prevent="handleSendOtp" novalidate>
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
              {{ loading ? 'Sending…' : 'Send Code' }}
            </button>
          </form>
        </template>

        <!-- Step 2: OTP input -->
        <template v-else>
          <p class="otp-hint">
            We sent a 6-digit code to<br><strong>{{ email }}</strong>
          </p>
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
          <button class="btn-primary" :disabled="loading || code.length < 6" @click="handleVerifyOtp">
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
          <div class="resend-row">
            <span class="hint">Didn't receive it? Check your spam folder.</span>
            <button class="resend-btn" :disabled="cooldown > 0" @click="handleResendOtp">
              {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code' }}
            </button>
          </div>
          <button class="back-btn" @click="otpStep = 'email'; error = ''">← Change email</button>
        </template>

        <p class="switch-hint">
          <button class="link-btn" @click="switchMode('password')">Use password instead</button>
        </p>
      </template>

      <!-- ── Password mode ── -->
      <template v-else>
        <form class="auth-form" @submit.prevent="handlePasswordLogin" novalidate>
          <div class="field">
            <label for="email-pw">Email address</label>
            <input
              id="email-pw"
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
              <RouterLink to="/forgot-password" class="label-link">Forgot?</RouterLink>
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
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <p class="switch-hint">
          <button class="link-btn" @click="switchMode('otp')">Sign in with email code instead</button>
        </p>
      </template>

      <p class="auth-footer">
        Don't have an account?
        <RouterLink to="/register" class="link">Sign up free</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--bg); }
.auth-card { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: 36px 32px; box-shadow: var(--shadow); display: flex; flex-direction: column; align-items: center; }
.auth-brand { text-align: center; margin-bottom: 28px; }
.brand-logo { width: 40px; height: 40px; background: var(--ink); color: #FAF8F4; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--serif); font-weight: 700; font-size: 18px; margin: 0 auto 10px; }
.brand-name { font-family: var(--serif); font-size: 20px; font-weight: 500; color: var(--ink); margin-bottom: 4px; }
.brand-tagline { font-size: 13px; color: var(--ink-3); margin: 0; }
.auth-tabs { display: flex; border-bottom: 1px solid var(--line); margin-bottom: 24px; width: 100%; }
.tab { flex: 1; padding: 10px; text-align: center; font-size: 14px; font-weight: 500; color: var(--ink-3); text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color .15s, border-color .15s; }
.tab.router-link-active { color: var(--ink); border-bottom-color: var(--gold); }
.auth-error { color: #c0392b; font-size: 13px; margin: 0 0 16px; text-align: center; width: 100%; }
.otp-hint { font-size: 14px; color: var(--ink-3); text-align: center; margin: 0 0 20px; line-height: 1.5; }
.auth-form { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.label-link { float: right; font-size: 12px; font-weight: 400; color: var(--gold); }
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
.switch-hint { margin-top: 16px; font-size: 13px; color: var(--ink-3); text-align: center; }
.link-btn { background: none; border: none; color: var(--gold); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; }
.auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--ink-3); }
.link { color: var(--gold); font-weight: 600; }
</style>
