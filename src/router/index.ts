import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import HomePage from '../pages/HomePage.vue'
import ProductDetailPage from '../pages/ProductDetailPage.vue'
import CartPage from '../pages/CartPage.vue'
import OrderConfirmationPage from '../pages/OrderConfirmationPage.vue'
import OrdersPage from '../pages/OrdersPage.vue'
import PaymentPage from '../pages/PaymentPage.vue'
import AccountPage from '../pages/AccountPage.vue'
import { getToken, getRole } from '../services/auth'

const AdminDashboard = () => import('../pages/admin/AdminDashboard.vue')
const AdminProducts = () => import('../pages/admin/AdminProducts.vue')
const AdminProductDetail = () => import('../pages/admin/AdminProductDetail.vue')
const AdminOrders = () => import('../pages/admin/AdminOrders.vue')
const AdminCategories = () => import('../pages/admin/AdminCategories.vue')
const AdminColors = () => import('../pages/admin/AdminColors.vue')
const AdminSizes = () => import('../pages/admin/AdminSizes.vue')

const AUTH_REDIRECT = ['/login', '/register']
const OPEN_ROUTES = ['/', '/login', '/register']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/products/:id', component: ProductDetailPage },
    { path: '/cart', component: CartPage },
    { path: '/orders', component: OrdersPage },
    { path: '/orders/confirmation', component: OrderConfirmationPage },
    { path: '/payment/:id', component: PaymentPage },
    { path: '/account', component: AccountPage },
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
    { path: '/admin', component: AdminDashboard },
    { path: '/admin/products', component: AdminProducts },
    { path: '/admin/products/:id', component: AdminProductDetail },
    { path: '/admin/orders', component: AdminOrders },
    { path: '/admin/categories', component: AdminCategories },
    { path: '/admin/colors', component: AdminColors },
    { path: '/admin/sizes', component: AdminSizes },
  ],
})

router.beforeEach((to) => {
  const token = getToken()
  const isOpen = OPEN_ROUTES.includes(to.path) || to.path.startsWith('/products/')
  if (!token && !isOpen) return '/login'
  if (token && AUTH_REDIRECT.includes(to.path)) return '/'
  if (to.path.startsWith('/admin') && getRole() !== 'ADMIN') return '/'
})

export default router
