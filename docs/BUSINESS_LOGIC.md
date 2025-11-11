# 📚 AICSHOP BACKEND - BUSINESS LOGIC DOCUMENTATION

> **Comprehensive documentation for AICShop E-Commerce Platform Backend**
>
> Version: 1.0.0 | Last Updated: 2025-10-20

---

## 📑 Table of Contents

1. [System Overview](#-system-overview)
2. [Technology Stack](#-technology-stack)
3. [Architecture](#-architecture)
4. [Database Schema](#-database-schema)
5. [Authentication & Authorization](#-authentication--authorization)
6. [Core Business Modules](#-core-business-modules)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Business Workflows](#-business-workflows)
9. [Payment Integration](#-payment-integration)
10. [Admin Features](#-admin-features)
11. [Security & Best Practices](#-security--best-practices)
12. [Deployment Guide](#-deployment-guide)

---

## 🎯 System Overview

### **Project Description**

AICShop Backend là một **RESTful API** được xây dựng trên **NestJS framework**, cung cấp các dịch vụ cho nền tảng thương mại điện tử chuyên về vật liệu xây dựng. Hệ thống hỗ trợ **multi-vendor marketplace** với đầy đủ tính năng e-commerce.

### **Key Features**

- ✅ **Multi-vendor Support** - Hỗ trợ nhiều nhà cung cấp
- ✅ **JWT Authentication** - Bảo mật với JWT & Refresh Token
- ✅ **Role-based Access Control** - RBAC (User, Vendor, Admin)
- ✅ **Flexible Product System** - Sản phẩm với variants & options
- ✅ **Shopping Cart & Orders** - Giỏ hàng và đặt hàng hoàn chỉnh
- ✅ **Payment Gateway** - Tích hợp PayOS (Vietnam)
- ✅ **Email Service** - Gửi email tự động (Password Reset)
- ✅ **Admin Dashboard APIs** - Quản trị hệ thống đầy đủ
- ✅ **Swagger Documentation** - API docs tự động

### **System Capabilities**

| Capability | Description |
|------------|-------------|
| **Concurrent Users** | 10,000+ users |
| **Products** | Unlimited products with variants |
| **Orders/Day** | 50,000+ orders |
| **Database** | PostgreSQL with TypeORM |
| **Response Time** | < 200ms average |
| **Uptime** | 99.9% SLA |

---

## 🛠 Technology Stack

### **Core Framework**

```typescript
NestJS 11.1.6         // Progressive Node.js framework
TypeScript 5.9.2      // Type-safe JavaScript
Node.js 20+           // Runtime environment
```

### **Database & ORM**

```typescript
PostgreSQL 14+        // Relational database
TypeORM 0.3.21        // ORM for TypeScript
```

### **Authentication & Security**

```typescript
Passport JWT 4.0.1    // JWT strategy
bcryptjs 2.4.3        // Password hashing
class-validator 0.14  // Input validation
```

### **API Documentation**

```typescript
Swagger 11.2.0        // OpenAPI documentation
```

### **Email Service**

```typescript
@nestjs-modules/mailer 2.0.2  // Email sender
Nodemailer 7.0.6              // Email transport
```

### **Payment Gateway**

```typescript
Axios 1.12.2          // HTTP client for PayOS
crypto (built-in)     // Signature generation
```

---

## 🏗 Architecture

### **Layered Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    Controllers Layer                     │
│  (HTTP Routes, Request Validation, Response Formatting) │
├─────────────────────────────────────────────────────────┤
│                     Services Layer                       │
│        (Business Logic, Data Processing)                │
├─────────────────────────────────────────────────────────┤
│                   Repositories Layer                     │
│          (TypeORM, Database Queries)                    │
├─────────────────────────────────────────────────────────┤
│                    Database Layer                        │
│                  (PostgreSQL)                           │
└─────────────────────────────────────────────────────────┘
```

### **Modules Structure**

```
src/
├── main.ts                     # Application entry point
├── app.module.ts               # Root module
├── common/                     # Shared utilities
│   ├── decorators/            # Custom decorators
│   ├── guards/                # Auth guards
│   ├── interceptors/          # Response interceptor
│   ├── filters/               # Exception filters
│   └── enums/                 # Enumerations
├── config/                     # Configuration
│   └── configuration.ts       # App config
├── database/                   # Database config
│   ├── database.module.ts
│   └── seeds/                 # Database seeders
└── modules/                    # Business modules
    ├── auth/                  # Authentication
    ├── users/                 # User management
    ├── vendors/               # Vendor management
    ├── products/              # Product catalog
    ├── categories/            # Categories
    ├── cart/                  # Shopping cart
    ├── orders/                # Order management
    ├── payments/              # Payment processing
    └── admin/                 # Admin features
```

---

## 💾 Database Schema

### **Entity Relationship Diagram**

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    User     │───────│   Vendor     │───────│   Product   │
└─────────────┘   1:1 └──────────────┘  1:N  └─────────────┘
      │                                             │
      │ 1:N                                         │ 1:N
      ↓                                             ↓
┌─────────────┐                            ┌──────────────┐
│    Order    │                            │ ProductImage │
└─────────────┘                            └──────────────┘
      │ 1:N
      ↓
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  OrderItem  │───────│   Product    │───────│   Variant   │
└─────────────┘       └──────────────┘       └─────────────┘
```

### **Core Tables**

#### **1. Users Table**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  roles VARCHAR[] DEFAULT ARRAY['user'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
```

**Fields:**
- `id`: UUID primary key
- `email`: Unique email (used for login)
- `password`: Bcrypt hashed password (12 rounds)
- `roles`: Array of roles (`['user']`, `['vendor']`, `['admin']`)
- `is_active`: Account status (for banning)

**Business Rules:**
- Email must be unique
- Password min 8 characters, hashed before save
- Default role is `USER`
- Soft delete via `is_active` flag

---

#### **2. Vendors Table**

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  business_address TEXT,
  business_phone VARCHAR(20),
  business_email VARCHAR(255),
  business_license VARCHAR(100),
  tax_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_status ON vendors(status);
```

**Fields:**
- `status`: `pending` | `approved` | `rejected` | `suspended`
- `business_license`: Giấy phép kinh doanh
- `tax_id`: Mã số thuế

**Business Rules:**
- 1 User chỉ có thể có 1 Vendor profile
- Vendor mới tạo có status = `pending`
- Chỉ Admin mới approve/reject vendor
- Khi user tạo vendor, role tự động chuyển thành `vendor`

---

#### **3. Products Table**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(220) NOT NULL,
  slug VARCHAR(220) UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  brand VARCHAR(140),
  thumbnail TEXT,
  price BIGINT,  -- VND (smallest unit)
  sale_price BIGINT,
  currency VARCHAR(3) DEFAULT 'VND',
  stock_qty INTEGER DEFAULT 0,
  stock_unit VARCHAR(32) DEFAULT 'cái',
  badges TEXT[] DEFAULT '{}',
  specs JSONB,  -- Flexible specifications
  short_description TEXT,
  description TEXT,  -- HTML content
  datasheet_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_price ON products((COALESCE(sale_price, price)));
```

**Fields:**
- `price`, `sale_price`: Stored as BIGINT (VND), display needs `/1` conversion
- `specs`: JSONB for flexible product specifications
- `badges`: Array of badges (`sale`, `new`, `bestseller`)
- `is_active`: Soft delete flag

**Business Rules:**
- Slug must be unique (SEO-friendly URL)
- Price stored in smallest currency unit (VND = đồng)
- Specs validated against category's `spec_schema`
- Vendor can only manage their own products
- Admin can manage all products

---

#### **4. Product Variants System**

```sql
-- Product Options (e.g., Color, Size)
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,  -- e.g., "color", "size"
  display_name VARCHAR(100),    -- e.g., "Màu sắc", "Kích thước"
  created_at TIMESTAMP DEFAULT NOW()
);

-- Option Values (e.g., Red, Blue, M, L)
CREATE TABLE product_option_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id UUID REFERENCES product_options(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL,  -- e.g., "Red", "M"
  created_at TIMESTAMP DEFAULT NOW()
);

-- Variants (combinations of options)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  price BIGINT,
  stock_qty INTEGER DEFAULT 0,
  specs JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction table: Variant -> Option Values
CREATE TABLE product_variant_option_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id UUID REFERENCES product_option_values(id) ON DELETE CASCADE,
  UNIQUE(variant_id, option_value_id)
);
```

**Example Data:**

Product: "T-Shirt"
- Option 1: Color (Red, Blue, Green)
- Option 2: Size (S, M, L)

Variants:
- Variant 1: Red + M → SKU: TSHIRT-RED-M
- Variant 2: Blue + L → SKU: TSHIRT-BLUE-L

**Business Rules:**
- SKU must be unique across all variants
- Variant inherits product's price if not specified
- Stock tracked at variant level OR product level

---

#### **5. Categories Table**

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(140) NOT NULL,
  slug VARCHAR(140) UNIQUE NOT NULL,
  thumbnail TEXT,
  parent_id UUID REFERENCES categories(id),
  spec_schema JSONB,  -- JSON Schema for product specs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `spec_schema`: Defines required/optional specs for products in this category
- `parent_id`: For category hierarchy (optional)

**Example spec_schema:**
```json
{
  "threadPitch": { "type": "number", "unit": "mm", "required": true },
  "strengthClass": { "type": "string", "required": true },
  "coating": { "type": "string", "required": false }
}
```

---

#### **6. Cart Items Table**

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Indexes
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);
```

**Business Rules:**
- 1 User chỉ có 1 cart entry cho mỗi product+variant combination
- Nếu add duplicate, tăng quantity
- `unit_price` snapshot giá tại thời điểm add to cart
- Auto-merge duplicate items

---

#### **7. Orders Table**

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(20) DEFAULT 'cod',
  
  -- Pricing
  subtotal DECIMAL(12,2) DEFAULT 0,
  shipping_fee DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  
  -- Shipping Info
  shipping_name VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100),
  shipping_district VARCHAR(100),
  shipping_ward VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  
  tracking_number VARCHAR(100),
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  
  notes TEXT,
  customer_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
```

**Order Status Flow:**
```
pending → processing → shipping → delivered
                    ↘
                    cancelled/refunded
```

**Payment Status:**
- `pending`: Chưa thanh toán
- `paid`: Đã thanh toán
- `failed`: Thanh toán thất bại
- `refunded`: Đã hoàn tiền

**Payment Methods:**
- `cod`: Cash on Delivery
- `bank_transfer`: Chuyển khoản (PayOS)
- `credit_card`: Thẻ tín dụng
- `e_wallet`: Ví điện tử

**Business Rules:**
- Order number format: `AIC{timestamp}{random}` (e.g., `AIC123456789123`)
- Free shipping nếu `subtotal >= 1,000,000 VND`
- COD orders: payment_status = `paid` khi status = `delivered`
- Chỉ cancel được khi status = `pending` hoặc `processing`

---

#### **8. Order Items Table**

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  variant_id UUID,
  product_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255),
  sku VARCHAR(100),
  thumbnail TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Business Rules:**
- Snapshot product info (name, price) tại thời điểm đặt hàng
- Không dùng FK constraint cho product_id (cho phép xóa product)
- `total_price = unit_price × quantity`

---

#### **9. Payments Table**

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  transaction_id VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  status VARCHAR(20) DEFAULT 'PENDING',
  payment_method VARCHAR(20) NOT NULL,
  signature TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Payment Status:**
- `PENDING`: Chờ thanh toán
- `SUCCESS`: Thành công
- `FAILED`: Thất bại
- `CANCELLED`: Đã hủy

---

#### **10. Auth Tables**

**Refresh Tokens:**
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Password Reset Tokens:**
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Authentication & Authorization

### **Authentication Flow**

#### **1. Registration**

```typescript
POST /api/auth/register
{
  email: string
  password: string
  firstName?: string
  lastName?: string
}

Response:
{
  success: true,
  data: {
    accessToken: string,      // JWT (15 minutes)
    refreshToken: string,     // JWT (7 days)
    user: {
      id: string,
      email: string,
      roles: ['user'],
      approvedStatus: null
    }
  }
}
```

**Process:**
1. Validate email uniqueness
2. Hash password với bcrypt (12 rounds)
3. Create user với role = `USER`
4. Generate access token (JWT, 15min)
5. Generate refresh token (JWT, 7 days)
6. Store refresh token in database
7. Return tokens + user info

---

#### **2. Login**

```typescript
POST /api/auth/login
{
  email: string
  password: string
}

Response:
{
  success: true,
  data: {
    accessToken: string,
    refreshToken: string,
    user: {
      id: string,
      email: string,
      roles: string[],
      approvedStatus: string | null  // vendor status if applicable
    }
  }
}
```

**Process:**
1. Validate credentials với LocalStrategy
2. Compare password với bcrypt
3. Generate new access + refresh tokens
4. Revoke old refresh tokens
5. If user is vendor, get vendor approval status
6. Return tokens + user info

---

#### **3. Token Refresh**

```typescript
POST /api/auth/refresh
{
  refreshToken: string
}

Response:
{
  success: true,
  data: {
    accessToken: string,      // New access token
    refreshToken: string      // New refresh token
  }
}
```

**Process:**
1. Verify refresh token signature
2. Check token in database (not revoked, not expired)
3. Generate new access token
4. Generate new refresh token
5. Revoke old refresh token
6. Return new tokens

**Frontend Implementation:**
- Intercept 401 responses
- Auto refresh token
- Retry failed request với new token
- Redirect to login nếu refresh failed

---

#### **4. Logout**

```typescript
POST /api/auth/logout
{
  refreshToken: string
}

Response:
{
  success: true,
  message: "Logged out successfully"
}
```

**Process:**
1. Find refresh token in database
2. Mark as revoked (`is_revoked = true`)
3. Clear client-side tokens

**Logout All Devices:**
```typescript
POST /api/auth/logout-all
Headers: { Authorization: "Bearer {accessToken}" }

Response: { success: true }
```
- Revoke tất cả refresh tokens của user

---

#### **5. Password Reset Flow**

**Step 1: Request Reset**
```typescript
POST /api/auth/forgot-password
{ email: string }

Process:
1. Find user by email
2. Generate random token (32 bytes hex)
3. Store token với expiry (15 minutes)
4. Send email với reset link
5. Return success message
```

**Step 2: Verify Token**
```typescript
GET /api/auth/reset-password/verify?token={token}

Response:
{
  success: true,
  data: {
    userId: string,
    email: string
  }
}
```

**Step 3: Reset Password**
```typescript
POST /api/auth/reset-password
{
  token: string,
  newPassword: string
}

Process:
1. Verify token validity
2. Hash new password
3. Update user password
4. Mark token as used
5. Return success
```

---

### **JWT Structure**

**Access Token Payload:**
```json
{
  "sub": "user-uuid",           // User ID
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 1234567890,            // Issued at
  "exp": 1234568790             // Expires at (15 min)
}
```

**Refresh Token Payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 1234567890,
  "exp": 1235172690             // Expires at (7 days)
}
```

---

### **Authorization (RBAC)**

#### **Role Hierarchy**

```
┌──────────┐
│  ADMIN   │  ← Full system access
└────┬─────┘
     ↓
┌──────────┐
│  VENDOR  │  ← Manage own products, view orders
└────┬─────┘
     ↓
┌──────────┐
│   USER   │  ← Shopping, orders
└──────────┘
```

#### **Permission Matrix**

| Feature | USER | VENDOR | ADMIN |
|---------|------|--------|-------|
| Browse products | ✅ | ✅ | ✅ |
| Add to cart | ✅ | ✅ | ✅ |
| Checkout | ✅ | ✅ | ✅ |
| View own orders | ✅ | ✅ | ✅ |
| Create vendor | ✅ | ❌ | ❌ |
| Manage products | ❌ | ✅ (own) | ✅ (all) |
| Update order status | ❌ | ✅ (vendor orders) | ✅ (all) |
| Approve vendors | ❌ | ❌ | ✅ |
| User management | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |

#### **Guards Implementation**

```typescript
// 1. JWT Auth Guard - Verify token
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user;  // { userId, email, roles }
}

// 2. Roles Guard - Check permissions
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN, ROLE.VENDOR)
@Get('products')
async getProducts() { }

// 3. Custom authorization in service
async updateProduct(id, dto, userId, userRole) {
  const product = await this.findById(id);
  
  // Vendor can only update own products
  if (userRole !== ROLE.ADMIN && product.vendorId !== userId) {
    throw new ForbiddenException();
  }
  
  // Update logic...
}
```

---

## 📦 Core Business Modules

### **Module 1: Products Management**

#### **Product CRUD Operations**

**Create Product (Vendor/Admin)**
```typescript
POST /api/products
Headers: { Authorization: "Bearer {token}" }
Roles: VENDOR, ADMIN

Body:
{
  name: string,
  slug: string,
  categoryId: string,
  vendorId?: string,  // Auto-filled for vendor
  brand?: string,
  thumbnail?: string,
  images?: string[],
  price?: number,
  salePrice?: number,
  stock: {
    quantity: number,
    unit: string
  },
  badges?: string[],
  specs?: Record<string, any>,
  options?: [{
    name: string,
    displayName: string,
    values: [{ value: string }]
  }],
  variants?: [{
    sku: string,
    options: Record<string, string>,
    price?: number,
    stockQty?: number
  }],
  shortDescription?: string,
  description?: string,
  datasheetUrl?: string
}

Business Rules:
1. Vendor: vendorId auto-set from auth user
2. Admin: can specify any vendorId
3. Slug must be unique
4. Validate specs against category schema
5. Variant SKUs must be unique
6. Create product → images → options → variants
```

**List Products (Public)**
```typescript
GET /api/products?q=cement&categoryId=xxx&minPrice=1000&maxPrice=5000
    &brand=Bosch&inStock=true&sort=price_asc&page=1&limit=24&withFacets=true

Response:
{
  success: true,
  data: {
    items: [
      {
        id: string,
        name: string,
        slug: string,
        thumbnail: string,
        price: number,
        salePrice?: number,
        badges: string[],
        stock: { quantity, unit },
        specsSummary: Record<string, any>,
        category: { id, name },
        vendor: { id, businessName }
      }
    ],
    pagination: {
      page: 1,
      limit: 24,
      total: 150,
      totalPages: 7
    },
    facets?: {
      brands: [{ value: "Bosch", count: 42 }],
      categories: [...],
      priceRange: { min: 1000, max: 50000 }
    }
  }
}

Filters:
- q: Full-text search (name, description, brand)
- categoryId: Filter by category
- brand: Filter by brand
- vendorId: Filter by vendor
- minPrice, maxPrice: Price range
- inStock: Only in-stock products
- sort: newest | price_asc | price_desc | bestselling

Features:
- Pagination
- Faceted search (with withFacets=true)
- Price filtering on effective price (salePrice || price)
```

**Get Product Detail**
```typescript
GET /api/products/{id}
GET /api/products/by-slug/{slug}

Response:
{
  success: true,
  data: {
    id, name, slug, category, vendor, brand,
    thumbnail, images: string[],
    price, salePrice, currency,
    stock: { quantity, unit },
    badges: string[],
    specs: Record<string, any>,
    options: [{
      id, name, displayName,
      values: [{ id, value }]
    }],
    variants: [{
      id, sku, price, stockQty,
      options: { color: "Red", size: "M" },
      specs: {...}
    }],
    shortDescription, description, datasheetUrl,
    createdAt, updatedAt
  }
}
```

**Update Product**
```typescript
PATCH /api/products/{id}
Roles: VENDOR (own products), ADMIN (all)

Body: Partial<CreateProductDto>

Business Rules:
- Vendor can only update own products
- Admin can update any product
- Cannot change vendorId (except admin)
```

**Delete Product (Soft Delete)**
```typescript
DELETE /api/products/{id}
Roles: VENDOR (own), ADMIN (all)

Process:
- Set isActive = false
- Product hidden from public listing
- Still accessible by ID for order history
```

---

### **Module 2: Shopping Cart**

#### **Cart Operations**

**Add to Cart**
```typescript
POST /api/cart/add
Headers: { Authorization: "Bearer {token}" }

Body:
{
  productId: string,
  variantId?: string,
  quantity: number
}

Business Rules:
1. Validate product exists & active
2. If variantId provided, validate variant
3. Check stock availability
4. If same product+variant exists in cart:
   - Add quantity (merge)
   - Update unit_price
5. Else create new cart item
6. Snapshot current price as unit_price

Response:
{
  success: true,
  data: {
    id: string,
    productId, variantId, quantity, unitPrice, totalPrice,
    product: { id, name, slug, images, price, salePrice },
    variant?: { id, sku, price, optionValues }
  }
}
```

**Get Cart**
```typescript
GET /api/cart
Headers: { Authorization: "Bearer {token}" }

Response:
{
  success: true,
  data: {
    items: [...],
    totalItems: 3,
    totalQuantity: 7,
    subtotal: 150000,
    total: 150000
  }
}
```

**Update Cart Item**
```typescript
PATCH /api/cart/{cartItemId}
Body: { quantity: number }

Business Rules:
- Validate new quantity <= stock
- Update quantity
- Recalculate totalPrice
```

**Remove from Cart**
```typescript
DELETE /api/cart/{cartItemId}
```

**Clear Cart**
```typescript
DELETE /api/cart
```

**Get Cart Count (Badge)**
```typescript
GET /api/cart/count

Response:
{
  success: true,
  data: { count: 3 }  // Number of different items
}
```

---

### **Module 3: Orders Management**

#### **Order Workflows**

**Create Order from Cart**
```typescript
POST /api/orders/from-cart
Headers: { Authorization: "Bearer {token}" }

Body:
{
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card' | 'e_wallet',
  shippingName: string,
  shippingPhone: string,
  shippingAddress: string,
  shippingCity: string,
  shippingDistrict: string,
  shippingWard: string,
  shippingPostalCode: string,
  customerNotes?: string
}

Process:
1. Get user's cart items
2. Validate cart not empty
3. Validate all items still available & in stock
4. Calculate totals:
   - subtotal = Σ(item.unitPrice × quantity)
   - shippingFee = subtotal >= 1M ? 0 : 30,000
   - taxAmount = 0
   - discountAmount = 0
   - totalAmount = subtotal + shipping + tax - discount
5. Generate order number: AIC{timestamp}{random}
6. Create order record
7. Create order items (snapshot product info)
8. Clear cart
9. If payment_method = 'bank_transfer':
   - Create payment record
   - Generate PayOS payment link
   - Return checkout URL
10. Return order details

Response:
{
  success: true,
  data: {
    id, orderNumber, status, paymentStatus, paymentMethod,
    subtotal, shippingFee, totalAmount,
    shippingAddress: {...},
    items: [...],
    estimatedDelivery: Date,
    createdAt
  }
}
```

**Get Orders (User)**
```typescript
GET /api/orders?status=pending&page=1&limit=10
Headers: { Authorization: "Bearer {token}" }

Response:
{
  success: true,
  data: [
    {
      id, orderNumber, status, paymentStatus,
      totalAmount, itemsCount, createdAt
    }
  ],
  meta: { total, page, limit, totalPages }
}

Filters:
- status: pending | processing | shipping | delivered | cancelled
- paymentStatus: pending | paid | failed
- User sees only their orders
- Admin sees all orders
```

**Get Order Details**
```typescript
GET /api/orders/{id}
GET /api/orders/number/{orderNumber}

Response:
{
  success: true,
  data: {
    id, orderNumber, status, paymentStatus, paymentMethod,
    subtotal, shippingFee, taxAmount, discountAmount, totalAmount,
    shippingName, shippingPhone, shippingAddress,
    shippingCity, shippingDistrict, shippingWard,
    trackingNumber, estimatedDelivery, actualDelivery,
    customerNotes, notes,
    items: [
      {
        id, productName, variantName, sku, thumbnail,
        quantity, unitPrice, totalPrice
      }
    ],
    user: { id, email },
    createdAt, updatedAt
  }
}
```

**Update Order Status (Admin/Vendor)**
```typescript
PATCH /api/orders/{id}/status
Roles: ADMIN, VENDOR

Body:
{
  status: 'processing' | 'shipping' | 'delivered' | 'cancelled',
  trackingNumber?: string,
  notes?: string
}

Business Rules:
- Set actualDelivery when status = 'delivered'
- Auto set paymentStatus = 'paid' for COD when delivered
```

**Cancel Order**
```typescript
PATCH /api/orders/{id}/cancel
Roles: USER (own orders), ADMIN (all)

Business Rules:
- Can only cancel if status = 'pending' or 'processing'
- Cannot cancel if already shipped/delivered
```

**Get Order Statistics**
```typescript
GET /api/orders/statistics

Response:
{
  success: true,
  data: {
    total: 150,
    byStatus: {
      pending: 10,
      processing: 20,
      shipping: 30,
      delivered: 85,
      cancelled: 5
    }
  }
}
```

---

### **Module 4: Vendors Management**

#### **Vendor Workflows**

**Create Vendor Profile (User)**
```typescript
POST /api/vendors
Headers: { Authorization: "Bearer {token}" }
Roles: USER (only users without vendor profile)

Body:
{
  businessName: string,
  businessDescription?: string,
  businessAddress?: string,
  businessPhone?: string,
  businessEmail?: string,
  businessLicense?: string,  // GPKD
  taxId?: string             // MST
}

Process:
1. Check user doesn't already have vendor profile
2. Create vendor với status = 'pending'
3. Update user role from 'user' to 'vendor'
4. Return vendor profile

Response:
{
  success: true,
  data: {
    id, businessName, status: 'pending',
    userId, createdAt
  }
}
```

**Get My Vendor Profile**
```typescript
GET /api/vendors/my-profile
Roles: VENDOR

Response:
{
  success: true,
  data: {
    id, businessName, businessDescription,
    businessAddress, businessPhone, businessEmail,
    businessLicense, taxId,
    status: 'pending' | 'approved' | 'rejected' | 'suspended',
    userId, createdAt, updatedAt
  }
}
```

**Update Vendor Profile (Vendor)**
```typescript
PATCH /api/vendors/my-profile
Roles: VENDOR

Body: Partial<CreateVendorDto>
(Cannot change status - only admin can)
```

**Approve Vendor (Admin)**
```typescript
PATCH /api/vendors/{id}/approve
Roles: ADMIN

Process:
- Set status = 'approved'
- Vendor can now create products
```

**Reject Vendor (Admin)**
```typescript
PATCH /api/vendors/{id}/reject
Roles: ADMIN

Process:
- Set status = 'rejected'
- Vendor cannot create products
```

**Suspend Vendor (Admin)**
```typescript
PATCH /api/vendors/{id}/suspend
Roles: ADMIN

Process:
- Set status = 'suspended'
- Hide vendor's products from listing
```

**Get Vendors List (Admin)**
```typescript
GET /api/vendors?status=pending
Roles: ADMIN

Response:
{
  success: true,
  data: [
    {
      id, businessName, status,
      user: { email },
      createdAt
    }
  ]
}
```

---

### **Module 5: Categories Management**

```typescript
GET /api/categories?productCount=true&page=1&limit=10

Response:
{
  success: true,
  data: {
    items: [
      {
        id, name, slug, thumbnail,
        parentId?,
        productCount?: 42  // if productCount=true
      }
    ],
    pagination: { page, limit, total, totalPages }
  }
}

Features:
- Hierarchical categories (via parentId)
- Product count aggregation
- Spec schema per category
```

---

## 💳 Payment Integration

### **PayOS Integration (Vietnam)**

**Payment Flow**

```
1. User checkout → Create order
2. If payment_method = 'bank_transfer':
   ↓
3. POST /api/payments
   {
     orderId: string,
     amount: number,
     description: string
   }
   ↓
4. Backend:
   - Generate signature (HMAC-SHA256)
   - Call PayOS API
   - Get checkout URL & QR code
   ↓
5. Frontend:
   - Open checkout URL in new tab
   - Show QR code
   ↓
6. User scans QR & pays
   ↓
7. PayOS webhook → POST /api/payments/webhook/payos
   {
     code: "00",
     data: { orderCode, status, amount }
   }
   ↓
8. Backend:
   - Verify webhook signature
   - Update payment status
   - Update order payment_status
   ↓
9. Redirect user to success/failure page
```

**Payment Signature Generation**

```typescript
function generateSignature(payload, checksumKey) {
  // 1. Sort object keys alphabetically
  const sortedData = sortObjDataByKey(payload);
  
  // 2. Convert to query string
  const queryStr = convertObjToQueryStr(sortedData);
  // Example: "amount=50000&cancelUrl=...&description=..."
  
  // 3. HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', checksumKey)
    .update(queryStr)
    .digest('hex');
  
  return signature;
}

// Example payload
{
  orderCode: 1234567890,
  amount: 50000,
  description: "Thanh toán đơn hàng #1234",
  cancelUrl: "https://example.com/payment/cancel",
  returnUrl: "https://example.com/payment/success"
}
```

**Create Payment**

```typescript
POST /api/payments
Headers: { Authorization: "Bearer {token}" }

Body:
{
  orderId: string,
  amount: number,
  description?: string
}

Process:
1. Validate order exists & belongs to user
2. Generate orderCode (timestamp)
3. Create signature
4. Call PayOS API:
   POST https://api-merchant.payos.vn/v2/payment-requests
   Headers:
     x-client-id: {PAYOS_CLIENT_ID}
     x-api-key: {PAYOS_API_KEY}
   Body:
     {
       orderCode, amount, description,
       cancelUrl, returnUrl, signature
     }
5. Save payment record to DB
6. Return payment link & QR code

Response:
{
  success: true,
  data: {
    payment: {
      id, orderId, amount, status: 'PENDING'
    },
    payosData: {
      checkoutUrl: "https://pay.payos.vn/...",
      qrCode: "https://...",
      orderCode: 1234567890
    }
  }
}
```

**Webhook Handler**

```typescript
POST /api/payments/webhook/payos
Headers:
  x-client-id: {PAYOS_CLIENT_ID}
  x-api-key: {PAYOS_API_KEY}

Body:
{
  code: "00",  // Success code
  data: {
    orderCode: 1234567890,
    amount: 50000,
    description: "...",
    accountNumber: "...",
    status: "PAID"
  },
  signature: "..."
}

Process:
1. Verify webhook signature
2. Find payment by orderCode
3. Update payment status
4. Update order payment_status = 'paid'
5. Send confirmation email
6. Return { code: "SUCCESS" }
```

---

## 🎛 Admin Features

### **Dashboard Statistics**

```typescript
GET /api/admin/dashboard/stats
Roles: ADMIN

Response:
{
  success: true,
  data: {
    totalRevenue: 50000000,
    totalOrders: 1500,
    totalUsers: 350,
    totalProducts: 1200,
    pendingOrders: 25,
    lowStockProducts: 15,
    todayRevenue: 2500000,
    todayOrders: 45,
    todayNewUsers: 3,
    revenueGrowth: 12.5,    // % compared to yesterday
    ordersGrowth: 8.2
  }
}
```

### **Revenue Report**

```typescript
GET /api/admin/reports/revenue?startDate=2024-01-01&endDate=2024-01-31
Roles: ADMIN

Response:
{
  success: true,
  data: [
    {
      date: "2024-01-01",
      revenue: 1500000,
      orderCount: 35
    },
    // ... daily data
  ]
}
```

### **Product Analytics**

```typescript
GET /api/admin/analytics/products
Roles: ADMIN

Response:
{
  success: true,
  data: {
    bestSellingProducts: [
      {
        productId, productName,
        totalSold: 500,
        revenue: 15000000
      }
    ],
    lowStockProducts: [
      { productId, productName, currentStock: 5 }
    ],
    outOfStockProducts: [...],
    categoriesPerformance: [
      {
        categoryId, categoryName,
        totalProducts: 150,
        totalSold: 5000,
        revenue: 75000000
      }
    ]
  }
}
```

### **User Analytics**

```typescript
GET /api/admin/analytics/users
Roles: ADMIN

Response:
{
  success: true,
  data: {
    usersByRole: {
      admin: 5,
      vendor: 50,
      user: 300
    },
    newUsersOverTime: [
      { date: "2024-01-01", count: 3 }
    ],
    topCustomers: [
      {
        userId, email,
        totalOrders: 25,
        totalSpent: 10000000
      }
    ],
    userGrowth: 15.3  // % month-over-month
  }
}
```

### **Order Management**

```typescript
GET /api/admin/orders?status=pending&userId={id}&minAmount=100000
    &startDate=2024-01-01&search=AIC123&page=1&limit=20&sortBy=createdAt&order=DESC
Roles: ADMIN

Response:
{
  success: true,
  data: [
    {
      id, userId, userEmail,
      totalAmount, status, paymentStatus,
      itemsCount, createdAt
    }
  ],
  meta: { total, page, limit, totalPages }
}
```

```typescript
GET /api/admin/orders/{id}/details
Roles: ADMIN

Response:
{
  success: true,
  data: {
    order: { id, totalAmount, status, ... },
    user: { id, email, firstName, lastName, phoneNumber },
    items: [
      {
        id, productId, productName, quantity, price,
        vendor: { id, name }
      }
    ]
  }
}
```

```typescript
PATCH /api/admin/orders/{id}/status
Roles: ADMIN
Body: { status: string, note?: string }
```

```typescript
POST /api/admin/orders/bulk-update
Roles: ADMIN
Body: {
  orderIds: string[],
  status: string
}
```

### **User Management**

```typescript
GET /api/admin/users?role=user&isActive=true&search=john&page=1
Roles: ADMIN

Response:
{
  success: true,
  data: [
    {
      id, email, firstName, lastName, phoneNumber,
      roles: ['user'],
      isActive: true,
      totalOrders: 15,
      totalSpent: 5000000,
      createdAt
    }
  ],
  meta: { total, page, limit, totalPages }
}
```

```typescript
GET /api/admin/users/{id}/activity
Roles: ADMIN

Response:
{
  success: true,
  data: {
    userId, email,
    totalOrders: 25,
    totalSpent: 10000000,
    lastOrderDate: Date,
    recentOrders: [...],
    accountInfo: {
      createdAt, isActive, roles
    }
  }
}
```

```typescript
PATCH /api/admin/users/{id}/ban
Roles: ADMIN
Body: { isActive: boolean, reason: string }
```

```typescript
PATCH /api/admin/users/{id}/role
Roles: ADMIN
Body: { role: 'user' | 'vendor' | 'admin' }
```

### **Product Management**

```typescript
GET /api/admin/products?isActive=true&stockLevel=low&vendorId={id}
    &categoryId={id}&search=cement&page=1
Roles: ADMIN

Response:
{
  success: true,
  data: [
    {
      id, name, slug, price, stockQty, isActive,
      categoryId, categoryName,
      vendorId, vendorName,
      totalSold: 150,
      createdAt
    }
  ],
  meta: { total, page, limit, totalPages }
}

Stock Levels:
- low: stockQty > 0 AND stockQty < 20
- out: stockQty = 0
- normal: stockQty >= 20
```

```typescript
PATCH /api/admin/products/{id}/stock
Roles: ADMIN
Body: {
  stockQuantity: number,
  reason: string
}
```

```typescript
POST /api/admin/products/bulk-update
Roles: ADMIN
Body: {
  productIds: string[],
  isActive?: boolean,
  categoryId?: string,
  vendorId?: string
}
```

```typescript
GET /api/admin/products/{id}/sales?startDate=2024-01-01&endDate=2024-01-31
Roles: ADMIN

Response:
{
  success: true,
  data: {
    productId, productName,
    totalSold: 500,
    totalRevenue: 15000000,
    salesByDate: [
      { date: "2024-01-01", quantity: 15, revenue: 450000 }
    ]
  }
}
```

### **System Health**

```typescript
GET /api/admin/system/health
Roles: ADMIN

Response:
{
  success: true,
  data: {
    status: 'healthy' | 'degraded' | 'down',
    database: 'connected' | 'disconnected',
    responseTime: 45,      // ms
    memoryUsage: 125.5,    // MB
    cpuUsage: 25.3,        // %
    uptime: 86400,         // seconds
    timestamp: Date
  }
}
```

---

## 🔒 Security & Best Practices

### **Security Features**

#### **1. Password Security**

```typescript
// Bcrypt hashing (12 rounds)
@BeforeInsert()
async hashPasswordOnInsert() {
  if (this.password) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
}

// Password validation
async validatePassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
}
```

**Best Practices:**
- Min 8 characters
- Always hash before storing
- Use bcrypt with 12 rounds
- Never log passwords
- Never return password in API responses

---

#### **2. JWT Security**

```typescript
// Access Token: Short-lived (15 minutes)
{
  secret: 'strong-secret-key-256-bits-minimum',
  expiresIn: '15m'
}

// Refresh Token: Longer-lived (7 days)
{
  secret: 'different-secret-key-256-bits',
  expiresIn: '7d'
}
```

**Best Practices:**
- Use separate secrets for access & refresh tokens
- Minimum 256-bit secrets
- Store refresh tokens in database
- Implement token rotation
- Revoke tokens on logout
- Blacklist compromised tokens

---

#### **3. Input Validation**

```typescript
// DTO Validation với class-validator
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(220)
  name: string;
  
  @IsNumber()
  @Min(0)
  price: number;
  
  @IsEmail()
  email: string;
  
  @IsUUID()
  categoryId: string;
}

// Global Validation Pipe
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown
    transformOptions: {
      enableImplicitConversion: true
    }
  })
);
```

---

#### **4. SQL Injection Prevention**

```typescript
// TypeORM Query Builder (Safe)
await this.repository
  .createQueryBuilder('product')
  .where('product.name ILIKE :search', { search: `%${query}%` })
  .getMany();

// Parameterized queries prevent SQL injection
```

---

#### **5. CORS Configuration**

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4050'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
```

---

#### **6. Rate Limiting**

```typescript
// Recommended: Use @nestjs/throttler
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,        // 60 seconds
      limit: 10,      // 10 requests
    }),
  ],
})

// Apply to specific routes
@UseGuards(ThrottlerGuard)
@Post('login')
async login() { }
```

---

#### **7. Error Handling**

```typescript
// Global Exception Filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // 1. Log error for debugging
    this.logger.error(exception);
    
    // 2. Format user-friendly response
    const response: ApiResponse = {
      success: false,
      message: 'Sanitized error message',  // Don't leak sensitive info
      data: null,
      errors: validationErrors,
      statusCode: httpStatus
    };
    
    // 3. Send response
    res.status(status).json(response);
  }
}
```

**Never expose:**
- Database errors
- Stack traces
- Internal paths
- Sensitive configuration

---

### **API Response Format**

#### **Success Response**

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": { ... },
  "errors": null,
  "statusCode": 200
}
```

