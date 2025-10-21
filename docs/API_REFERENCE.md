# 🔌 AICSHOP API REFERENCE

> **Complete API Endpoints Documentation**
>
> Base URL: `http://localhost:3000/api`
>
> Swagger Docs: `http://localhost:3000/api/docs`

---

## 📑 Table of Contents

1. [Authentication APIs](#-authentication-apis)
2. [Products APIs](#-products-apis)
3. [Categories APIs](#-categories-apis)
4. [Cart APIs](#-cart-apis)
5. [Orders APIs](#-orders-apis)
6. [Payments APIs](#-payments-apis)
7. [Vendors APIs](#-vendors-apis)
8. [Users APIs](#-users-apis)
9. [Admin APIs](#-admin-apis)
10. [Error Codes](#-error-codes)

---

## 🔐 Authentication APIs

### **POST /api/auth/register**

Register a new user account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+84987654321"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "roles": ["user"],
      "approvedStatus": null
    }
  },
  "errors": null,
  "statusCode": 201
}
```

**Errors:**
- `409 Conflict` - Email already exists
- `400 Bad Request` - Validation failed

---

### **POST /api/auth/login**

Login with email and password.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "roles": ["user"],
      "approvedStatus": null
    }
  },
  "errors": null,
  "statusCode": 200
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials

---

### **POST /api/auth/refresh**

Refresh access token using refresh token.

**Request:**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Làm mới token thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "errors": null,
  "statusCode": 200
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### **POST /api/auth/logout**

Logout (revoke refresh token).

**Request:**
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Đăng xuất thành công",
  "data": {
    "message": "Logged out successfully"
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **POST /api/auth/logout-all**

Logout from all devices (revoke all refresh tokens).

**Request:**
```http
POST /api/auth/logout-all
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Đăng xuất thành công",
  "data": {
    "message": "Logged out from all devices successfully"
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **GET /api/auth/profile**

Get authenticated user profile.

**Request:**
```http
GET /api/auth/profile
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy thông tin profile thành công",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "roles": ["vendor"],
    "approvedStatus": "approved"
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **POST /api/auth/forgot-password**

Request password reset email.

**Request:**
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email đặt lại mật khẩu đã được gửi",
  "data": null,
  "errors": null,
  "statusCode": 200
}
```

---

### **GET /api/auth/reset-password/verify**

Verify password reset token.

**Request:**
```http
GET /api/auth/reset-password/verify?token={resetToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token đặt lại mật khẩu hợp lệ",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  },
  "errors": null,
  "statusCode": 200
}
```

**Errors:**
- `400 Bad Request` - Invalid or expired token

---

### **POST /api/auth/reset-password**

Reset password with token.

**Request:**
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "NewSecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công",
  "data": null,
  "errors": null,
  "statusCode": 200
}
```

---

## 📦 Products APIs

### **GET /api/products**

Get list of products with filtering and pagination.

**Request:**
```http
GET /api/products?q=cement&categoryId=cat-123&brand=Bosch&minPrice=1000&maxPrice=50000&inStock=true&sort=price_asc&page=1&limit=24&withFacets=true
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | Search keyword | `cement` |
| `categoryId` | UUID | Filter by category | `cat-123` |
| `brand` | string | Filter by brand | `Bosch` |
| `vendorId` | UUID | Filter by vendor | `v-456` |
| `minPrice` | number | Minimum price | `1000` |
| `maxPrice` | number | Maximum price | `50000` |
| `inStock` | boolean | Only in-stock items | `true` |
| `sort` | enum | Sort order | `newest`, `price_asc`, `price_desc`, `bestselling` |
| `page` | number | Page number (≥1) | `1` |
| `limit` | number | Items per page (1-100) | `24` |
| `withFacets` | boolean | Include facets | `true` |

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {
    "items": [
      {
        "id": "prod-123",
        "name": "Xi măng Portland PCB40",
        "slug": "xi-mang-portland-pcb40",
        "thumbnail": "https://cdn.example.com/thumb.jpg",
        "price": 95000,
        "salePrice": 85000,
        "currency": "VND",
        "badges": ["sale", "bestseller"],
        "stock": {
          "quantity": 1000,
          "unit": "bao"
        },
        "specsSummary": {
          "weight": "50kg",
          "origin": "Việt Nam"
        },
        "category": {
          "id": "cat-123",
          "name": "Xi măng"
        },
        "vendor": {
          "id": "v-456",
          "businessName": "Công ty TNHH Xi măng Việt"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 24,
      "total": 150,
      "totalPages": 7
    },
    "facets": {
      "brands": [
        { "value": "Bosch", "count": 42 },
        { "value": "Makita", "count": 35 }
      ],
      "categories": [],
      "priceRange": {
        "min": 1000,
        "max": 500000
      },
      "specs": {}
    }
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **GET /api/products/:id**

Get product details by ID.

**Request:**
```http
GET /api/products/prod-123
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy chi tiết sản phẩm thành công",
  "data": {
    "id": "prod-123",
    "name": "Xi măng Portland PCB40",
    "slug": "xi-mang-portland-pcb40",
    "category": {
      "id": "cat-123",
      "name": "Xi măng"
    },
    "vendor": {
      "id": "v-456",
      "businessName": "Công ty TNHH Xi măng Việt"
    },
    "brand": "Hà Tiên 1",
    "thumbnail": "https://cdn.example.com/thumb.jpg",
    "images": [
      "https://cdn.example.com/1.jpg",
      "https://cdn.example.com/2.jpg"
    ],
    "price": 95000,
    "salePrice": 85000,
    "currency": "VND",
    "stock": {
      "quantity": 1000,
      "unit": "bao"
    },
    "badges": ["sale", "bestseller"],
    "specs": {
      "weight": { "value": 50, "unit": "kg" },
      "origin": "Việt Nam",
      "standard": "TCVN 2682:2009"
    },
    "options": [
      {
        "id": "opt-1",
        "name": "size",
        "displayName": "Kích thước",
        "values": [
          { "id": "val-1", "value": "40kg" },
          { "id": "val-2", "value": "50kg" }
        ]
      }
    ],
    "variants": [
      {
        "id": "var-1",
        "sku": "CEMENT-40KG",
        "price": 75000,
        "stockQty": 500,
        "options": {
          "size": "40kg"
        },
        "specs": {
          "weight": { "value": 40, "unit": "kg" }
        }
      }
    ],
    "shortDescription": "Xi măng chất lượng cao",
    "description": "<p>Mô tả chi tiết sản phẩm...</p>",
    "datasheetUrl": "https://cdn.example.com/datasheet.pdf",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "errors": null,
  "statusCode": 200
}
```

**Errors:**
- `404 Not Found` - Product not found

---

### **GET /api/products/by-slug/:slug**

Get product details by slug.

**Request:**
```http
GET /api/products/by-slug/xi-mang-portland-pcb40
```

**Response:** Same as GET by ID

---

### **POST /api/products**

Create a new product (Vendor/Admin only).

**Request:**
```http
POST /api/products
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Bu lông inox M8",
  "slug": "bu-long-inox-m8",
  "categoryId": "cat-bolts",
  "vendorId": "v-001",
  "brand": "Inox Việt",
  "thumbnail": "https://cdn.example.com/thumb.jpg",
  "images": [
    "https://cdn.example.com/1.jpg",
    "https://cdn.example.com/2.jpg"
  ],
  "price": 3000,
  "salePrice": 2500,
  "currency": "VND",
  "stock": {
    "quantity": 10000,
    "unit": "cái"
  },
  "badges": ["new"],
  "specs": {
    "threadPitch": { "value": 1.25, "unit": "mm" },
    "strengthClass": "8.8",
    "coating": "Zinc plated"
  },
  "options": [
    {
      "name": "length",
      "displayName": "Chiều dài",
      "values": [
        { "value": "30mm" },
        { "value": "50mm" }
      ]
    }
  ],
  "variants": [
    {
      "sku": "BOLT-M8-30",
      "options": {
        "length": "30mm"
      },
      "price": 2000,
      "stockQty": 5000
    },
    {
      "sku": "BOLT-M8-50",
      "options": {
        "length": "50mm"
      },
      "price": 2500,
      "stockQty": 5000
    }
  ],
  "shortDescription": "Bu lông inox chất lượng cao",
  "description": "<p>Mô tả chi tiết...</p>",
  "datasheetUrl": "https://cdn.example.com/spec.pdf"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Tạo sản phẩm thành công",
  "data": {
    "id": "prod-new-123"
  },
  "errors": null,
  "statusCode": 201
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a vendor or admin
- `409 Conflict` - Slug already exists
- `400 Bad Request` - Validation failed

**Authorization:**
- **Vendor:** Can create products (vendorId auto-filled)
- **Admin:** Can create products for any vendor

---

### **PATCH /api/products/:id**

Update a product (Vendor own products / Admin all).

**Request:**
```http
PATCH /api/products/prod-123
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "price": 100000,
  "salePrice": 90000,
  "stock": {
    "quantity": 500,
    "unit": "bao"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cập nhật sản phẩm thành công",
  "data": {
    "id": "prod-123"
  },
  "errors": null,
  "statusCode": 200
}
```

**Errors:**
- `403 Forbidden` - Vendor can only update own products
- `404 Not Found` - Product not found

---

### **DELETE /api/products/:id**

Delete a product (soft delete).

**Request:**
```http
DELETE /api/products/prod-123
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Xóa sản phẩm thành công",
  "data": null,
  "errors": null,
  "statusCode": 200
}
```

**Note:** Soft delete (sets `isActive = false`)

---

### **GET /api/products/:id/variants**

Get product variants.

**Request:**
```http
GET /api/products/prod-123/variants
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy danh sách variants thành công",
  "data": [
    {
      "id": "var-1",
      "sku": "CEMENT-40KG",
      "price": 75000,
      "stockQty": 500,
      "options": {
        "size": "40kg"
      },
      "specs": {
        "weight": { "value": 40, "unit": "kg" }
      }
    }
  ],
  "errors": null,
  "statusCode": 200
}
```

---

## 📂 Categories APIs

### **GET /api/categories**

Get list of categories.

**Request:**
```http
GET /api/categories?q=cement&parentId=cat-123&productCount=true&page=1&limit=10
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search by name/slug |
| `parentId` | UUID | Filter by parent category |
| `productCount` | boolean | Include product count |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {
    "items": [
      {
        "id": "cat-123",
        "name": "Xi măng",
        "slug": "xi-mang",
        "thumbnail": "https://cdn.example.com/cat.jpg",
        "parentId": null,
        "productCount": 42
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  },
  "errors": null,
  "statusCode": 200
}
```

---

## 🛒 Cart APIs

### **POST /api/cart/add**

Add item to cart.

**Request:**
```http
POST /api/cart/add
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productId": "prod-123",
  "variantId": "var-1",
  "quantity": 5
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "id": "cart-item-1",
    "productId": "prod-123",
    "variantId": "var-1",
    "quantity": 5,
    "unitPrice": 85000,
    "totalPrice": 425000,
    "product": {
      "id": "prod-123",
      "name": "Xi măng Portland PCB40",
      "slug": "xi-mang-portland-pcb40",
      "images": ["https://cdn.example.com/1.jpg"],
      "price": 95000,
      "salePrice": 85000
    },
    "variant": {
      "id": "var-1",
      "sku": "CEMENT-40KG",
      "price": 85000,
      "optionValues": [
        {
          "optionName": "size",
          "value": "40kg"
        }
      ]
    },
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "errors": null,
  "statusCode": 201
}
```

**Errors:**
- `404 Not Found` - Product or variant not found
- `400 Bad Request` - Insufficient stock

---

### **GET /api/cart**

Get user's cart.

**Request:**
```http
GET /api/cart
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {
    "items": [
      {
        "id": "cart-item-1",
        "productId": "prod-123",
        "variantId": "var-1",
        "quantity": 5,
        "unitPrice": 85000,
        "totalPrice": 425000,
        "product": { ... },
        "variant": { ... },
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z"
      }
    ],
    "totalItems": 3,
    "totalQuantity": 12,
    "subtotal": 1250000,
    "total": 1250000
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **GET /api/cart/count**

Get cart item count (for badge).

**Request:**
```http
GET /api/cart/count
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cart count retrieved successfully",
  "data": {
    "count": 3
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **PATCH /api/cart/:id**

Update cart item quantity.

**Request:**
```http
PATCH /api/cart/cart-item-1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "quantity": 10
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": { ... },
  "errors": null,
  "statusCode": 200
}
```

**Errors:**
- `400 Bad Request` - Quantity exceeds stock

---

### **DELETE /api/cart/:id**

Remove item from cart.

**Request:**
```http
DELETE /api/cart/cart-item-1
Authorization: Bearer {accessToken}
```

**Response:** `204 No Content`

---

### **DELETE /api/cart**

Clear entire cart.

**Request:**
```http
DELETE /api/cart
Authorization: Bearer {accessToken}
```

**Response:** `204 No Content`

---

## 📋 Orders APIs

### **POST /api/orders/from-cart**

Create order from cart (checkout).

**Request:**
```http
POST /api/orders/from-cart
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "paymentMethod": "bank_transfer",
  "shippingName": "Nguyễn Văn A",
  "shippingPhone": "+84987654321",
  "shippingAddress": "123 Đường ABC",
  "shippingCity": "Hồ Chí Minh",
  "shippingDistrict": "Quận 1",
  "shippingWard": "Phường Bến Nghé",
  "shippingPostalCode": "700000",
  "customerNotes": "Giao giờ hành chính"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Đơn hàng đã được tạo thành công từ giỏ hàng",
  "data": {
    "id": "order-123",
    "orderNumber": "AIC123456789012",
    "userId": "user-456",
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "bank_transfer",
    "subtotal": 1250000,
    "shippingFee": 0,
    "taxAmount": 0,
    "discountAmount": 0,
    "totalAmount": 1250000,
    "currency": "VND",
    "shippingName": "Nguyễn Văn A",
    "shippingPhone": "+84987654321",
    "shippingAddress": "123 Đường ABC",
    "shippingCity": "Hồ Chí Minh",
    "shippingDistrict": "Quận 1",
    "shippingWard": "Phường Bến Nghé",
    "shippingPostalCode": "700000",
    "trackingNumber": null,
    "estimatedDelivery": "2024-01-23T00:00:00.000Z",
    "actualDelivery": null,
    "notes": null,
    "customerNotes": "Giao giờ hành chính",
    "items": [
      {
        "id": "item-1",
        "productId": "prod-123",
        "variantId": "var-1",
        "productName": "Xi măng Portland PCB40",
        "variantName": "40kg",
        "sku": "CEMENT-40KG",
        "thumbnail": "https://cdn.example.com/thumb.jpg",
        "quantity": 5,
        "unitPrice": 85000,
        "totalPrice": 425000,
        "currency": "VND"
      }
    ],
    "user": {
      "id": "user-456",
      "email": "user@example.com",
      "firstName": "Văn A",
      "lastName": "Nguyễn"
    },
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  },
  "errors": null,
  "statusCode": 201
}
```

**Errors:**
- `400 Bad Request` - Cart empty or insufficient stock

**Notes:**
- Cart is cleared after successful order creation
- Free shipping if subtotal >= 1,000,000 VND

---

### **GET /api/orders**

Get user's orders.

**Request:**
```http
GET /api/orders?status=pending&paymentStatus=paid&page=1&limit=10
Authorization: Bearer {accessToken}
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Order status filter |
| `paymentStatus` | enum | Payment status filter |
| `orderNumber` | string | Search by order number |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy danh sách đơn hàng thành công",
  "data": [
    {
      "id": "order-123",
      "orderNumber": "AIC123456789012",
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "bank_transfer",
      "totalAmount": 1250000,
      "itemsCount": 3,
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **GET /api/orders/:id**

Get order details.

**Request:**
```http
GET /api/orders/order-123
Authorization: Bearer {accessToken}
```

**Response:** `200 OK` (same as create order response)

**Errors:**
- `404 Not Found` - Order not found
- `403 Forbidden` - Not authorized to view this order

---

### **GET /api/orders/number/:orderNumber**

Get order by order number.

**Request:**
```http
GET /api/orders/number/AIC123456789012
Authorization: Bearer {accessToken}
```

**Response:** `200 OK` (same as get by ID)

---

### **PATCH /api/orders/:id/status**

Update order status (Admin/Vendor only).

**Request:**
```http
PATCH /api/orders/order-123/status
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "shipping",
  "trackingNumber": "VTP12345678",
  "notes": "Đã gửi hàng qua đối tác vận chuyển"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cập nhật trạng thái đơn hàng thành công",
  "data": { ... },
  "errors": null,
  "statusCode": 200
}
```

**Authorization:**
- **Vendor:** Can update orders containing their products
- **Admin:** Can update all orders

---

### **PATCH /api/orders/:id/cancel**

Cancel an order.

**Request:**
```http
PATCH /api/orders/order-123/cancel
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Hủy đơn hàng thành công",
  "data": { ... },
  "errors": null,
  "statusCode": 200
}
```

**Business Rules:**
- Can only cancel if status = `pending` or `processing`
- Cannot cancel if already shipped/delivered

---

### **GET /api/orders/statistics**

Get order statistics.

**Request:**
```http
GET /api/orders/statistics
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy thống kê đơn hàng thành công",
  "data": {
    "total": 150,
    "byStatus": {
      "pending": 10,
      "processing": 20,
      "shipping": 30,
      "delivered": 85,
      "cancelled": 5
    }
  },
  "errors": null,
  "statusCode": 200
}
```

---

## 💳 Payments APIs

### **POST /api/payments**

Create payment (for bank transfer).

**Request:**
```http
POST /api/payments
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "orderId": "order-123",
  "amount": 1250000,
  "description": "Thanh toán đơn hàng #AIC123456789012"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Tạo payment thành công",
  "data": {
    "status": "success",
    "data": {
      "payment": {
        "id": "payment-1",
        "orderId": "order-123",
        "amount": 1250000,
        "status": "PENDING",
        "paymentMethod": "PAYOS",
        "signature": "abc123...",
        "createdAt": "2024-01-20T10:30:00.000Z"
      },
      "payosData": {
        "code": "00",
        "desc": "success",
        "data": {
          "bin": "970422",
          "accountNumber": "113366668888",
          "accountName": "NGUYEN VAN A",
          "amount": 1250000,
          "description": "Thanh toán đơn hàng #AIC123456789012",
          "orderCode": 1705743000123,
          "currency": "VND",
          "paymentLinkId": "abc-def-ghi",
          "status": "PENDING",
          "checkoutUrl": "https://pay.payos.vn/web/abc-def-ghi",
          "qrCode": "https://qr.payos.vn/abc-def-ghi.png"
        },
        "signature": "xyz789..."
      }
    }
  },
  "errors": null,
  "statusCode": 201
}
```

**Usage:**
1. Frontend opens `checkoutUrl` in new tab
2. Display QR code for mobile payment
3. User scans & pays
4. PayOS webhook updates payment status
5. Frontend redirects to success/failure page

---

### **POST /api/payments/webhook/payos**

PayOS webhook handler (internal use).

**Request:**
```http
POST /api/payments/webhook/payos
Content-Type: application/json
x-client-id: {PAYOS_CLIENT_ID}
x-api-key: {PAYOS_API_KEY}

{
  "code": "00",
  "data": {
    "orderCode": 1705743000123,
    "amount": 1250000,
    "description": "Thanh toán đơn hàng #AIC123456789012",
    "accountNumber": "113366668888",
    "status": "PAID"
  },
  "signature": "..."
}
```

**Response:** `200 OK`
```json
{
  "code": "SUCCESS"
}
```

**Process:**
1. Verify webhook signature
2. Find payment by orderCode
3. Update payment status = SUCCESS
4. Update order paymentStatus = paid
5. Send email confirmation

---

## 🏪 Vendors APIs

### **POST /api/vendors**

Create vendor profile (User only).

**Request:**
```http
POST /api/vendors
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "businessName": "Công ty TNHH Vật liệu XD ABC",
  "businessDescription": "Cung cấp vật liệu xây dựng chất lượng cao",
  "businessAddress": "123 Đường ABC, Quận 1, TP.HCM",
  "businessPhone": "+84901234567",
  "businessEmail": "contact@abc.com",
  "businessLicense": "0123456789",
  "taxId": "0123456789-001"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Tạo vendor thành công",
  "data": {
    "id": "vendor-1",
    "userId": "user-456",
    "businessName": "Công ty TNHH Vật liệu XD ABC",
    "businessDescription": "Cung cấp vật liệu xây dựng chất lượng cao",
    "businessAddress": "123 Đường ABC, Quận 1, TP.HCM",
    "businessPhone": "+84901234567",
    "businessEmail": "contact@abc.com",
    "businessLicense": "0123456789",
    "taxId": "0123456789-001",
    "status": "pending",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "errors": null,
  "statusCode": 201
}
```

**Errors:**
- `409 Conflict` - User already has a vendor profile

**Notes:**
- User role automatically changed from `user` to `vendor`
- Initial status is `pending` (requires admin approval)

---

### **GET /api/vendors/my-profile**

Get my vendor profile (Vendor only).

**Request:**
```http
GET /api/vendors/my-profile
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy thông tin vendor thành công",
  "data": {
    "id": "vendor-1",
    "userId": "user-456",
    "businessName": "Công ty TNHH Vật liệu XD ABC",
    "status": "approved",
    "user": {
      "id": "user-456",
      "email": "vendor@example.com"
    },
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **PATCH /api/vendors/my-profile**

Update my vendor profile (Vendor only).

**Request:**
```http
PATCH /api/vendors/my-profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "businessPhone": "+84909999999",
  "businessDescription": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cập nhật vendor thành công",
  "data": { ... },
  "errors": null,
  "statusCode": 200
}
```

**Note:** Cannot change `status` (only admin can)

---

### **GET /api/vendors**

Get all vendors (Admin only).

**Request:**
```http
GET /api/vendors?status=pending
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy danh sách vendor thành công",
  "data": [
    {
      "id": "vendor-1",
      "businessName": "Công ty TNHH Vật liệu XD ABC",
      "status": "pending",
      "user": {
        "id": "user-456",
        "email": "vendor@example.com"
      },
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ],
  "errors": null,
  "statusCode": 200
}
```

---

### **PATCH /api/vendors/:id/approve**

Approve vendor (Admin only).

**Request:**
```http
PATCH /api/vendors/vendor-1/approve
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Vendor đã được phê duyệt",
  "data": {
    "id": "vendor-1",
    "status": "approved",
    ...
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **PATCH /api/vendors/:id/reject**

Reject vendor (Admin only).

**Request:**
```http
PATCH /api/vendors/vendor-1/reject
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Vendor đã bị từ chối",
  "data": {
    "id": "vendor-1",
    "status": "rejected",
    ...
  },
  "errors": null,
  "statusCode": 200
}
```

---

### **PATCH /api/vendors/:id/suspend**

Suspend vendor (Admin only).

**Request:**
```http
PATCH /api/vendors/vendor-1/suspend
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Vendor đã bị tạm ngưng",
  "data": {
    "id": "vendor-1",
    "status": "suspended",
    ...
  },
  "errors": null,
  "statusCode": 200
}
```

---

## 👥 Users APIs

### **GET /api/users**

Get all users (Admin only).

**Request:**
```http
GET /api/users
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": [
    {
      "id": "user-1",
      "email": "user@example.com",
      "firstName": "Văn A",
      "lastName": "Nguyễn",
      "phoneNumber": "+84987654321",
      "roles": ["user"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "errors": null,
  "statusCode": 200
}
```

---

### **GET /api/users/:id**

Get user by ID (Admin/Vendor/User own).

**Request:**
```http
GET /api/users/user-1
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Tìm thấy người dùng",
  "data": {
    "id": "user-1",
    "email": "user@example.com",
    "firstName": "Văn A",
    "lastName": "Nguyễn",
    "phoneNumber": "+84987654321",
    "roles": ["user"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "errors": null,
  "statusCode": 200
}
```

---

## 🎛 Admin APIs

All admin APIs require `Authorization: Bearer {accessToken}` and `ADMIN` role.

### **Dashboard**

#### **GET /api/admin/dashboard/stats**

Get dashboard statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalRevenue": 50000000,
    "totalOrders": 1500,
    "totalUsers": 350,
    "totalProducts": 1200,
    "pendingOrders": 25,
    "lowStockProducts": 15,
    "todayRevenue": 2500000,
    "todayOrders": 45,
    "todayNewUsers": 3,
    "revenueGrowth": 12.5,
    "ordersGrowth": 8.2
  }
}
```

---

#### **GET /api/admin/reports/revenue**

Get revenue report.

**Query Parameters:**
- `startDate`: Start date (ISO string)
- `endDate`: End date (ISO string)
- `groupBy`: `day` | `week` | `month`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "revenue": 1500000,
      "orderCount": 35
    }
  ]
}
```

---

#### **GET /api/admin/analytics/products**

Get product analytics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "bestSellingProducts": [
      {
        "productId": "prod-1",
        "productName": "Xi măng Portland",
        "totalSold": 500,
        "revenue": 15000000
      }
    ],
    "lowStockProducts": [...],
    "outOfStockProducts": [...],
    "categoriesPerformance": [...]
  }
}
```

---

#### **GET /api/admin/analytics/users**

Get user analytics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "usersByRole": {
      "admin": 5,
      "vendor": 50,
      "user": 300
    },
    "newUsersOverTime": [...],
    "topCustomers": [...],
    "userGrowth": 15.3
  }
}
```

---

### **Order Management**

#### **GET /api/admin/orders**

Get all orders with advanced filters.

**Query Parameters:**
- `status`, `userId`, `vendorId`, `minAmount`, `maxAmount`
- `startDate`, `endDate`, `search`
- `page`, `limit`, `sortBy`, `order`

**Response:** Same as user orders list with more data

---

#### **GET /api/admin/orders/:id/details**

Get full order details.

**Response:** Includes user info, items with vendor info

---

#### **PATCH /api/admin/orders/:id/status**

Update order status.

**Request Body:**
```json
{
  "status": "shipping",
  "note": "Admin note"
}
```

---

#### **POST /api/admin/orders/bulk-update**

Bulk update order status.

**Request Body:**
```json
{
  "orderIds": ["order-1", "order-2"],
  "status": "processing"
}
```

---

### **User Management**

#### **GET /api/admin/users**

Get users with filters.

**Query Parameters:**
- `role`, `isActive`, `search`, `page`, `limit`

---

#### **GET /api/admin/users/:id/activity**

Get user activity and statistics.

---

#### **PATCH /api/admin/users/:id/ban**

Ban/unban user.

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Violation of terms"
}
```

---

#### **PATCH /api/admin/users/:id/role**

Change user role.

**Request Body:**
```json
{
  "role": "admin"
}
```

---

### **Product Management**

#### **GET /api/admin/products**

Get products with admin filters.

**Query Parameters:**
- `isActive`, `stockLevel` (`low`/`out`/`normal`)
- `vendorId`, `categoryId`, `search`

---

#### **PATCH /api/admin/products/:id/stock**

Update product stock.

**Request Body:**
```json
{
  "stockQuantity": 1000,
  "reason": "Nhập hàng mới"
}
```

---

#### **POST /api/admin/products/bulk-update**

Bulk update products.

**Request Body:**
```json
{
  "productIds": ["prod-1", "prod-2"],
  "isActive": false
}
```

---

#### **GET /api/admin/products/:id/sales**

Get product sales report.

---

#### **GET /api/admin/system/health**

Check system health.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "responseTime": 45,
    "memoryUsage": 125.5,
    "cpuUsage": 25.3,
    "uptime": 86400,
    "timestamp": "2024-01-20T10:00:00.000Z"
  }
}
```

---

## ⚠️ Error Codes

### **HTTP Status Codes**

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created |
| `204` | No Content | Request successful, no data |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Authentication required or failed |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource already exists |
| `500` | Internal Server Error | Server error |

---

### **Error Response Format**

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": {
    "validation": [
      "email must be a valid email",
      "password must be at least 8 characters"
    ],
    "error": "Bad Request",
    "statusCode": 400
  },
  "statusCode": 400
}
```

---

### **Common Error Messages**

| Message | Cause | Solution |
|---------|-------|----------|
| `User with this email already exists` | Email conflict | Use different email |
| `Invalid credentials` | Wrong email/password | Check credentials |
| `Invalid refresh token` | Token expired or revoked | Re-login |
| `Không tìm thấy sản phẩm` | Product not found | Check product ID |
| `Insufficient stock` | Not enough inventory | Reduce quantity |
| `Cannot cancel order at current status` | Order already shipped | Contact support |
| `You can only update your own products` | Authorization failed | Check permissions |
| `Slug đã tồn tại` | Duplicate slug | Use unique slug |

---

**Document Version:** 1.0.0  
**Last Updated:** October 20, 2025  
**Swagger Documentation:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)


