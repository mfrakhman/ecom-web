# ecom-web

Frontend for the e-commerce platform. Built with Vue 3 and Vite, deployed on Vercel.

**Tech:** Vue 3 · TypeScript · Vite · Vue Router

**Live:** [mfrakhman.web.id](https://mfrakhman.web.id)

---

## Pages

| Route | Auth | Description |
|---|---|---|
| `/` | Public | Home — product listing |
| `/products/:id` | Public | Product detail with SKU selection |
| `/cart` | User | Shopping cart |
| `/orders` | User | Order history |
| `/orders/:id` | User | Order detail |
| `/payment/:orderId` | User | QRIS payment page |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/admin/dashboard` | Admin | Admin overview |
| `/admin/products` | Admin | Manage products & SKUs |
| `/admin/products/:id` | Admin | Product detail & edit |
| `/admin/orders` | Admin | Manage all orders |

---

## System Flow

### Login & Token Management

```
User enters credentials
  │
  ▼
[ LoginPage.vue ]
  │
  └── POST /api/auth/login
        │
        └── Receive { accessToken, refreshToken }
              ├── accessToken stored in memory (reactive state)
              └── refreshToken stored in localStorage
```

### Auth Token Auto-Refresh (safeFetch)

```
Any API call
  │
  ▼
[ http.ts — safeFetch ]
  │
  ├── Attach Authorization: Bearer <accessToken>
  ├── Make request
  │
  ├── Response 200 → return data
  │
  └── Response 401 (token expired)
        │
        ├── POST /api/auth/refresh (with refreshToken)
        ├── Store new accessToken
        └── Retry original request automatically
```

### Add to Cart & Checkout Flow

```
User selects SKU + quantity on ProductDetailPage.vue
  │
  ▼
POST /api/order/cart/items
  │
  ▼
CartPage.vue — user reviews cart
  │
  ▼
POST /api/order/cart/checkout
  │
  ├── Gateway validates SKUs + locks prices
  ├── Order created (status: PENDING)
  └── Async: RabbitMQ stock reservation → payment charge creation
        │
        ▼
OrderConfirmationPage.vue
  │
  ▼
PaymentPage.vue — polls GET /api/payment/order/:id
  │
  └── Display QRIS code — user scans and pays
```

### Admin Product Management

```
Admin on AdminProducts.vue
  │
  ├── GET /api/products → list all products
  │
  ├── POST /api/products → create product + SKUs
  │
  ├── POST /api/products/:id/image → upload image (multipart)
  │        └── Stored in MinIO, URL returned and saved on product
  │
  └── POST /api/products/skus/:id/restock → add stock to SKU
```

---

## Project Structure

```
ecom-web/
└── src/
    ├── pages/
    │   ├── HomePage.vue               # Product grid listing
    │   ├── ProductDetailPage.vue      # SKU selector + add to cart
    │   ├── CartPage.vue               # Cart review + checkout button
    │   ├── OrdersPage.vue             # User order history
    │   ├── OrderConfirmationPage.vue  # Post-checkout confirmation
    │   ├── PaymentPage.vue            # QRIS code display + status polling
    │   ├── LoginPage.vue
    │   ├── RegisterPage.vue
    │   └── admin/
    │       ├── AdminDashboard.vue
    │       ├── AdminProducts.vue      # Product + SKU management
    │       ├── AdminProductDetail.vue # Edit product, manage SKUs, upload images
    │       └── AdminOrders.vue        # View and manage all orders
    ├── components/
    │   ├── Navbar.vue
    │   ├── AppFooter.vue
    │   ├── ProductCard.vue
    │   └── AdminLayout.vue
    ├── services/
    │   ├── http.ts                    # safeFetch — Axios wrapper with auto token refresh
    │   ├── auth.ts                    # Login, register, refresh, me
    │   ├── cart.ts                    # Cart operations
    │   ├── orders.ts                  # Order fetch
    │   └── admin.ts                   # Admin product/order management
    ├── composables/
    │   ├── useCart.ts                 # Cart state management
    │   └── useServerError.ts          # Parse and display API errors
    └── router/index.ts                # Route definitions + auth guards
```

---

## Environment Variables

```env
# .env.development — API proxied to local gateway
VITE_API_URL=/api/local

# .env.production — API proxied to VPS
VITE_API_URL=/api
```

The Vite dev server proxies requests:
- `/api/local/*` → `http://localhost:3000/api/*` (local gateway)
- `/api/*` → `https://api.mfrakhman.web.id/api/*` (production)

---

## Running Locally

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

Make sure the API gateway is running on port `3000`.

## Build & Deploy

```bash
npm run build
```

Deployed automatically to Vercel on push to `main`.

## Part of

[E-Commerce Microservices Platform](../README.md)
