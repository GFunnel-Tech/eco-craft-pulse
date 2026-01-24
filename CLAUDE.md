# CLAUDE.md - AI Assistant Guidelines for eco-craft-pulse

## Project Overview

This is **KORR** (branded as "KORR Performance Apparel") - a modern e-commerce platform for premium athletic wear. The project is a React-based single-page application built with Vite, using Supabase as the backend and integrating with Lightspeed eCom API for external inventory/order management.

**Brand Identity:** Premium performance apparel with an editorial, minimal black-and-white aesthetic with olive-grey accents.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Component library (Radix-based) |
| **Supabase** | Backend (auth, database, storage) |
| **TanStack Query** | Server state management |
| **React Router v6** | Client-side routing |
| **React Hook Form + Zod** | Form handling & validation |
| **Framer Motion** | Animations |
| **Vitest** | Unit testing |
| **Lightspeed eCom API** | External e-commerce integration (optional) |

## Quick Commands

```bash
# Development
npm run dev          # Start dev server on port 8080

# Build
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build

# Quality
npm run lint         # Run ESLint
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (DO NOT MODIFY directly)
│   ├── layout/          # Header, Footer, MainLayout
│   ├── home/            # Homepage sections (Hero, Featured, etc.)
│   ├── products/        # ProductCard, SizeGuideDialog
│   ├── shop/            # ProductFilters, ProductSort
│   ├── cart/            # CartDrawer
│   ├── account/         # Account management components
│   └── admin/           # Admin portal components
├── pages/
│   ├── admin/           # Admin portal pages
│   ├── Index.tsx        # Homepage
│   ├── Shop.tsx         # Product listing page
│   ├── ProductDetail.tsx # Single product page
│   ├── Checkout.tsx     # Checkout flow
│   └── ...              # Other pages
├── hooks/
│   ├── useAuth.tsx      # Authentication context & hook
│   ├── useCart.tsx      # Cart context & hook
│   ├── useWishlist.tsx  # Wishlist context & hook
│   └── use-toast.ts     # Toast notifications
├── integrations/
│   └── supabase/
│       ├── client.ts    # Supabase client instance
│       └── types.ts     # Auto-generated DB types (DO NOT MODIFY)
├── lib/
│   ├── constants.ts     # App constants, navigation, branding
│   └── utils.ts         # Utility functions (cn, formatCurrency)
├── types/
│   └── index.ts         # TypeScript interfaces for domain models
├── test/
│   ├── setup.ts         # Vitest setup
│   └── example.test.ts  # Test example
└── index.css            # Global styles & CSS variables
```

## Key Architecture Patterns

### 1. State Management

**Context Providers** (wrapped in `App.tsx`):
- `AuthProvider` - Authentication state via Supabase Auth
- `CartProvider` - Shopping cart state (persisted in Supabase)
- `WishlistProvider` - User wishlist management
- `QueryClientProvider` - TanStack Query for server state

**Usage Pattern:**
```tsx
// In components
const { user, isAdmin, signIn, signOut } = useAuth();
const { items, addItem, removeItem, subtotal } = useCart();
const { isInWishlist, toggleItem } = useWishlist();
```

### 2. Routing

Routes are defined in `src/App.tsx`. Pattern:
- `/` - Homepage
- `/shop` - All products
- `/shop/:category` - Category-filtered products
- `/product/:slug` - Product detail page
- `/checkout` - Checkout flow
- `/account` - User account (with tab query param)
- `/admin/*` - Admin portal routes

**Important:** Add new routes ABOVE the catch-all `*` route.

### 3. Supabase Integration

```tsx
import { supabase } from "@/integrations/supabase/client";

// Query example
const { data, error } = await supabase
  .from('products')
  .select('*, category:categories(*), images:product_images(*)')
  .eq('is_active', true);
```

**Environment Variables Required:**
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
```

### 4. Styling Conventions

**Tailwind + CSS Variables:**
- Colors defined as HSL in `src/index.css` via CSS variables
- Use semantic color names: `primary`, `secondary`, `muted`, `accent`, `destructive`
- Brand colors: `soft-grey`, `editorial-grey`, `olive-grey`, `body-text`, `divider`

**Typography:**
- Headings: `font-display` (Playfair Display, serif)
- Body text: `font-sans` (Inter, sans-serif)
- Always specify `font-sans` on body text for consistency

**Component Styling:**
```tsx
import { cn } from "@/lib/utils";

