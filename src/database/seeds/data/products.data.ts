export const productsData = [
  {
    name: 'Máy khoan búa Bosch GSB 550',
    slug: 'may-khoan-bua-bosch-gsb-550',
    categorySlug: 'dung-cu-dien',
    vendorBusinessName: 'Công ty TNHH Dụng cụ Việt',
    brand: 'Bosch',
    thumbnail: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    price: 1299000,
    salePrice: 1099000,
    currency: 'VND',
    stockQty: 50,
    stockUnit: 'cái',
    badges: ['sale', 'bestseller'],
    specs: {
      power: { value: 550, unit: 'W' },
      voltage: { value: 220, unit: 'V' },
      weight: { value: 1.8, unit: 'kg' },
      warranty: '24 tháng'
    },
    shortDescription: 'Máy khoan búa chuyên nghiệp với công suất 550W, phù hợp cho công việc khoan tường, bê tông',
    description: '<p>Máy khoan búa Bosch GSB 550 là công cụ lý tưởng cho các công việc khoan, vặn vít và khoan búa. Với thiết kế ergonomic và công suất mạnh mẽ, máy phù hợp cho cả người dùng chuyên nghiệp và nghiệp dư.</p><p><strong>Tính năng nổi bật:</strong></p><ul><li>Công suất 550W mạnh mẽ</li><li>3 chế độ hoạt động: khoan, vặn vít, khoan búa</li><li>Đầu kẹp 13mm chính xác</li><li>Tay cầm chống trượt</li></ul>',
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'
    ],
    options: [
      {
        name: 'chuck_size',
        displayName: 'Kích thước đầu kẹp',
        values: ['10mm', '13mm']
      }
    ],
    variants: [
      {
        sku: 'BOSCH-GSB550-10MM',
        options: { chuck_size: '10mm' },
        price: 1099000,
        stockQty: 30
      },
      {
        sku: 'BOSCH-GSB550-13MM',
        options: { chuck_size: '13mm' },
        price: 1299000,
        stockQty: 20
      }
    ]
  },
  {
    name: 'Bu lông inox 304 M8',
    slug: 'bu-long-inox-304-m8',
    categorySlug: 'oc-vit-bu-long',
    vendorBusinessName: 'Vật Tư Xây Dựng ABC',
    brand: 'Inox Việt',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    price: 5000,
    salePrice: null,
    currency: 'VND',
    stockQty: 10000,
    stockUnit: 'cái',
    badges: ['new'],
    specs: {
      threadPitch: { value: 1.25, unit: 'mm' },
      strengthClass: '8.8',
      coating: 'Không',
      headType: 'Lục giác'
    },
    shortDescription: 'Bu lông inox 304 chống gỉ sét, độ bền cao, phù hợp cho môi trường ẩm ướt',
    description: '<p>Bu lông inox 304 M8 được sản xuất từ thép không gỉ cao cấp, có khả năng chống ăn mòn tuyệt vời trong môi trường khắc nghiệt.</p><p><strong>Ứng dụng:</strong></p><ul><li>Xây dựng công trình ven biển</li><li>Lắp đặt thiết bị ngoài trời</li><li>Công nghiệp thực phẩm</li><li>Tàu thuyền và cảng biển</li></ul>',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800'
    ],
    options: [
      {
        name: 'length',
        displayName: 'Chiều dài',
        values: ['20mm', '30mm', '40mm', '50mm']
      }
    ],
    variants: [
      {
        sku: 'INOX-M8-20',
        options: { length: '20mm' },
        price: 4500,
        stockQty: 3000
      },
      {
        sku: 'INOX-M8-30',
        options: { length: '30mm' },
        price: 5000,
        stockQty: 2500
      },
      {
        sku: 'INOX-M8-40',
        options: { length: '40mm' },
        price: 5500,
        stockQty: 2000
      },
      {
        sku: 'INOX-M8-50',
        options: { length: '50mm' },
        price: 6000,
        stockQty: 2500
      }
    ]
  },
  {
    name: 'Sơn nước nội thất Dulux Easy Clean',
    slug: 'son-nuoc-noi-that-dulux-easy-clean',
    categorySlug: 'son-chat-hoan-thien',
    vendorBusinessName: 'Vật Tư Xây Dựng ABC',
    brand: 'Dulux',
    thumbnail: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400',
    price: 450000,
    salePrice: 399000,
    currency: 'VND',
    stockQty: 200,
    stockUnit: 'thùng',
    badges: ['sale'],
    specs: {
      coverage: { value: 12, unit: 'm²/lít' },
      dryTime: { value: 2, unit: 'giờ' },
      finish: 'Mờ',
      voc: { value: 50, unit: 'g/l' }
    },
    shortDescription: 'Sơn nước nội thất cao cấp, dễ lau chùi, không mùi, thân thiện môi trường',
    description: '<p>Dulux Easy Clean là dòng sơn nước nội thất cao cấp với công nghệ chống bám bẩn độc quyền, giúp tường nhà luôn sạch đẹp.</p><p><strong>Ưu điểm vượt trội:</strong></p><ul><li>Dễ lau chùi, chống bám bẩn</li><li>Không mùi, an toàn sức khỏe</li><li>Độ che phủ cao</li><li>Màu sắc bền đẹp theo thời gian</li></ul>',
    images: [
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800'
    ],
    options: [
      {
        name: 'color',
        displayName: 'Màu sắc',
        values: ['Trắng', 'Kem', 'Xanh nhạt', 'Hồng nhạt']
      },
      {
        name: 'size',
        displayName: 'Dung tích',
        values: ['1L', '5L', '18L']
      }
    ],
    variants: [
      {
        sku: 'DULUX-WHITE-1L',
        options: { color: 'Trắng', size: '1L' },
        price: 120000,
        stockQty: 100
      },
      {
        sku: 'DULUX-WHITE-5L',
        options: { color: 'Trắng', size: '5L' },
        price: 450000,
        stockQty: 50
      },
      {
        sku: 'DULUX-CREAM-5L',
        options: { color: 'Kem', size: '5L' },
        price: 450000,
        stockQty: 30
      }
    ]
  },
  {
    name: 'Mũ bảo hộ lao động 3M H-700',
    slug: 'mu-bao-ho-lao-dong-3m-h700',
    categorySlug: 'thiet-bi-an-toan',
    vendorBusinessName: 'Công ty TNHH Dụng cụ Việt',
    brand: '3M',
    thumbnail: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
    price: 180000,
    salePrice: null,
    currency: 'VND',
    stockQty: 500,
    stockUnit: 'cái',
    badges: ['bestseller'],
    specs: {
      standard: 'ANSI Z89.1',
      protectionLevel: 'Type I, Class E',
      size: 'Điều chỉnh được',
      expiry: '5 năm'
    },
    shortDescription: 'Mũ bảo hộ lao động chất lượng cao, đạt tiêu chuẩn quốc tế, bảo vệ tối ưu',
    description: '<p>Mũ bảo hộ 3M H-700 được thiết kế để bảo vệ đầu khỏi các tác động cơ học và điện. Sản phẩm đạt tiêu chuẩn ANSI Z89.1.</p><p><strong>Tính năng:</strong></p><ul><li>Vỏ ABS chống va đập</li><li>Dây đeo 4 điểm điều chỉnh</li><li>Thông gió tốt</li><li>Trọng lượng nhẹ</li></ul>',
    images: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800'
    ],
    options: [
      {
        name: 'color',
        displayName: 'Màu sắc',
        values: ['Trắng', 'Vàng', 'Xanh', 'Đỏ']
      }
    ],
    variants: [
      {
        sku: '3M-H700-WHITE',
        options: { color: 'Trắng' },
        price: 180000,
        stockQty: 200
      },
      {
        sku: '3M-H700-YELLOW',
        options: { color: 'Vàng' },
        price: 180000,
        stockQty: 150
      },
      {
        sku: '3M-H700-BLUE',
        options: { color: 'Xanh' },
        price: 180000,
        stockQty: 100
      },
      {
        sku: '3M-H700-RED',
        options: { color: 'Đỏ' },
        price: 180000,
        stockQty: 50
      }
    ]
  }
];
