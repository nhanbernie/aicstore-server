# Product DTO Documentation 

## 1. StockDto

- `quantity`: Số lượng tồn kho (number)
- `unit`: Đơn vị tính (string)

## 2. SpecValueDto

- `value`: Giá trị thông số (any)
- `unit`: Đơn vị (string, optional)

## 3. ProductOptionValueDto

- `value`: Giá trị lựa chọn (string)

## 4. ProductOptionDto

- `name`: Tên option (string)
- `displayName`: Tên hiển thị (string, optional)
- `values`: Danh sách giá trị (ProductOptionValueDto[])

## 5. ProductVariantDto

- `sku`: Mã SKU (string)
- `options`: Tổ hợp option (Record<string, string>)
- `price`: Giá riêng cho variant (number, optional)
- `stockQty`: Tồn kho variant (number, optional)
- `specs`: Thông số riêng (object, optional)

## 6. CreateProductDto

- Thông tin tạo sản phẩm mới, gồm các trường:
  - `name`, `slug`, `categoryId`, `vendorId`, `brand`, `thumbnail`, `images`, `price`, `salePrice`, `currency`, `stock`, `badges`, `specs`, `options`, `variants`, `shortDescription`, `description`, `datasheetUrl`

## 7. UpdateProductDto

- Kế thừa CreateProductDto, thêm:
  - `isActive`: Trạng thái hoạt động (boolean, optional)

## 8. SearchProductQueryDto

- DTO cho query tìm kiếm sản phẩm:
  - `q`, `categoryId`, `brand`, `vendorId`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit`, `withFacets`

---

**Lưu ý:**

- Các trường có `@IsOptional()` là không bắt buộc.
- Các trường dạng array cần truyền đúng kiểu dữ liệu.
- DTO này dùng cho validate và swagger docs trong API sản phẩm.
