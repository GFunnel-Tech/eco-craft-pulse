# KORR E-Commerce Platform - Project State Documentation

> **Last Updated:** January 2026  
> **Brand:** KORR Performance Apparel  
> **Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Supabase (Lovable Cloud)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Pages & Routes](#pages--routes)
4. [Components](#components)
5. [Hooks & State Management](#hooks--state-management)
6. [Database Schema](#database-schema)
7. [Backend Functions](#backend-functions)
8. [Authentication & Authorization](#authentication--authorization)
9. [Features by Portal](#features-by-portal)
10. [Design System](#design-system)
11. [External Integrations](#external-integrations)

---

## Project Overview

KORR is a premium performance apparel e-commerce platform featuring:
- **Customer Storefront**: Browse, filter, and purchase athletic wear
- **Client Portal**: Manage orders, addresses, wishlist, and profile
- **Admin Portal**: Full store management (products, orders, customers, settings)

### URLs
- **Preview:** https://id-preview--2934562c-5a12-4d6a-906d-a7aa220ec4f1.lovable.app
- **Published:** https://eco-craft-pulse.lovable.app

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React SPA (Vite)                       │
├─────────────────────────────────────────────────────────────┤
│  Providers: Auth → Cart → Wishlist → Query → Tooltip        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Storefront  │  │Client Portal │  │ Admin Portal │      │
│  │   (Public)   │  │ (Protected)  │  │ (Admin Only) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              Supabase (Lovable Cloud Backend)               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │Database │ │ Storage │ │Edge Func│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Provider Hierarchy
```typescript
QueryClientProvider
  └── AuthProvider
       └── CartProvider
            └── WishlistProvider
                 └── TooltipProvider
                      └── BrowserRouter
```

---

## Pages & Routes

### Public Routes (Storefront)

| Route | Page Component | Description |
|-------|----------------|-------------|
| `/` | `Index.tsx` | Homepage with hero, featured products, categories |
| `/shop` | `Shop.tsx` | Product listing with filters and sorting |
| `/shop/:category` | `Shop.tsx` | Category-filtered product listing |
| `/product/:slug` | `ProductDetail.tsx` | Product detail with variant selection |
| `/login` | `Login.tsx` | User login form |
| `/register` | `Register.tsx` | User registration with validation |
| `/forgot-password` | `ForgotPassword.tsx` | Password reset request |
| `/reset-password` | `ResetPassword.tsx` | Password reset completion |
| `*` | `NotFound.tsx` | 404 error page |

### Protected Routes (Client Portal)

| Route | Page Component | Description |
|-------|----------------|-------------|
| `/account` | `Account.tsx` | User account hub with tabs |
| `/checkout` | `Checkout.tsx` | Cart review and shipping |
| `/order-confirmation/:orderNumber` | `OrderConfirmation.tsx` | Order success page |

### Admin Routes (Admin Portal)

| Route | Page Component | Description |
|-------|----------------|-------------|
| `/admin` | `AdminDashboard.tsx` | Sales analytics and metrics |
| `/admin/products` | `AdminProducts.tsx` | Product catalog management |
| `/admin/orders` | `AdminOrders.tsx` | Order fulfillment and tracking |
| `/admin/customers` | `AdminCustomers.tsx` | Customer profiles and history |
| `/admin/settings` | `AdminSettings.tsx` | Store configuration |

---

## Components

### Layout Components (`src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `MainLayout.tsx` | Wrapper with Header and Footer |
| `Header.tsx` | Navigation, cart icon, user menu |
| `Footer.tsx` | Links, newsletter signup, social |

### Home Components (`src/components/home/`)

| Component | Purpose |
|-----------|---------|
| `HeroSection.tsx` | Full-screen editorial hero with CTA |
| `FeaturedProducts.tsx` | Grid of featured products |
| `CategoryShowcase.tsx` | Horizontal category carousel |
| `NewArrivals.tsx` | Latest products grid |
| `PromoSection.tsx` | Promotional banner/content |
| `NewsletterSection.tsx` | Email subscription form |

### Product Components (`src/components/products/`)

| Component | Purpose |
|-----------|---------|
| `ProductCard.tsx` | Product preview card with quick actions |
| `SizeGuideDialog.tsx` | Size chart modal |

### Shop Components (`src/components/shop/`)

| Component | Purpose |
|-----------|---------|
| `ProductFilters.tsx` | Category, price, size, color filters |
| `ProductSort.tsx` | Sort dropdown (price, date, name) |

### Cart Components (`src/components/cart/`)

| Component | Purpose |
|-----------|---------|
| `CartDrawer.tsx` | Slide-out cart panel |

### Account Components (`src/components/account/`)

| Component | Purpose |
|-----------|---------|
| `AccountProfile.tsx` | User profile editing |
| `AccountOrders.tsx` | Order history and tracking |
| `AccountAddresses.tsx` | Saved addresses management |
| `AccountWishlist.tsx` | Saved products list |

### Admin Components (`src/components/admin/`)

| Component | Purpose |
|-----------|---------|
| `AdminLayout.tsx` | Admin sidebar navigation wrapper |
| `ProductForm.tsx` | Tabbed product editor (Details, Variants, Images, SEO) |
| `ProductVariantManager.tsx` | Size/color variant management with HEX picker |
| `ProductImageManager.tsx` | Image upload, ordering, color assignment |
| `CSVImportDialog.tsx` | Bulk product import modal |

### UI Components (`src/components/ui/`)

Shadcn/ui component library including:
- Buttons, Cards, Dialogs, Dropdowns
- Forms, Inputs, Selects, Checkboxes
- Tables, Tabs, Accordions
- Toasts, Tooltips, Popovers
- And 40+ more components

---

## Hooks & State Management

### Custom Hooks (`src/hooks/`)

| Hook | Purpose | Context Provider |
|------|---------|------------------|
| `useAuth.tsx` | Authentication state, sign in/up/out, profile, admin check | `AuthProvider` |
| `useCart.tsx` | Cart items, add/remove/update, subtotal calculation | `CartProvider` |
| `useWishlist.tsx` | Wishlist items, toggle functionality | `WishlistProvider` |
| `use-mobile.tsx` | Mobile breakpoint detection | — |
| `use-toast.ts` | Toast notification trigger | — |

### Auth Context Values
```typescript
{
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (email, password, firstName?, lastName?) => Promise;
  signIn: (email, password) => Promise;
  signOut: () => Promise;
  updateProfile: (updates) => Promise;
  refreshAuthState: () => Promise;
}
```

### Cart Context Values
```typescript
{
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (productId, variantId?, quantity?) => Promise;
  updateQuantity: (itemId, quantity) => Promise;
  removeItem: (itemId) => Promise;
  clearCart: () => Promise;
}
```

### Wishlist Context Values
```typescript
{
  items: WishlistItem[];
  itemCount: number;
  isLoading: boolean;
  isInWishlist: (productId) => boolean;
  addItem: (productId) => Promise;
  removeItem: (productId) => Promise;
  toggleItem: (productId) => Promise;
}
```

---

## Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `products` | Product catalog | Public read, admin write |
| `product_variants` | Size/color variants with stock | Public read, admin write |
| `product_images` | Product images with color association | Public read, admin write |
| `categories` | Product categories | Public read, admin write |
| `cart_items` | Shopping cart (user or session based) | Owner access |
| `wishlist` | User saved products | Owner access |
| `orders` | Customer orders | Owner read, admin full |
| `order_items` | Order line items | Owner read, admin full |
| `profiles` | User profile data | Owner access, admin read |
| `addresses` | Saved shipping addresses | Owner access, admin read |
| `user_roles` | Admin/customer role assignment | Owner read, admin full |
| `newsletter_subscribers` | Email subscriptions | Public insert, admin read |
| `sync_logs` | Lightspeed sync tracking | Admin only |

### Key Relationships

```
products
  ├── product_variants (1:many)
  ├── product_images (1:many)
  ├── categories (many:1)
  ├── cart_items (1:many)
  └── wishlist (1:many)

orders
  └── order_items (1:many)
       ├── products (many:1)
       └── product_variants (many:1)

profiles
  ├── user_roles (1:1)
  ├── addresses (1:many)
  ├── wishlist (1:many)
  └── orders (1:many)
```

### Database Functions

| Function | Purpose |
|----------|---------|
| `is_admin()` | Check if current user has admin role |
| `has_role(user_id, role)` | Check specific role for user |
| `handle_new_user()` | Trigger: Create profile on signup |
| `generate_order_number()` | Trigger: Auto-generate order numbers |
| `update_updated_at_column()` | Trigger: Timestamp updates |

---

## Backend Functions

### Edge Functions (`supabase/functions/`)

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `lightspeed-webhook` | POST /lightspeed-webhook | Receive Lightspeed eCom webhooks for product/order sync |

---

## Authentication & Authorization

### Auth Flow
1. **Registration**: Email/password with Zod validation + password strength
2. **Login**: Email/password authentication
3. **Password Reset**: Email-based reset flow
4. **Session**: JWT tokens managed by Supabase Auth
5. **Auto-confirm**: Email confirmations are auto-confirmed (dev mode)

### Role-Based Access Control (RBAC)

| Role | Access |
|------|--------|
| `customer` | Default role, storefront + account |
| `admin` | Full access including admin portal |

### Admin Verification
```typescript
// In useAuth.tsx
const checkAdminRole = async (userId: string) => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  setIsAdmin(!!data);
};
```

---

## Features by Portal

### Storefront Features

- [x] Editorial homepage with animated hero
- [x] Category-based navigation
- [x] Product listing with filters (category, price, size, color)
- [x] Product sorting (price, date, name)
- [x] Product detail with image gallery
- [x] Color-filtered product images
- [x] Size/color variant selection
- [x] Size guide modal
- [x] Add to cart (guest or authenticated)
- [x] Wishlist functionality
- [x] Responsive mobile design

### Client Portal Features

- [x] Order history with status tracking
- [x] Multiple saved addresses
- [x] Default address selection
- [x] Profile editing (name, email, phone)
- [x] Marketing opt-in preferences
- [x] Wishlist management
- [x] Checkout flow

### Admin Portal Features

- [x] Sales dashboard with metrics
- [x] Product CRUD with tabbed editor
- [x] Multi-variant management (size/color)
- [x] HEX color picker with presets
- [x] Image management with color association
- [x] CSV product import
- [x] Order management with status updates
- [x] Customer list with order history
- [x] Store settings (general, shipping, notifications)

---

## Design System

### Theme Colors (HSL)

```css
:root {
  --background: 30 25% 97%;
  --foreground: 30 10% 15%;
  --primary: 28 60% 50%;
  --primary-foreground: 30 25% 97%;
  --secondary: 30 10% 15%;
  --secondary-foreground: 30 25% 97%;
  --muted: 30 15% 92%;
  --accent: 28 60% 50%;
  --destructive: 0 84% 60%;
}
```

### Typography

- **Display Font**: Custom display font for headings
- **Body Font**: System sans-serif stack

### Breakpoints

| Name | Size |
|------|------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

---

## External Integrations

### Lightspeed eCom

- **Purpose**: Product and order synchronization
- **Method**: Webhook-based sync via edge function
- **Status**: Configured, pending activation
- **Docs**: `docs/lightspeed-ecom-api-integration-guide.md`

### Planned Integrations

- [ ] Stripe (payment processing)
- [ ] Email service (transactional emails)

---

## File Structure

```
src/
├── App.tsx                    # Root component with routing
├── main.tsx                   # Entry point
├── index.css                  # Global styles & design tokens
├── components/
│   ├── ui/                    # Shadcn components (40+)
│   ├── layout/                # Header, Footer, MainLayout
│   ├── home/                  # Homepage sections
│   ├── products/              # ProductCard, SizeGuide
│   ├── shop/                  # Filters, Sort
│   ├── cart/                  # CartDrawer
│   ├── account/               # Profile, Orders, Addresses, Wishlist
│   └── admin/                 # ProductForm, Layout, Managers
├── pages/
│   ├── admin/                 # Admin portal pages
│   ├── Index.tsx              # Homepage
│   ├── Shop.tsx               # Product listing
│   ├── ProductDetail.tsx      # Product page
│   ├── Account.tsx            # User account
│   ├── Checkout.tsx           # Checkout flow
│   └── ...                    # Auth pages
├── hooks/
│   ├── useAuth.tsx            # Auth context
│   ├── useCart.tsx            # Cart context
│   └── useWishlist.tsx        # Wishlist context
├── types/
│   └── index.ts               # TypeScript interfaces
├── lib/
│   ├── constants.ts           # App constants, navigation
│   └── utils.ts               # Utility functions
└── integrations/
    └── supabase/
        ├── client.ts          # Supabase client (auto-generated)
        └── types.ts           # DB types (auto-generated)

supabase/
├── config.toml                # Supabase configuration
├── functions/
│   └── lightspeed-webhook/    # Edge function
└── migrations/                # Database migrations

docs/
├── PROJECT_STATE.md           # This file
└── lightspeed-ecom-api-integration-guide.md
```

---

## Development Notes

### Key Patterns

1. **Provider Pattern**: Auth, Cart, Wishlist state via React Context
2. **Server State**: React Query for data fetching
3. **Form Handling**: React Hook Form + Zod validation
4. **Styling**: Tailwind CSS with design tokens
5. **Animation**: Framer Motion for UI transitions

### Cart Session Handling

- Anonymous users: Cart stored with `session_id` in localStorage
- Authenticated users: Cart stored with `user_id`
- On login: Anonymous cart migrates to user account

### Image Color Filtering

Product images support `color_hex` field for variant-specific images:
- Images with matching `color_hex` shown when that color is selected
- Images without `color_hex` (general images) always shown as fallback

---

*Generated for KORR Performance Apparel E-Commerce Platform*
