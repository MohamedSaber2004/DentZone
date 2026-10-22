# Guest Checkout and Auth Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable guest users to add items to the cart, navigate directly to checkout, input their delivery address and order details, and authenticate seamlessly via an interactive login/register modal before placing the order.

**Architecture:** The router guard is updated to allow guest checkout when cart items exist. The checkout page allows guests to fill their address and delivery details with live shipping fee calculation based on selected area. An auth modal handles login or new account registration, after which the guest cart is synced, the address is saved to the account, and the order is finalized.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, Vue Router, Pinia/Service Container pattern, CSS Variables Design System.

---

### Task 1: Auth Layer - User Registration Support

**Files:**
- Modify: `src/config/api.config.ts`
- Modify: `src/domain/ports/auth-repository.ts`
- Modify: `src/data/repositories/api-auth.repository.ts`
- Modify: `src/application/auth.service.ts`

- [ ] **Step 1: Update API config with register route if needed**
Verify `AUTH_ROUTES.register` is set to `${base}/Users/register`.

- [ ] **Step 2: Add RegisterPayload interface to `auth-repository.ts`**
Add:
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
Add `register(payload: RegisterPayload): Promise<void>` to `AuthRepository`.

- [ ] **Step 3: Implement `register` in `ApiAuthRepository`**
In `src/data/repositories/api-auth.repository.ts`, implement `register`:
```ts
register(payload: RegisterPayload): Promise<void> {
  const formData = new FormData()
  formData.append('FullName', payload.fullName)
  formData.append('Email', payload.email)
  formData.append('Password', payload.password)
  formData.append('PhoneNumber', payload.phoneNumber)
  if (payload.areaId) formData.append('AreaId', String(payload.areaId))
  if (payload.addressLines && payload.addressLines.length > 0) {
    for (const line of payload.addressLines) {
      formData.append('AddressLines', line)
    }
  }
  return this.http.post<void>(AUTH_ROUTES.register, formData, { showFeedback: false })
}
```

- [ ] **Step 4: Implement `register` in `AuthService`**
In `src/application/auth.service.ts`, implement `register`:
```ts
async register(payload: RegisterPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await this.authRepository.register(payload)
    return await this.login(payload.email, payload.password)
  } catch (error) {
    const message = error instanceof Error ? error.message : t('auth.registerError')
    return { ok: false, error: message }
  }
}
```

---

### Task 2: Router and Cart View Updates

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/views/CartView.vue`

- [ ] **Step 1: Update router guard in `src/router/index.ts`**
Remove `requiresAuth: true` from `/checkout`. In `beforeEach`:
Allow access to `/checkout` without auth if the user has items in their cart (guest cart or server cart). If cart is empty, redirect to `/cart`.

- [ ] **Step 2: Update `onProceedToCheckout` in `src/views/CartView.vue`**
Allow direct navigation to `/checkout` without redirecting guests to login:
```ts
const onProceedToCheckout = () => {
  void router.push('/checkout')
}
```

---

### Task 3: Localization Keys for Checkout Auth Modal

**Files:**
- Modify: `src/i18n/messages.ts`
- Modify: `src/i18n/ar.ts`
- Modify: `src/i18n/en.ts`

- [ ] **Step 1: Add translation keys**
Add translations for checkout auth modal in `messages.ts`, `ar.ts`, and `en.ts`:
- Modal title: "إتمام الطلب" / "Complete Order"
- Subtitle: "سجّل الدخول أو أنشئ حساباً جديداً لإتمام طلبك وحفظ بياناتك"
- Tabs: "تسجيل الدخول" (Login), "إنشاء حساب جديد" (New Account)
- Labels: "الاسم بالكامل", "رقم الهاتف", "البريد الإلكتروني", "كلمة المرور"
- Buttons: "تسجيل الدخول ومتابعة الطلب", "إنشاء الحساب ومتابعة الطلب"
- Error hints: "يرجى ملء جميع الحقول المطلوبة", "رقم الهاتف غير صالح"

---

### Task 4: Create `CheckoutAuthModal.vue` Component

**Files:**
- Create: `src/components/checkout/CheckoutAuthModal.vue`

- [ ] **Step 1: Build the modal component**
- Accessible dialog backdrop and container with ESC key and click outside support.
- Tab bar switching between Login and Register.
- Login form using `authService.login`.
- Register form using `authService.register` (FullName, Phone, Email, Password).
- Loading spinner and inline error message styling.
- Emit `@success` when authentication finishes.

---

### Task 5: Enhance `CheckoutView.vue` for Guest Checkout

**Files:**
- Modify: `src/views/CheckoutView.vue`

- [ ] **Step 1: Support Guest Address and Shipping Fee**
- Check `authService.isAuthenticated`:
  - If guest: do not call `loadAddresses()`, set `showAddressForm.value = true`.
  - When guest selects an Area from `areas`: calculate `shippingFee.value = selectedArea.shippingCosts`.
- [ ] **Step 2: Update `canConfirm` computation**
- For guests: valid if address line and area are provided, along with deliveryDay and selectedSlotId.
- [ ] **Step 3: Update `confirmOrder` to open Auth Modal for guests**
- If `!authService.isAuthenticated`: open `showAuthModal.value = true`.
- On `@success` from `CheckoutAuthModal`:
  1. Save address to user's account (`addressRepository.insertAddress`).
  2. Sync cart (`cartService.syncGuestCartToServer()`).
  3. Place order (`orderRepository.createOrder`).
  4. Display order success screen with order number.

---

### Task 6: Verification & Build Check

**Files:**
- Test via `npm run build` or `npm run type-check`.
- Verify TypeScript types, CSS, and component imports.
