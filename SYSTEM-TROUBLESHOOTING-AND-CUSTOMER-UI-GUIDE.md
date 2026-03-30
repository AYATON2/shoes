# StepUp Footwear: Troubleshooting Log and Customer UI Guide

## Purpose
This document records the major issues encountered during development, the root cause of each issue, and the exact solution applied. It also includes a complete customer UI usage guide for day-to-day operation and testing.

## Part 1: Errors Faced From Start (Chronological)

### Phase 1: Initial deployment and production-readiness checks

#### 1. Deployment uncertainty for Vercel readiness
- Symptom: Unclear if the project could be deployed safely to Vercel without runtime issues.
- Root cause: Build/deploy configuration was not yet fully validated end-to-end.
- Solution applied:
  - Verified production React build (`npm run build`) succeeds.
  - Checked Vercel config files:
    - `vercel.json`
    - `frontend/vercel.json`
  - Confirmed API URL strategy with `REACT_APP_API_URL` and environment-based config.
- Verification:
  - Frontend compiles successfully.
  - Project has valid Vercel deployment metadata and rewrite rules.

#### 2. Security/dependency concerns before release
- Symptom: Concern about possible vulnerable or outdated dependencies before deployment.
- Root cause: Normal drift in dependencies and deployment hardening checks.
- Solution applied:
  - Performed dependency and production build validation.
  - Confirmed stable lockfiles and successful compile path.
- Verification:
  - No blocking dependency/build issue prevented deployment.

### Phase 2: Invoice system rollout

#### 3. Invoice feature missing in order lifecycle
- Symptom: Orders needed invoice generation (PDF + API flow) but capability was not present initially.
- Root cause: Invoice module and persistence layer were not yet implemented.
- Solution applied:
  - Added invoice backend flow (controller/model/service/templates).
  - Added invoice UI detail page for viewing/download.
  - Added invoice migration and integrated generation in order flow.
- Verification:
  - Invoice records and PDF rendering became available in purchase flow.

#### 4. Order placement failed after invoice integration
- Symptom: Order creation failed after invoice logic was wired in.
- Root cause: Missing `invoices` table in database.
- Solution applied:
  - Added and ran migration: `2026_03_30_000000_create_invoices_table.php`.
  - Executed `php artisan migrate`.
- Verification:
  - Orders can be placed successfully.
  - Invoice records are generated with orders.

### Phase 3: Dashboard and workflow bugs

#### 5. Seller dashboard stuck in loading/infinite refresh behavior
- Symptom: Seller order management remained loading or repeatedly refetched.
- Root cause: Effect dependency/state loop in `OrderManagement`.
- Solution applied:
  - Refactored effect dependencies.
  - Used stable `useRef` tracking for notified order IDs to prevent loops.
- Verification:
  - Loading loop removed.
  - Seller dashboard behavior stabilized.

#### 6. Shipping address not shown in order tracking
- Symptom: Some orders displayed without shipping address in customer tracking.
- Root cause: Inconsistent address key mapping between API payload and UI binding.
- Solution applied:
  - Updated `OrderTracking` to support both address key variants.
- Verification:
  - Shipping address now renders reliably.

#### 7. Checkout success redirected user unexpectedly
- Symptom: User was redirected immediately after successful order placement.
- Root cause: Forced redirect logic in checkout success path.
- Solution applied:
  - Removed redirect from `Checkout` success handling.
- Verification:
  - User remains in expected post-checkout context.

#### 8. Dashboards felt slow when navigating between pages
- Symptom: Full-screen loading appeared on each dashboard visit.
- Root cause: UI waited for `/api/user` before rendering.
- Solution applied:
  - Added local cache hydration from `localStorage.user` in:
    - `CustomerDashboard.js`
    - `SellerDashboard.js`
    - `AdminDashboard-Old.js`
  - Rendered cached user immediately and refreshed auth data in background.
- Verification:
  - Dashboard transitions became near-instant.

### Phase 4: Static analysis and developer tooling cleanup

