import { ref } from 'vue'

export const isServerDown = ref(false)

export function setServerDown() {
  isServerDown.value = true
}

export function clearServerDown() {
  isServerDown.value = false
}
