import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import HomePage from '../pages/HomePage.vue'
import ProductDetailPage from '../pages/ProductDetailPage.vue'
import { getToken, getRole } from '../services/auth'

const AdminDashboard = () => import('../pages/admin/AdminDashboard.vue')
const AdminProducts = () => import('../pages/admin/AdminProducts.vue')
const AdminProductDetail = () => import('../pages/admin/AdminProductDetail.vue')

const PUBLIC_ROUTES = ['/login', '/register']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/products/:id', component: ProductDetailPage },
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
    { path: '/admin', component: AdminDashboard },
    { path: '/admin/products', component: AdminProducts },
    { path: '/admin/products/:id', component: AdminProductDetail },
  ],
})

router.beforeEach((to) => {
  const token = getToken()
  if (!token && !PUBLIC_ROUTES.includes(to.path)) return '/login'
  if (token && PUBLIC_ROUTES.includes(to.path)) return '/'
  if (to.path.startsWith('/admin') && getRole() !== 'ADMIN') return '/'
})

export default router
