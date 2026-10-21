# Guest Browsing, Local Cart & Checkout Login Design Spec

**Date:** 2026-10-21  
**Project:** DentZone Frontend  
**Status:** Approved  

---

## 1. Problem Statement & Goals

### Current Behavior:
1. Product Details page (`/categories/inventory/:inventoryUserId/product/:productId`) requires authentication (`requiresAuth: true`), immediately redirecting guests to `/auth/login`.
2. The Cart icon button on `ProductCard.vue` redirects unauthenticated users to `/auth/login`.
3. The Cart page (`/cart`) requires authentication (`requiresAuth: true`).
4. `CartService` returns early and fails if `authService.user` is null.

### Target Goals:
1. Enable unauthenticated visitors (guests) to freely browse products, open and read product details, and add items to their shopping cart.
2. Maintain a persistent local cart in the browser (`localStorage`) for guests with full count and subtotal calculations.
3. Allow guests to open and interact with the Cart page (`/cart`), including updating item quantities and removing items.
4. Defer the login requirement until the visitor clicks **"Proceed to Checkout"** (إتمام الطلب) in the Cart.
5. Redirect the visitor to the Login page with a return query parameter (`/auth/login?redirect=/checkout`).
6. After successful login, automatically synchronize all guest cart items to the server account via the backend Cart API, clear the local guest storage, refresh the user cart, and proceed smoothly to `/checkout`.
7. Direct guests to login if they attempt to favorite an item (Wishlist), keeping wishlist server-bound.

---

## 2. Architecture & Data Flow

### 2.1 Hybrid Cart Architecture (`CartService`)
- **State Storage:**
  - Authenticated: Syncs with remote API `cartRepository.getCart(userId)`.
  - Guest: Persisted in `localStorage` key `'dentzone_guest_cart'`.
- **Local Cart Structure:**
  An array of guest cart items stored with the following schema:
  ```ts
  interface GuestCartItem {
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
- **Synthetic `CartDto` Mapping:**
  When unauthenticated, `CartService.cart.value` provides a computed/synthesized `CartDto` containing `items` formatted exactly as the server response, along with `totalAmountCart`. This allows `CartView` and `AppHeader` to work transparently without structural changes.

### 2.2 Guest Cart Synchronization Flow
```
[Guest adds items] ---> [Stored in localStorage 'dentzone_guest_cart']
                               |
                               v
                       [Clicks Checkout]
                               |
                               v
                 [Redirect to /auth/login?redirect=/checkout]
                               |
                               v
                       [User Logs in]
                               |
                               v
               [syncGuestCartToServer()]
                 |- Calls cartRepository.addToCart for each item
                 |- Clears 'dentzone_guest_cart' from localStorage
                 |- Awaits cartService.refresh()
                               |
                               v
                  [Router navigates to /checkout]
```

---

## 3. Detailed Component & Service Changes

### 3.1 `src/router/index.ts`
- Remove `requiresAuth: true` from:
  - `product-details` route (`/categories/inventory/:inventoryUserId/product/:productId`)
  - `cart` route (`/cart`)
- Keep `requiresAuth: true` on:
  - `checkout` route (`/checkout`)
  - `orders` route (`/orders`)
  - `notifications` route (`/notifications`)
  - `profile` route (`/profile`)
  - `wishlist` route (`/wishlist`)

### 3.2 `src/application/cart.service.ts`
- Implement local guest cart handling:
  - `loadGuestCart()`: Reads from `localStorage`.
  - `saveGuestCart()`: Writes to `localStorage`.
  - `add(input)`:
    - If authenticated: calls `cartRepository.addToCart` and refreshes.
    - If guest: upserts the item into `localStorage`, clamps quantity to available stock/max, updates synthetic cart ref, and shows the same success toast with "View Cart" action.
  - `updateQuantity(input)`:
    - If authenticated: calls server API.
    - If guest: updates quantity in `localStorage` and updates synthetic cart ref.
  - `remove(input)`:
    - If authenticated: calls server API.
    - If guest: removes from `localStorage` and updates synthetic cart ref.
  - `syncGuestCartToServer()`:
    - Iterates over local items and posts them using `cartRepository.addToCart`.
    - Clears local storage.
    - Calls `this.refresh()` to load the merged server cart.
  - On user state change in constructor or watcher:
    - When transitioning from guest to authenticated, automatically triggers sync if guest items exist.

### 3.3 `src/components/products/ProductCard.vue`
- Update the cart button template:
  - Remove the conditional `<RouterLink v-else :to="{ name: 'login' }">`.
  - Render the `<button class="product-card__cart">` for all users (both authenticated and guests) emitting `add-to-cart`.
- Update the favorite button:
  - If user is not authenticated and clicks the heart icon, redirect to `/auth/login`.

### 3.4 `src/views/ProductDetailsView.vue`
- Update `addToCart()`:
  - Allow adding to cart whether authenticated or guest using `cartService.add(...)`.
  - Pass the current product information (`salesPrice`, `image`, etc.) to `cartService.add(...)` so local cart item can be synthesized properly.
- Update `toggleFavorite()`:
  - If not authenticated, redirect to `/auth/login`.

### 3.5 `src/views/CartView.vue`
- In template / script for "Proceed to Checkout":
  - Check `authService.isAuthenticated`:
    - If authenticated: router pushes to `/checkout`.
    - If guest: router pushes to `/auth/login?redirect=/checkout`.

### 3.6 `src/components/auth/LoginForm.vue`
- In `submit()`:
  - After successful login, await `cartService.syncGuestCartToServer()`.
  - Proceed with `router.push(redirect)`.

---

## 4. Error Handling & Edge Cases

1. **Network failure during sync:**
   - If one of the `addToCart` calls fails during post-login sync, log/toast an error, but ensure items that succeeded are cleared from local storage to prevent duplicate additions on retry.
2. **Duplicate items in guest cart and server cart:**
   - The backend `AddToCart` increments/updates item quantities or merges properly on the server.
3. **Empty guest cart:**
   - If guest cart is empty upon login, `syncGuestCartToServer()` does nothing and simply calls `refresh()`.
4. **Out of stock / limit validation:**
   - `clampQuantity` continues to enforce `stockQuantity` and `maxQuantity` both locally and on the server.

---

## 5. Verification Plan

1. **Guest Browsing Test:**
   - Open home page as guest.
   - Click on any product -> Product details view loads without redirection.
2. **Guest Add to Cart Test:**
   - On product card, click Add to Cart -> Toast appears, header badge updates count.
   - On product details, select quantity and click Add to Cart -> Toast appears, count updates.
3. **Guest Cart Interaction Test:**
   - Click Cart in header -> `/cart` opens with guest items listed with names, prices, and quantities.
   - Increase/decrease quantity and remove an item -> State updates correctly in UI and `localStorage`.
4. **Checkout Redirection & Sync Test:**
   - In `/cart`, click "Proceed to Checkout".
   - Verify redirection to `/auth/login?redirect=%2Fcheckout`.
   - Submit valid credentials.
   - Verify all guest cart items sync to the server and the browser lands on `/checkout` with items present.
5. **Guest Wishlist Test:**
   - Click favorite heart icon on any card as guest -> Redirects to `/auth/login`.