#### 9. PHP analyzer warnings for undefined model properties
- Symptom:
  - `Undefined property: User::$id`
  - `Undefined property: Sale::$product_id`
- Root cause: Incomplete model docblock annotations used by static analysis.
- Solution applied:
  - Added full `@property` definitions in:
    - `app/Models/User.php`
    - `app/Models/Sale.php`
- Verification:
  - Static analysis warnings resolved.

## Part 2: Customer UI User Guide

### A. Account and Login
1. Open the frontend URL.
2. Click `Register` to create a customer account.
3. Fill in name, email, and password.
4. Login using your credentials.

Expected result:
- You are routed to the customer dashboard.
- Auth token and user info are stored for session continuity.

### B. Browsing Products
1. Go to Home or Product listing page.
2. Use available filters (size, color, brand, category) if needed.
3. Open a product to view full details.
4. Select required options (for example size/color if SKU-based).

Expected result:
- Product details and available options are visible.
- Stock-aware selection is enforced by SKU logic.

### C. Add to Cart and Update Cart
1. Click `Add to Cart` on a product detail page.
2. Open cart/checkout area.
3. Update quantity if needed.
4. Remove items you no longer want.

Expected result:
- Cart updates immediately.
- Totals reflect quantity and selected items.

### D. Checkout and Place Order
1. Proceed to checkout.
2. Select existing address or add a new shipping address.
3. Choose payment method.
4. Submit order.

Expected result:
- Order is created successfully.
- No forced redirect interrupts the success state.
- Payment and order records are linked.

### E. Track Orders
1. Open customer dashboard.
2. Go to `Order Tracking` / order history section.
3. Select an order to view status and shipping details.

Expected result:
- Status timeline is visible.
- Shipping address appears correctly.
- Updates from seller/admin are reflected.

### F. Notifications and Sales
1. Open notifications panel from dashboard.
2. Review updates such as order events and sale announcements.

Expected result:
- Notifications are listed by newest first.
- Sale notifications include product-specific or store-wide context.

### G. Invoices
1. Open order detail after successful purchase.
2. Access invoice link/button when available.
3. View or download invoice PDF.

Expected result:
- Invoice exists for completed order flow.
- PDF rendering works via server-generated invoice template.

### H. Profile Management
1. Open `Profile` from customer dashboard.
2. Update account details (name, email, password when needed).
3. Save changes.

Expected result:
- Profile updates persist.
- Next login reflects updated information.

## Part 3: Customer-Facing Troubleshooting Quick Guide

### Login fails
- Check email/password correctness.
- Confirm account exists and is active.
- Retry after clearing stale token (logout/login).

### Products not loading
- Check frontend API base URL (`REACT_APP_API_URL`).
- Confirm backend API is running and reachable.
- Check browser console and Laravel logs for API errors.

### Checkout fails
- Verify shipping address is selected.
- Verify item stock/SKU is still available.
- Confirm required payment fields are completed.

### Order missing from history
- Refresh dashboard and retry.
- Confirm order request returned success.
- Check backend order creation logs if issue persists.

### Invoice not visible
- Confirm invoice migration has run.
- Confirm order creation completed fully.
- Check invoice generation logs and storage path permissions.

## Part 4: Deployment Notes (Vercel + API)

### Required environment variables
Backend:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=<your_api_url>`
- `DB_*` variables for production database
- `CORS_ALLOWED_ORIGINS=<your_frontend_url>`
- `SANCTUM_STATEFUL_DOMAINS=<your_frontend_domain>`

Frontend:
- `REACT_APP_API_URL=<your_api_url>`

### Final pre-deploy checks
1. `php artisan migrate --force`
2. `npm run build` in `frontend/`
3. Validate login, browse, checkout, tracking, and invoice flow
4. Validate CORS/auth between frontend domain and API domain

## Change Log Summary
- Invoice system integrated (API + PDF + templates + migration)
- Order flow stabilized
- Seller loading loop fixed
- Address rendering fixed
- Checkout redirect removed
- Dashboard transitions optimized via cache hydration
- Static analysis warnings removed for model properties

This document should be updated whenever a new production issue is found and fixed.
