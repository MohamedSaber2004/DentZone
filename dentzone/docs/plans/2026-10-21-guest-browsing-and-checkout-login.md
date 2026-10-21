# Guest Browsing, Local Cart & Checkout Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow unauthenticated visitors to browse products, view details, and manage a local cart, prompting for login only when proceeding to checkout, with seamless post-login cart synchronization.

**Architecture:** Maintain a hybrid cart within `CartService` that stores items in `localStorage` for guests and maps them to a synthetic `CartDto`. When the guest proceeds to checkout, they are redirected to `/auth/login?redirect=/checkout`; upon successful authentication, all guest cart items are posted to the backend API and the user is routed to `/checkout`.

**Tech Stack:** Vue 3 (Composition API, `<script setup lang="ts">`), Vue Router 4, TypeScript, LocalStorage API, Vite.

---

### File Structure Map

- **Modify:** `src/domain/models/cart.ts` (Add `GuestCartItem` and extended `AddToCartInput` fields)
- **Modify:** `src/router/index.ts` (Remove `requiresAuth: true` from `product-details` and `cart` routes)
- **Modify:** `src/application/cart.service.ts` (Implement local guest cart operations, synthetic cart, and `syncGuestCartToServer()`)
- **Modify:** `src/components/products/ProductCard.vue` (Enable cart button for guests; route favorite to login for guests)
- **Modify:** `src/views/ProductDetailsView.vue` (Allow guest add-to-cart; route favorite to login for guests)
- **Modify:** `src/views/CartView.vue` (Redirect guests to login with redirect param on checkout click)
- **Modify:** `src/components/auth/LoginForm.vue` (Await guest cart sync prior to redirection)

---

### Task 1: Update Types in `src/domain/models/cart.ts`

**Files:**
- Modify: `src/domain/models/cart.ts`

- [ ] **Step 1: Add `GuestCartItem` interface and optional fields to `AddToCartInput`**

Update `src/domain/models/cart.ts` to export:
```ts
export interface GuestCartItem {
  productId: string
  inventoryId: string
  quantity: number
  name: string
  arabicName?: string
  image?: string
  supplier?: string
  salesPrice: number
  stockQuantity: number
  maxQuantity: number
}
```
And add optional `image`, `supplier`, `salesPrice`, and `arabicName` to `AddToCartInput` so that callers can provide metadata needed for guest cart display.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/domain/models/cart.ts
git commit -m "feat(cart): add GuestCartItem model and extend AddToCartInput"
```

---

### Task 2: Update Route Guards in `src/router/index.ts`

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: Make `product-details` and `cart` routes accessible to guests**

In `src/router/index.ts`:
- On route `product-details` (`/categories/inventory/:inventoryUserId/product/:productId`): remove `requiresAuth: true`.
- On route `cart` (`/cart`): remove `requiresAuth: true`.
- Keep `requiresAuth: true` for `checkout`, `orders`, `notifications`, `profile`, and `wishlist`.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/router/index.ts
git commit -m "feat(router): allow guest access to product details and cart routes"
```

---

### Task 3: Implement Guest Cart & Sync in `CartService`

**Files:**
- Modify: `src/application/cart.service.ts`

- [ ] **Step 1: Implement local storage management and synthetic cart**

In `src/application/cart.service.ts`:
1. Define storage key `const GUEST_CART_KEY = 'dentzone_guest_cart'`.
2. Add helper methods `readGuestCart(): GuestCartItem[]` and `writeGuestCart(items: GuestCartItem[]): void`.
3. Build a helper `createSyntheticCart(items: GuestCartItem[]): CartDto` that constructs the structure expected by `CartView` (matching `CartDto`, `CartItemDto`, `ProductDto`, `ProductPriceDto`, `InventoryUserDto`).
4. Update `init()`: if not authenticated, load `cart.value = createSyntheticCart(readGuestCart())`.
5. Update `add(input)`:
   - If user is authenticated: proceed with existing `cartRepository.addToCart(...)`.
   - If guest: upsert item into `localStorage`, clamp quantity, update `cart.value = createSyntheticCart(...)`, show success toast with "View Cart" action.
6. Update `updateQuantity(input)`:
   - If user is authenticated: call `cartRepository.updateQuantity(...)`.
   - If guest: update quantity in local items, write to storage, update `cart.value`.