// Merging classes safely
<div className={cn("base-classes", conditional && "conditional-class", className)} />
```

### 5. Component Patterns

**shadcn/ui Components:**
Located in `src/components/ui/`. These are copy-pasted from shadcn/ui and can be customized. Common ones:
- `Button`, `Input`, `Card`, `Badge`
- `Dialog`, `Sheet`, `DropdownMenu`
- `Form` (with react-hook-form integration)
- `Toast`, `Sonner` (notifications)

**Custom Component Pattern:**
```tsx
interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  // Hook usage at top
  const { addItem } = useCart();

  // Event handlers
  const handleAddToCart = async () => { ... };

  return (
    <motion.div className={cn("group relative", className)}>
      {/* Component content */}
    </motion.div>
  );
}
```

## Database Schema (Supabase)

Key tables:
- `products` - Product catalog
- `categories` - Product categories
- `product_images` - Product images (linked to products)
- `product_variants` - Size/color variants with stock
- `cart_items` - Shopping cart (user_id OR session_id)
- `orders` / `order_items` - Order management
- `profiles` - User profile data
- `user_roles` - Admin role assignments
- `addresses` - User shipping/billing addresses
- `wishlist_items` - User wishlists
- `newsletter_subscribers` - Email subscriptions

## Type Definitions

Core types in `src/types/index.ts`:
- `Product`, `Category`, `ProductImage`, `ProductVariant`
- `CartItem`, `WishlistItem`
- `Order`, `OrderItem`, `OrderStatus`
- `Address`, `Profile`, `UserRole`

## Testing

**Framework:** Vitest with React Testing Library

```bash
npm run test        # Run once
npm run test:watch  # Watch mode
```

**Test file location:** Place tests in `src/test/` or alongside components as `*.test.ts(x)`

**Setup:** `src/test/setup.ts` configures `@testing-library/jest-dom` matchers

## Code Conventions

### Do's

1. **Use path aliases:** Always import with `@/` prefix
   ```tsx
   import { Button } from "@/components/ui/button";
   import { useAuth } from "@/hooks/useAuth";
   ```

2. **Use existing hooks:** Leverage `useAuth`, `useCart`, `useWishlist` for state

3. **Format prices consistently:**
   ```tsx
   import { formatPrice } from "@/lib/constants";
   formatPrice(29.99) // "$29.99"
   ```

4. **Use cn() for class merging:**
   ```tsx
   import { cn } from "@/lib/utils";
   ```

5. **Follow component file naming:** PascalCase for components, camelCase for hooks

6. **Use Framer Motion for animations:** Especially in product cards and transitions

7. **Toast notifications:**
   ```tsx
   import { toast } from "sonner";
   toast.success("Item added to cart");
   toast.error("Something went wrong");
   ```

### Don'ts

1. **Don't modify `src/integrations/supabase/types.ts`** - It's auto-generated

2. **Don't bypass TypeScript:** Avoid `any` types; use proper interfaces

3. **Don't hardcode colors:** Use CSS variables/Tailwind classes

4. **Don't create new CSS files:** Use Tailwind utilities or add to `index.css`

5. **Don't skip form validation:** Use Zod schemas with react-hook-form

## Admin Portal

Located at `/admin/*` routes:
- Dashboard with sales metrics
- Product management (CRUD, CSV import)
- Order management with status updates
- Customer management
- Settings (store config, branding)

**Access Control:** Requires `isAdmin` from `useAuth()` (checked via `user_roles` table)

## External Integrations

### Lightspeed eCom API (Optional)

Documentation: `docs/lightspeed-ecom-api-integration-guide.md`

Used for:
- External product catalog sync
- Order forwarding
- Inventory management

Environment variables (when enabled):
```
LIGHTSPEED_STORE_ID=<store-id>
LIGHTSPEED_API_TOKEN=<api-token>
LIGHTSPEED_API_BASE_URL=https://app.ecwid.com/api/v3
```

## Common Tasks

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx` (above catch-all)
3. Wrap with `MainLayout` if needed

### Adding a New Product Field

1. Update Supabase table schema
2. Regenerate types (update `src/integrations/supabase/types.ts`)
3. Update `src/types/index.ts` interfaces
4. Update relevant components/forms

### Adding a New shadcn/ui Component

```bash
npx shadcn-ui@latest add <component-name>
```
Components are added to `src/components/ui/`

## Performance Considerations

1. **Image optimization:** Use responsive images with proper `srcset`
2. **Code splitting:** React.lazy() for admin routes
3. **TanStack Query caching:** Leverage stale-while-revalidate patterns
4. **Supabase queries:** Use select() to fetch only needed fields

## Environment Files

- `.env` - Local environment variables (gitignored)
- Required variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

## Build & Deploy

Production build outputs to `dist/` directory:
```bash
npm run build
```

The project is configured for Lovable deployment but can be deployed to any static hosting (Vercel, Netlify, etc.).
