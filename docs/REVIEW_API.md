# Product Review API Documentation

## Base URL: `/api/reviews`

## Business Rules

✅ **Điều kiện review:**
- Order = **DELIVERED**
- Product có trong order
- Mỗi user chỉ review **1 lần/product/order**

📝 **Quy tắc sửa:**
- Trong **1 tháng** sau khi tạo
- Tối đa **3 lần** (field `editCount`)

🚫 **Không thể xóa review**

---

## Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reviews` | User | Tạo review |
| GET | `/reviews/product/:id` | Public | Reviews của product |
| GET | `/reviews/product/:id/stats` | Public | Thống kê rating |
| GET | `/reviews/vendor/:id/overview` | Public | Tổng quan shop |
| PATCH | `/reviews/:id` | User | Sửa review |
| POST | `/reviews/:id/reply` | Vendor | Vendor reply |

---

## 1. POST `/reviews` - Tạo Review

**Request:**
```json
{
  "productId": "uuid",
  "orderId": "uuid",
  "rating": 5,
  "comment": "Sản phẩm tốt!",
  "images": ["url"]
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "rating": 5,
    "editCount": 0,
    "createdAt": "2025-11-08T10:30:00Z"
  }
}
```

---

## 2. GET `/reviews/product/:id/stats` - Thống Kê Rating

**Response:**
```json
{
  "data": {
    "averageRating": 4.5,
    "totalReviews": 150,
    "ratingDistribution": {
      "1": 5,
      "2": 10,
      "3": 20,
      "4": 50,
      "5": 65
    }
  }
}
```

### 📊 Công Thức Tính

**Average Rating:**
```js
sum = (5×1) + (10×2) + (20×3) + (50×4) + (65×5) = 610
averageRating = Math.round((610 / 150) * 10) / 10 = 4.1
```

**Rating Distribution:**
```js
ratingDistribution = {
  "1": count(rating === 1),  // 5
  "2": count(rating === 2),  // 10
  "3": count(rating === 3),  // 20
  "4": count(rating === 4),  // 50
  "5": count(rating === 5),  // 65
}
// Tổng: 5+10+20+50+65 = 150 ✅
```

**Percentage (FE):**
```js
percentage = (count / totalReviews) × 100
// VD: 5★ = (65/150) × 100 = 43.3%
```

---

## 3. GET `/reviews/vendor/:id/overview` - Tổng Quan Shop

**Response:**
```json
{
  "data": {
    "totalReviews": 150,
    "averageRating": 4.5,
    "ratingDistribution": { "1": 5, "2": 10, "3": 20, "4": 50, "5": 65 },
    "recentReviews": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Shop uy tín!",
        "user": { "firstName": "Nguyễn", "lastName": "A" },
        "product": { "name": "iPhone 15" }
      }
    ]
  }
}
```

**Logic:** Tổng hợp từ **TẤT CẢ sản phẩm** của shop, 5 reviews mới nhất.

---

## 4. PATCH `/reviews/:id` - Sửa Review

**Request:**
```json
{
  "rating": 4,
  "comment": "Đã sửa"
}
```

**Rules:**
- Trong **1 tháng** sau khi tạo
- Tối đa **3 lần** (`editCount < 3`)
- Mỗi lần sửa: `editCount += 1`

---

## 5. POST `/reviews/:id/reply` - Vendor Reply

**Request:**
```json
{
  "vendorReply": "Cảm ơn bạn!"
}
```

**Logic:** Chỉ vendor của product đó mới reply được.