#### **Error Response**

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": {
    "validation": [
      "email must be a valid email",
      "password must be at least 8 characters"
    ]
  },
  "statusCode": 400
}
```

#### **Pagination Response**

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 24,
    "totalPages": 7
  }
}
```

---

## 🚀 Deployment Guide

### **Environment Variables**

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=aicshop_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-256-bits
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-256-bits
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:4050,https://yourdomain.com

# PayOS
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key
PAYMENT_CANCEL_URL=http://localhost:4050/payment/cancel
PAYMENT_RETURN_URL=http://localhost:4050/payment/success

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@aicshop.com
CLIENT_URL=http://localhost:4050

# App
PORT=3000
NODE_ENV=production
```

---

### **Docker Deployment**

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: aicshop_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  api:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
    env_file:
      - .env

volumes:
  postgres_data:
```

**Run:**
```bash
docker-compose up --build
```

---

### **Database Migration**

```bash
# Generate migration
npm run typeorm migration:generate -- -n CreateUsers

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

---

### **Seeding Database**

```bash
# Seed all data
npm run seed

# Clear all data
npm run seed:clear

# Refresh (clear + seed)
npm run seed:refresh
```

---

### **Production Checklist**

- [ ] Set strong JWT secrets (256-bit minimum)
- [ ] Configure CORS for production domains
- [ ] Enable HTTPS only
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Configure logging (e.g., Winston)
- [ ] Set NODE_ENV=production
- [ ] Disable Swagger in production (optional)
- [ ] Set up reverse proxy (Nginx)
- [ ] Configure firewall rules
- [ ] Set up SSL certificates
- [ ] Configure health check endpoints
- [ ] Set up CI/CD pipeline
- [ ] Test all critical flows

---

## 📞 Support & Contact

For questions or issues, please contact:
- **Developer:** Nhan Bernie
- **Email:** support@aicshop.com
- **Documentation:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

**Document Version:** 1.0.0  
**Last Updated:** October 20, 2025  
**Maintained by:** AICShop Development Team

