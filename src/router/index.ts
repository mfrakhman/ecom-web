import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import HomePage from '../pages/HomePage.vue'
import { getToken } from '../services/auth'

const PUBLIC_ROUTES = ['/login', '/register']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
  ],
})

router.beforeEach((to) => {
  const token = getToken()
  if (!token && !PUBLIC_ROUTES.includes(to.path)) return '/login'
  if (token && PUBLIC_ROUTES.includes(to.path)) return '/'
})

export default router
