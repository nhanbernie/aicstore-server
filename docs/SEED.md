# Database Seeding

This directory contains database seeding functionality for the WDP Server project.

## Overview

The seeding system provides sample data for development and testing purposes, including:

- **Users**: Admin, Vendors, and regular Users with different roles
- **Vendors**: Sample vendor companies with business information
- **Categories**: Product categories with spec schemas for validation
- **Products**: Sample products with images, options, variants, and specifications

## Usage

### Seed Database
```bash
npm run seed
```
Populates the database with sample data. Will skip if data already exists.

### Clear Database
```bash
npm run seed:clear
```
Removes all seeded data from the database.

### Refresh Database
```bash
npm run seed:refresh
```
Clears existing data and re-seeds with fresh sample data.

## Sample Data

### Users
- **Admin**: `admin@wdp.com` / `Admin123!`
- **Vendor 1**: `vendor1@example.com` / `Vendor123!`
- **Vendor 2**: `vendor2@example.com` / `Vendor123!`
- **User 1**: `user1@example.com` / `User123!`
- **User 2**: `user2@example.com` / `User123!`

### Categories
- Dụng cụ điện (Power tools)
- Vật liệu xây dựng (Construction materials)
- Ốc vít & Bu lông (Screws & Bolts)
- Sơn & Chất hoàn thiện (Paint & Finishes)
- Thiết bị an toàn (Safety equipment)

### Products
- Máy khoan búa Bosch GSB 550 (with variants)
- Bu lông inox 304 M8 (with length variants)
- Sơn nước nội thất Dulux Easy Clean (with color/size variants)
- Mũ bảo hộ lao động 3M H-700 (with color variants)

## File Structure

```
seeds/
├── data/                    # Sample data files
│   ├── categories.data.ts   # Category definitions with spec schemas
│   ├── users.data.ts        # User accounts
│   ├── vendors.data.ts      # Vendor companies
│   └── products.data.ts     # Products with full details
├── seed.service.ts          # Main seeding logic
├── seed.module.ts           # NestJS module for seeding
├── run-seed.ts             # CLI script runner
└── README.md               # This file
```

## Adding New Data

To add new sample data:

1. **Categories**: Edit `data/categories.data.ts` and add spec schema
2. **Users**: Edit `data/users.data.ts` with email/password/roles
3. **Vendors**: Edit `data/vendors.data.ts` with business info
4. **Products**: Edit `data/products.data.ts` with full product details

## Spec Schemas

Each category defines a `specSchema` that validates product specifications:

```typescript
specSchema: {
  version: 1,
  fields: [
    {
      key: 'power',
      type: 'number',
      unit: 'W',
      label: 'Công suất',
      required: true
    }
  ]
}
```

Products must include specs that match their category's schema.

## Development Notes

- Seeding will skip if users already exist in the database
- Foreign key relationships are properly maintained
- All passwords are hashed using bcryptjs
- SKUs are unique across all product variants
- Images use placeholder URLs from Unsplash