7. Update `remove(input)`:
   - If user is authenticated: call `cartRepository.removeFromCart(...)`.
   - If guest: filter item out of local items, write to storage, update `cart.value`.
8. Implement `syncGuestCartToServer(): Promise<void>`:
   - Read local guest items.
   - If user is authenticated and items exist:
     - For each item, call `cartRepository.addToCart(...)`.
     - Clear local storage.
     - Call `await this.refresh()`.
9. In constructor watcher: when `authService.user` transitions to authenticated, call `syncGuestCartToServer()`.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/application/cart.service.ts
git commit -m "feat(cart): implement guest cart in localStorage and post-login sync"
```

---

### Task 4: Update `ProductCard.vue`

**Files:**
- Modify: `src/components/products/ProductCard.vue`

- [ ] **Step 1: Allow guests to click Add to Cart; route unauthenticated favorite to Login**

In `src/components/products/ProductCard.vue`:
1. Change the cart button:
   - Remove `<RouterLink v-else :to="{ name: 'login' }" ...>`
   - Keep a single `<button type="button" class="product-card__cart" ...>` that is clickable by both authenticated users and guests, emitting `add-to-cart`.
2. In favorite button click handler:
   - If `!authService.isAuthenticated`, use router to navigate to `{ name: 'login' }` (or pass redirect).
   - If authenticated, emit `toggle-favorite`.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/products/ProductCard.vue
git commit -m "feat(products): enable add to cart for guests and route guest wishlist to login"
```

---

### Task 5: Update `ProductDetailsView.vue`

**Files:**
- Modify: `src/views/ProductDetailsView.vue`

- [ ] **Step 1: Pass product details to `cartService.add` and handle guest favorite**

In `src/views/ProductDetailsView.vue`:
1. In `addToCart()`:
   - Pass `salesPrice: price.effectiveSalesPrice`, `image: d.images?.[0]`, `supplier: currentStoreName.value`, `arabicName: d.productArabicName` to `cartService.add(...)`.
2. In `addRelatedToCart(product)`:
   - Pass `salesPrice: product.effectiveSalesPrice`, `image: product.images?.[0]`, `supplier: product.inventoryUserName`, `arabicName: product.productArabicName` to `cartService.add(...)`.
3. In `toggleFavorite()` and `toggleRelatedFavorite()`:
   - If `!authService.isAuthenticated`, redirect to `/auth/login`.

- [ ] **Step 2: Run type check**

Run: `npm run type-check`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/views/ProductDetailsView.vue
git commit -m "feat(product-details): support guest cart addition with metadata and redirect guest favorite"
```

---

### Task 6: Update `CartView.vue` and `LoginForm.vue`

**Files:**
- Modify: `src/views/CartView.vue`
- Modify: `src/components/auth/LoginForm.vue`

- [ ] **Step 1: Update checkout button in `CartView.vue`**

In `src/views/CartView.vue`:
1. Import `authService` from `../di/container`.
2. Handle the "Proceed to Checkout" click:
   - If `authService.isAuthenticated`, route to `/checkout`.
   - If guest, route to `/auth/login?redirect=/checkout`.

- [ ] **Step 2: Await guest cart synchronization in `LoginForm.vue`**

In `src/components/auth/LoginForm.vue`:
1. Import `cartService` from `../../di/container`.
2. In `submit()`:
   - Immediately after successful `authService.login(...)`, call `await cartService.syncGuestCartToServer()`.
   - Then navigate to `redirect`.

- [ ] **Step 3: Run type check and verify build**

Run: `npm run build`  
Expected: Build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/views/CartView.vue src/components/auth/LoginForm.vue
git commit -m "feat(checkout): prompt login on checkout and sync guest cart before redirect"
```

---

### Task 7: End-to-End Verification

- [ ] **Step 1: Run type-check and linter**

Run: `npm run type-check` and `npm run lint`  
Expected: PASS without errors.

- [ ] **Step 2: Manual walkthrough verification in browser**

Verify the full scenario:
1. Browse home & product categories as a guest.
2. View product details.
3. Add item from product details & catalog card to cart.
4. Verify cart badge counter updates.
5. Open `/cart` page; verify all items display with correct images, names, suppliers, and totals.
6. Click "Proceed to Checkout" -> redirected to `/auth/login?redirect=%2Fcheckout`.
7. Login -> guest cart is synced to server and user arrives at `/checkout`.
