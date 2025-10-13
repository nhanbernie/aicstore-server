export const categoriesData = [
  {
    name: 'Dụng cụ điện',
    slug: 'dung-cu-dien',
    thumbnail:
      'https://tooljapan.net/wp-content/uploads/2021/05/IMG20200904173451.jpg',
    specSchema: {
      version: 1,
      fields: [
        {
          key: 'power',
          type: 'number',
          unit: 'W',
          label: 'Công suất',
          required: true,
        },
        {
          key: 'voltage',
          type: 'number',
          unit: 'V',
          label: 'Điện áp',
          required: true,
        },
        {
          key: 'weight',
          type: 'number',
          unit: 'kg',
          label: 'Trọng lượng',
          required: false,
        },
        {
          key: 'warranty',
          type: 'string',
          label: 'Bảo hành',
          required: false,
        },
      ],
    },
  },
  {
    name: 'Vật liệu xây dựng',
    slug: 'vat-lieu-xay-dung',
    thumbnail:
      'https://vatlieuxaydung.org.vn/thumbnail/544_348/Upload/48/Nam_2025/Thang_7/Ngay_3/thi%20truong%20vlxd.jpg',
    specSchema: {
      version: 1,
      fields: [
        {
          key: 'material',
          type: 'string',
          label: 'Chất liệu',
          required: true,
        },
        {
          key: 'size',
          type: 'string',
          label: 'Kích thước',
          required: true,
        },
        {
          key: 'strength',
          type: 'string',
          label: 'Độ bền',
          required: false,
        },
        {
          key: 'waterproof',
          type: 'boolean',
          label: 'Chống thấm',
          required: false,
        },
      ],
    },
  },
  {
    name: 'Ốc vít & Bu lông',
    slug: 'oc-vit-bu-long',
    specSchema: {
      version: 1,
      fields: [
        {
          key: 'threadPitch',
          type: 'number',
          unit: 'mm',
          label: 'Bước ren',
          required: true,
        },
        {
          key: 'strengthClass',
          type: 'string',
          label: 'Cấp độ bền',
          required: true,
        },
        {
          key: 'coating',
          type: 'string',
          label: 'Lớp phủ',
          required: false,
        },
        {
          key: 'headType',
          type: 'string',
          label: 'Loại đầu',
          required: false,
        },
      ],
    },
  },
  {
    name: 'Sơn & Chất hoàn thiện',
    slug: 'son-chat-hoan-thien',
    thumbnail: 'https://cungquyhoach.vn/Upload/son-trang-tri.jpg',
    specSchema: {
      version: 1,
      fields: [
        {
          key: 'coverage',
          type: 'number',
          unit: 'm²/lít',
          label: 'Độ phủ',
          required: true,
        },
        {
          key: 'dryTime',
          type: 'number',
          unit: 'giờ',
          label: 'Thời gian khô',
          required: true,
        },
        {
          key: 'finish',
          type: 'string',
          label: 'Loại hoàn thiện',
          required: true,
        },
        {
          key: 'voc',
          type: 'number',
          unit: 'g/l',
          label: 'Hàm lượng VOC',
          required: false,
        },
      ],
    },
  },
  {
    name: 'Thiết bị an toàn',
    slug: 'thiet-bi-an-toan',
    thumbnail:
      'https://baohovietnam.com/wp-content/uploads/2014/03/iPro-back.jpg',
    specSchema: {
      version: 1,
      fields: [
        {
          key: 'standard',
          type: 'string',
          label: 'Tiêu chuẩn',
          required: true,
        },
        {
          key: 'protectionLevel',
          type: 'string',
          label: 'Mức độ bảo vệ',
          required: true,
        },
        {
          key: 'size',
          type: 'string',
          label: 'Kích cỡ',
          required: false,
        },
        {
          key: 'expiry',
          type: 'string',
          label: 'Hạn sử dụng',
          required: false,
        },
      ],
    },
  },
];
