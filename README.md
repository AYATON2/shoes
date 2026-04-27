# 👟 StepUp Footwear — E-Commerce Platform

> A high-performance, multi-role e-commerce platform for footwear, built with **Laravel** and **React 18**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-step--up.up.railway.app-brightgreen?style=for-the-badge)](https://step-up.up.railway.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-AYATON2%2Fshoes-black?style=for-the-badge&logo=github)](https://github.com/AYATON2/shoes.git)

---

## 🔗 Quick Links

| Resource | URL |
|---|---|
| **Live App** | [step-up.up.railway.app](https://step-up.up.railway.app) |
| **GitHub Repo** | [https://github.com/AYATON2/shoes.git](https://github.com/AYATON2/shoes.git) |
| **Backend API Base** | `https://step-up.up.railway.app/api` |

---

## 📖 Table of Contents

1. [System Overview](#-system-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [User Roles & Capabilities](#-user-roles--capabilities)
5. [System Workflow (End-to-End)](#-system-workflow-end-to-end)
6. [Database Schema](#-database-schema)
7. [API Reference](#-api-reference)
8. [Local Development Setup](#-local-development-setup)
9. [Environment Variables](#-environment-variables)
10. [Deployment (Railway)](#-deployment-railway)
11. [Performance & Architecture](#-performance--architecture)
12. [Troubleshooting](#-troubleshooting)
13. [License](#-license)

---

## 🏪 System Overview

**StepUp** is a modern, responsive e-commerce platform built to handle the complete end-to-end flow of online shoe retail. It is a full-stack application featuring:

- A **Laravel REST API** backend secured with Sanctum token authentication.
- A **React 18 SPA** frontend with a Nike-inspired minimalist aesthetic.
- A **multi-role access control system** serving Customers, Store Staff, Logistics Coordinators, Riders, and Administrators through dedicated dashboards.
- A live **order lifecycle management** system tracking orders from placement to final delivery.

---

## ✨ Features

### 🛍️ Customer Features
- Browse & search products with live filtering by Brand, Type, Gender, and Category
- Homepage sections for **New Arrivals** and **Best Sellers** with smart database filtering
- Product **Quick View** modal with size/color selection
- Add to cart with SKU-level inventory awareness
- Full checkout with address management and COD payment
- Real-time order tracking with status updates
- Leave product reviews after delivery
- Submit return requests with photo proof upload

### 🏪 Store Staff Features
- Full product management (Create, Read, Update, Archive)
- SKU management per product (Size, Color, Width, Stock quantity)
- Product image upload and preview
- View and manage all store orders through status stages
- Create store-wide and product-specific **Sales & Promotions** with date ranges and discount percentages
- View store analytics: total sales, pending orders, active products, and completed deliveries

### 📦 Logistics Staff Features
- View orders filtered specifically for their assigned logistics provider (e.g., J&T Express, LBC)
- Monitor order pipeline: Received → Quality Check → Ready for Pickup → Shipped
- Assign riders to pending deliveries

### 🛵 Rider Features
- Dedicated Rider Dashboard showing assigned deliveries
- Accept new delivery orders
- Mark orders as `Delivered` upon completion to update customer order status

### 👑 Admin Features
- Full user management: create, approve, deactivate, and suspend Customers, Staff, and Riders
- Global product management: edit or archive any product platform-wide
- Manage logistics providers and rider accounts
- Full order management across all users and staff
- View and archive product reviews
- Handle customer return requests (approve/reject with reason)
- Platform-wide sales, inventory, and order status **Reports & Analytics**
- Voucher/discount code management

---

## 📦 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| PHP | 8.0+ | Runtime |
| Laravel | 10+ | API Framework |
| Laravel Sanctum | — | Token-based Authentication |
| MySQL / SQLite | — | Database (Production / Local) |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | SPA Framework |
| React Router DOM | v6 | Client-side Routing |
| Axios | — | HTTP Client for API Calls |
| Custom CSS | — | Nike-inspired Minimalist Styling |

### Hosting
| Service | Purpose |
|---|---|
| Railway | Backend + Frontend Hosting & Auto-Deployment |
| Railway Volumes | Persistent image/file storage between deployments |

---

## 👥 User Roles & Capabilities

The system uses **Role-Based Access Control (RBAC)**. Upon login, each user is redirected to their appropriate dashboard based on their `role` field.

| Role | Dashboard | Access Level |
|---|---|---|
| `customer` | `/customer-dashboard` | Own orders, addresses, reviews, returns |
| `staff` | `/staff-dashboard` | Products (own), all orders, sales/promos |
| `rider` | `/rider-dashboard` | Assigned deliveries only |
| `admin` | `/admin-dashboard` | Full platform access |

---

## 🔄 System Workflow (End-to-End)

### Order Lifecycle

```
Customer Places Order
        │
        ▼
   Status: received   ◄── Staff sees new order in dashboard
        │
        ▼
Status: quality_check ◄── Staff inspects & packs the item
        │
        ▼
Status: ready_for_pickup ◄── Logistics staff prepares for courier
        │
        ▼
   Status: shipped    ◄── Rider picks up & is out for delivery
        │
        ▼
  Status: delivered   ◄── Rider confirms delivery, collects COD payment
        │
        ▼
Customer can now: Leave a Review OR Submit a Return Request
```

### Adding a Product (Staff Walkthrough)

1. Log in with a **Staff** account at [step-up.up.railway.app](https://step-up.up.railway.app)
2. Navigate to the **Products** tab in the sidebar
3. Click **"+ Add Product"**
4. Fill in: Name, Brand, Type, Gender, Price, Description
5. Upload a product image
6. Add **SKU rows** (one per size/color combination), each with a stock quantity
7. Click **Save Product** — it immediately appears on the live storefront

### Managing Returns (Admin Walkthrough)

1. Log in as **Admin**
2. Go to the **Returns** section from the sidebar
3. Review the customer's reason and uploaded **proof photo**
4. Choose **Approve** or **Reject** (with reason) — the customer's status is updated accordingly

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|---|---|
| `users` | All accounts: customers, staff, riders, admins. Includes `role`, `active`, `approved`, `logistic_id`, `customer_number` |
| `products` | Product catalog: name, brand, type, gender, price, image, description, `is_archived`, `view_count` |
| `skus` | Product variants: size, color, width, stock quantity — linked to a parent product |
| `orders` | Customer orders: total, status, address, logistics_id, rider_id, voucher_id |
| `order_items` | Line items per order, each linked to a specific SKU |
| `addresses` | Shipping addresses per user (name, street, city, mobile number) |
| `sales` | Promotions: discount_percentage or discount_amount, start/end dates, active flag |
| `logistics` | Logistics providers (e.g., J&T Express, LBC) |
| `reviews` | Product reviews by customers after delivery |
| `returns` | Return requests with proof image, reason, and status |
| `notifications` | In-app notifications per user |
| `invoices` | Generated invoices per order |
| `vouchers` | Discount/promo codes with usage limits |
| `payments` | Payment records linked to orders |

---

## 📡 API Reference

All API endpoints are prefixed with `/api`. Protected routes require a **Bearer Token** in the `Authorization` header.

### 🔓 Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register a new user account |
| `POST` | `/api/login` | Login and receive an auth token |
| `GET` | `/api/products` | List all active products (supports `?special_filter=new\|bestseller\|sale`) |
| `GET` | `/api/products/{id}` | Get a single product's details |
| `GET` | `/api/products/filter-options` | Get available brands, types, performance_tech for filters |
| `GET` | `/api/products/{id}/reviews` | Get reviews for a product |

### 🔒 Protected Endpoints (Require Auth Token)

#### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/logout` | Logout and invalidate token |
| `GET` | `/api/user` | Get currently authenticated user |
| `PUT` | `/api/user` | Update user profile |

#### Products
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products` | Create a new product (Staff/Admin) |
| `PUT` | `/api/products/{id}` | Update a product (Owner/Admin) |
| `DELETE` | `/api/products/{id}` | Delete a product (Owner/Admin) |
| `PUT` | `/api/products/{id}/stock` | Update stock quantity |
| `PATCH` | `/api/products/{id}/archive` | Archive a product |
| `PATCH` | `/api/products/{id}/unarchive` | Unarchive a product |

#### Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | List orders (filtered by role) |
| `POST` | `/api/orders` | Place a new order |
| `PUT` | `/api/orders/{id}` | Update order status |
| `PATCH` | `/api/orders/{id}/archive` | Archive an order |
| `GET` | `/api/orders/{id}/invoice` | Download invoice PDF |
| `POST` | `/api/orders/{id}/verify-payment` | Verify payment for an order |

#### Users & Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users (Admin) |
| `POST` | `/api/users` | Create a new user (Admin) |
| `PUT` | `/api/users/{id}` | Update a user (Admin) |
| `DELETE` | `/api/users/{id}` | Delete a user (Admin) |
| `PATCH` | `/api/users/{id}/deactivate` | Deactivate a user |
| `PATCH` | `/api/users/{id}/activate` | Reactivate a user |
| `PATCH` | `/api/users/{id}/approve` | Approve a pending account |
| `PATCH` | `/api/users/{id}/suspend` | Suspend a user |

#### Sales & Promotions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sales` | List all sales |
| `GET` | `/api/sales/active` | List currently active sales |
| `GET` | `/api/products/{id}/sales` | Get sales for a specific product |
| `POST` | `/api/sales` | Create a sale/promotion |
| `PUT` | `/api/sales/{id}` | Update a sale |
| `DELETE` | `/api/sales/{id}` | Delete a sale |
| `PATCH` | `/api/sales/{id}/toggle` | Toggle sale active/inactive |

#### Logistics & Riders
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/logistics` | Manage logistics providers |
| `GET` | `/api/riders` | List all riders |
| `POST` | `/api/riders` | Create a rider account |
| `GET` | `/api/rider/orders` | Get orders assigned to the logged-in rider |
| `POST` | `/api/rider/orders/{id}/accept` | Rider accepts/picks up an order |

#### Reviews, Returns & Notifications
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reviews` | Submit a product review |
| `GET` | `/api/admin/reviews` | List all reviews (Admin) |
| `PATCH` | `/api/reviews/{id}/archive` | Archive a review (Admin) |
| `GET` | `/api/returns` | List return requests |
| `POST` | `/api/returns` | Submit a return request (with proof image) |
| `PATCH` | `/api/returns/{id}/status` | Update return request status (Admin) |
| `GET` | `/api/notifications` | Get user notifications |
| `PATCH` | `/api/notifications/read` | Mark all notifications as read |

#### Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/sales` | Platform-wide sales report |
| `GET` | `/api/reports/inventory` | Inventory stock report |
| `GET` | `/api/reports/orders` | Order status report |
| `GET` | `/api/reports/staff-sales` | Sales report per staff member |

#### Addresses & Vouchers
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/addresses` | Manage user shipping addresses |
| `GET/POST/PUT/DELETE` | `/api/vouchers` | Manage voucher/promo codes (Admin) |
| `POST` | `/api/vouchers/validate` | Validate a voucher code at checkout |

---

## 🛠️ Local Development Setup

### Prerequisites

- PHP 8.0+ & [Composer](https://getcomposer.org/)
- Node.js 16+ & npm
- Git

### Step-by-Step Installation

**1. Clone the repository**
```bash
git clone https://github.com/AYATON2/shoes.git
cd shoes
```

**2. Install Laravel dependencies**
```bash
composer install
```

**3. Configure environment**
```bash
cp .env.example .env
php artisan key:generate
```

**4. Set up the database**

Edit `.env` and configure your database. For the easiest local setup, use SQLite:
```env
DB_CONNECTION=sqlite
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=shoes
# DB_USERNAME=root
# DB_PASSWORD=
```

Then create the SQLite file and run migrations:
```bash
touch database/database.sqlite
php artisan migrate
```

**5. Start the Laravel API server**
```bash
php artisan serve
# Runs at: http://127.0.0.1:8000
```

**6. Install and start the React frontend**

In a new terminal:
```bash
cd frontend
npm install
npm start
# Runs at: http://localhost:3000
```

**7. Access the application**
- **Frontend:** http://localhost:3000
- **Backend API:** http://127.0.0.1:8000/api

---

## ⚙️ Environment Variables

### Backend `.env` (Key Variables)

```env
APP_NAME=StepUp
APP_ENV=local
APP_KEY=               # Generated by php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite   # Use mysql for production

FILESYSTEM_DISK=public # Required for image uploads to work
```

### Frontend `frontend/.env` (Optional)

```env
# Override the API base URL (defaults to Railway API if not set)
REACT_APP_API_URL=http://localhost:8000
```

---

## 🚀 Deployment (Railway)

The project is configured for auto-deployment on **[Railway](https://railway.app)**.

### How Auto-Deployment Works
1. Push any code changes to the `main` branch on GitHub.
2. Railway automatically detects the push and rebuilds the application.
3. The new version goes live at [step-up.up.railway.app](https://step-up.up.railway.app) within 2–5 minutes.

### Required Railway Environment Variables
Set these in your Railway project dashboard under **Variables**:

```
APP_KEY=<your-generated-key>
APP_ENV=production
APP_DEBUG=false
APP_URL=https://step-up.up.railway.app
DB_CONNECTION=mysql
DB_HOST=<railway-mysql-host>
DB_PORT=3306
DB_DATABASE=<your-db-name>
DB_USERNAME=<your-db-user>
DB_PASSWORD=<your-db-password>
FILESYSTEM_DISK=public
```

### Important Notes for Deployment
> ⚠️ **Browser Caching:** After pushing frontend changes, users may need to do a **Hard Refresh** (`Ctrl + F5` on Windows / `Cmd + Shift + R` on Mac) to load the latest JS/CSS bundles.

> 📁 **Persistent Storage:** Product images and return proof photos are stored on Railway persistent volumes. Do not remove the volume configuration or uploaded images will be lost on redeploy.

---

## ⚡ Performance & Architecture

### Frontend Architecture
- **Code Splitting:** All page components are lazy-loaded using `React.lazy()` and `Suspense`, reducing the initial bundle size.
- **Skeleton Loaders:** Displayed while API data is being fetched to prevent layout shifts.
- **Client-Side Caching:** Cart data is stored in `localStorage` and survives page refreshes.
- **Responsive Design:** Fluid CSS Grid and Flexbox layouts adapt gracefully from mobile (360px) to ultra-wide desktop (2560px+).

### Backend Architecture
- **API-Only Laravel:** The backend operates purely as a REST API; the frontend is a fully decoupled React SPA.
- **Sanctum Token Auth:** On login, a personal access token is issued and stored in the browser's `localStorage`. All subsequent API calls include this token in the `Authorization: Bearer` header.
- **Role-Aware Data Filtering:** The `OrderController` and `ProductController` automatically filter returned data based on the authenticated user's role (e.g., staff only see their own products; riders only see their assigned orders).

---

## 🧪 Troubleshooting

| Problem | Solution |
|---|---|
| **API returns 401 Unauthorized** | Token has expired. Log out and log back in to get a fresh token. |
| **Images not loading in production** | Check that `FILESYSTEM_DISK=public` is set in Railway environment variables and the storage volume is mounted. |
| **Frontend showing old UI after deployment** | Do a **Hard Refresh** (`Ctrl + F5`). Railway may have deployed new JS files that your browser has cached. |
| **Products page showing only 2 columns** | A previous layout regression — ensure the `ProductList` container uses `width: 100%` and not a fixed `maxWidth` that's too small for the viewport. |
| **API URL warning in console** | `REACT_APP_API_URL is not set` — the app will automatically fall back to the production Railway API. This is safe but set the env var for local development. |
| **Migration errors on fresh install** | Run `php artisan migrate:fresh` to reset and re-run all migrations in order. Only do this in development as it drops all data. |

---

## 📁 Project Structure

```
shoes/
├── app/
│   ├── Http/
│   │   ├── Controllers/API/   # All API controllers
│   │   └── Middleware/        # Custom middleware (role checks, response caching)
│   ├── Models/                # Eloquent models (User, Product, Order, Sku, etc.)
│   └── Policies/              # Authorization policies
├── database/
│   └── migrations/            # 46 migration files
├── routes/
│   └── api.php                # All API route definitions
├── frontend/
│   ├── public/                # Static assets, index.html
│   └── src/
│       ├── components/        # All React page & UI components
│       └── utils/             # Helper utilities (apiUrl.js, etc.)
├── storage/
│   └── app/public/products/   # Uploaded product images
└── README.md
```

---

## 📝 License

This project is open-sourced software licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

**Built with ❤️ using Laravel & React**
