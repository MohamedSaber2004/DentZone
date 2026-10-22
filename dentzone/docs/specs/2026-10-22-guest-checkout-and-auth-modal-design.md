# Guest Checkout with Auth Modal Design Spec

**Date:** 2026-10-22  
**Project:** DentZone Frontend  
**Status:** Approved  

---

## 1. Problem Statement & Goals

### Current Limitations:
1. `router.beforeEach` and `/checkout` route definition enforce `requiresAuth: true`, immediately redirecting unauthenticated visitors to `/auth/login?redirect=/checkout`.
2. In `CartView.vue`, clicking "Proceed to Checkout" (`onProceedToCheckout`) forces visitors to `/auth/login` before they can see or fill in delivery information.
3. `CheckoutView.vue` assumes an authenticated user: it calls `addressRepository.getUserAddresses()` and calculates fees only after an address has been saved to the server.
4. There is no user registration flow implemented in `ApiAuthRepository` or `AuthService`, even though the backend exposes `POST /api/Users/register`.

### Target Goals:
1. Allow guest users with items in their cart to proceed directly from the Cart (`/cart`) to the Checkout page (`/checkout`).
2. Allow guest users to fill in their delivery address details (address line, area, floor, apartment) and select delivery slot, coupon, and notes without requiring prior login.
3. Calculate real-time shipping fees for guests based on their selected area (`area.shippingCosts`).
4. At the checkout confirmation stage ("تأكيد الطلب"), present an authentication modal offering:
   - **Login (تسجيل الدخول)**: Email / username and password.
   - **Register (إنشاء حساب جديد)**: Full name, phone number, email, and password.
5. Upon successful authentication (login or register):
   - Automatically log the user in and persist credentials.
   - Synchronize the local guest cart to the server (`syncGuestCartToServer`).
   - Save the entered delivery address to the user's account on the server.
   - Automatically execute order creation (`createOrder`) with the saved address ID.
   - Display the order success screen with order number without page reload or loss of input.

---

## 2. Architecture & Data Flow

```
[Guest with Cart Items]
          |
          v
[Clicks "Proceed to Checkout" in CartView]
          |
          v
[Navigates directly to /checkout]
          |
          v
[Guest fills in: Address, Area, Floor, Apt, Delivery Slot, Notes]
          | (Shipping fee calculated immediately from selected Area)
          v
[Clicks "تأكيد الطلب" (Confirm Order)]
          |
          +-------------------------------+
          | Is user authenticated?        |
          +---------------+---------------+
                 Yes      |     No
                  |       v
                  |  [Opens CheckoutAuthModal]
                  |       |
                  |       +-------------------------+
                  |       | Choose: Login or SignUp |
                  |       +-------------------------+
                  |               |
                  |               v
                  |     [Auth Success in Modal]
                  |               |
                  |               v
                  |     [1. syncGuestCartToServer()]
                  |     [2. addressRepository.insertAddress()]
                  |     [3. Fetch newly created address ID]
                  |               |
                  +---------------+
                          |
                          v
        [orderRepository.createOrder(...)]
                          |
                          v
        [Order Placed Screen with Order Number]
```

---

## 3. Detailed Component & Service Changes

### 3.1 `src/router/index.ts`
- Remove `requiresAuth: true` from `/checkout` route so guests can access it.
- In `beforeEach` navigation guard: allow `/checkout` if cart has items (guest cart or user cart). If cart is completely empty, redirect to `/cart`.

### 3.2 `src/views/CartView.vue`
- Update `onProceedToCheckout`: navigate directly to `/checkout` regardless of authentication status.

### 3.3 `src/domain/ports/auth-repository.ts` & `src/data/repositories/api-auth.repository.ts`
- Add `RegisterPayload`:
  ```ts
  export interface RegisterPayload {
    fullName: string
    email: string
    password: string
    phoneNumber: string
    areaId?: number
    addressLines?: string[]
  }
  ```
- Add `register(payload: RegisterPayload): Promise<void>` calling `POST /api/Users/register` with `FormData`.

### 3.4 `src/application/auth.service.ts`
- Add `register(payload: RegisterPayload): Promise<AuthResult>`:
  - Calls `authRepository.register(payload)`.
  - Automatically invokes `this.login(payload.email, payload.password)` upon successful registration so user is logged in immediately.

### 3.5 `src/components/checkout/CheckoutAuthModal.vue`
- Create a dedicated, accessible, responsive modal component.
- Features:
  - Header: title ("إتمام الطلب" / "تسجيل الدخول أو إنشاء حساب"), close button.
  - Tab Switcher: "تسجيل الدخول" (Login) and "إنشاء حساب جديد" (Register).
  - Login tab:
    - Inputs: Email / Username, Password.
    - Submit: "تسجيل الدخول ومتابعة الطلب".
  - Register tab:
    - Inputs: Full Name, Phone Number, Email, Password.
    - Submit: "إنشاء الحساب ومتابعة الطلب".
  - Clean error display, loading spinners, input validation.
  - Emits: `@success` when authentication succeeds.

### 3.6 `src/views/CheckoutView.vue`
- **Guest State Handling:**
  - If `!authService.isAuthenticated`:
    - Do not attempt to load server addresses.
    - Open address form by default (`showAddressForm.value = true`).
    - When area is selected from `areas`, immediately calculate `shippingFee = selectedArea.shippingCosts`.
  - **Confirm Order Flow:**
    - If `!authService.isAuthenticated`:
      - Validate that guest filled in required address fields, area, delivery day, and slot.
      - Open `showAuthModal = true`.
    - When `onAuthModalSuccess()` is triggered:
      - Close modal.
      - Save the guest's address to the newly authenticated account (`insertAddress`).
      - Run `cartService.syncGuestCartToServer()`.
      - Trigger `confirmOrder()` with the new address ID.
      - Render success confirmation view with order number.

### 3.7 `src/i18n/ar.ts` & `src/i18n/en.ts`
- Add localized strings for checkout auth modal (tabs, labels, buttons, error messages, and hints).

---

## 4. Verification & Testing Steps

1. **Guest Access:**
   - Add a product to the cart as a guest.
   - Click "إتمام الطلب" in `/cart`.
   - Verify page navigates to `/checkout` without being redirected to `/auth/login`.
2. **Address & Shipping Fee:**
   - Verify the address form is shown directly for guest users.
   - Select an area: verify delivery fee and total update immediately.
   - Select a delivery day and time slot.
3. **Modal Verification:**
   - Click "تأكيد الطلب".
   - Verify `CheckoutAuthModal` opens.
   - Test Login tab with existing credentials -> verify automatic order creation.
   - Test Register tab with new credentials -> verify registration, automatic login, and order creation.
4. **Order Success:**
   - Verify order placed screen renders with valid order number.
   - Verify cart is cleared.
