# 📚 AICSHOP BACKEND DOCUMENTATION

> **Complete documentation for AICShop E-Commerce Platform Backend**

Welcome to the AICShop Backend documentation! This is a comprehensive guide to understanding, developing, and deploying the backend system.

---

## 📖 Documentation Overview

This documentation suite consists of three main documents:

### 1. **[BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md)** 📊
**Comprehensive Business Logic Documentation**

Deep dive into the system's business logic, architecture, and implementation details.

**Contents:**
- 🎯 System Overview & Features
- 🛠 Technology Stack
- 🏗 Architecture & Module Structure
- 💾 Complete Database Schema
- 🔐 Authentication & Authorization (JWT, RBAC)
- 📦 Core Business Modules
  - Products Management (with Variants)
  - Shopping Cart
  - Orders Management
  - Vendors Management
  - Categories
  - Payments (PayOS)
  - Admin Features
- 🔒 Security & Best Practices
- 🚀 Deployment Guide
- 💡 Code Examples & Workflows

**When to read:** Start here to understand HOW the system works internally.

---

### 2. **[API_REFERENCE.md](./API_REFERENCE.md)** 🔌
**Complete API Endpoints Reference**

Detailed reference for all API endpoints with request/response examples.

**Contents:**
- 🔐 Authentication APIs
  - Register, Login, Logout, Refresh Token
  - Password Reset Flow
  - Profile Management
- 📦 Products APIs (CRUD with variants)
- 📂 Categories APIs
- 🛒 Cart APIs (Add, Update, Remove)
- 📋 Orders APIs (Checkout, Status Update)
- 💳 Payments APIs (PayOS Integration)
- 🏪 Vendors APIs (Create, Approve, Manage)
- 👥 Users APIs
- 🎛 Admin APIs (Dashboard, Analytics, Management)
- ⚠️ Error Codes & Messages

**When to read:** Use this as a quick reference when integrating with the API.

---

### 3. **This Document (README.md)** 🏠
**Quick Start Guide**

Quick reference and getting started guide.

---

## 🚀 Quick Start

### **Prerequisites**

```bash
Node.js 20+
PostgreSQL 14+
npm or yarn
```

### **Installation**

```bash
# 1. Clone repository
git clone <repository-url>
cd aicshop-server

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp env.example .env
# Edit .env with your configuration

# 4. Setup database
# Create database in PostgreSQL
createdb aicshop_db

# 5. Run migrations (TypeORM auto-sync in dev)
npm run start:dev

# 6. (Optional) Seed database
npm run seed
```

### **Run Development Server**

```bash
npm run start:dev
```

Server runs on: `http://localhost:3000/api`

Swagger docs: `http://localhost:3000/api/docs`

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=aicshop_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-256-bits
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-256-bits
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4050

# PayOS (optional, for payment testing)
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key

# Email (optional, for password reset)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

**Important:** Never commit `.env` file to version control!

---

## 📁 Project Structure

```
aicshop-server/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── config/                    # Configuration files
│   │   └── configuration.ts       # App configuration
│   ├── common/                    # Shared utilities
│   │   ├── decorators/           # Custom decorators
│   │   ├── guards/               # Auth guards
│   │   ├── interceptors/         # Response interceptor
│   │   ├── filters/              # Exception filters
│   │   └── enums/                # Enumerations
│   ├── database/                  # Database configuration
│   │   ├── database.module.ts
│   │   └── seeds/                # Database seeders
│   └── modules/                   # Business modules
│       ├── auth/                 # Authentication
│       ├── users/                # User management
│       ├── vendors/              # Vendor management
│       ├── products/             # Product catalog
│       ├── categories/           # Categories
│       ├── cart/                 # Shopping cart
│       ├── orders/               # Order management
│       ├── payments/             # Payment processing
│       └── admin/                # Admin features
├── docs/                          # Documentation
│   ├── README.md                 # This file
│   ├── BUSINESS_LOGIC.md         # Business logic docs
│   └── API_REFERENCE.md          # API reference
├── .env.example                   # Environment template
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 🛠 Available Scripts

```bash
# Development
npm run start:dev       # Start development server with hot-reload
npm run start:debug     # Start with debugging

# Production
npm run build          # Build for production
npm run start:prod     # Start production server

# Database
npm run seed           # Seed database with sample data
npm run seed:clear     # Clear all database data
npm run seed:refresh   # Clear + Seed

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run e2e tests
npm run test:cov       # Test coverage

# Docker
npm run docker:dev     # Run with Docker (development)
npm run docker:prod    # Run with Docker (production)
```

---

## 🏗 Key Architecture Concepts

### **Layered Architecture**

```
Controllers → Services → Repositories → Database
```

- **Controllers:** Handle HTTP requests/responses
- **Services:** Contain business logic
- **Repositories:** Database operations (TypeORM)
- **Database:** PostgreSQL storage

### **Modules**

Each business feature is a separate module with:
- Controller (routing)
- Service (business logic)
- Entities (database models)
- DTOs (data validation)

### **Authentication Flow**

1. User logs in → Validate credentials
2. Generate JWT access token (15 min)
3. Generate refresh token (7 days)
4. Store refresh token in database
5. Client uses access token for requests
6. When access token expires, refresh using refresh token
7. Logout revokes refresh token

### **Authorization (RBAC)**

Three roles with hierarchical permissions:
- **USER:** Shopping & orders
- **VENDOR:** Manage products + USER permissions
- **ADMIN:** Full system access

---

## 📊 Database Schema Highlights

### **Core Entities**

- **User:** Authentication, profile, roles
- **Vendor:** Business information, approval status
- **Product:** Name, price, stock, specs (JSONB)
- **ProductVariant:** SKU, options combinations
- **Category:** Hierarchical categories
- **CartItem:** User's shopping cart
- **Order:** Order information, shipping
- **OrderItem:** Products in order (snapshot)
- **Payment:** Payment transactions

### **Key Relationships**

```
User (1:1) Vendor
Vendor (1:N) Product
Product (1:N) ProductVariant
Product (1:N) ProductOption
User (1:N) CartItem
User (1:N) Order
Order (1:N) OrderItem
```

See [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md#database-schema) for complete schema.

---

## 🔌 API Endpoints Summary

### **Public Endpoints** (No auth required)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
GET    /api/auth/reset-password/verify
POST   /api/auth/reset-password

GET    /api/products
GET    /api/products/:id
GET    /api/products/by-slug/:slug
GET    /api/categories
```

### **Protected Endpoints** (Auth required)

```
# User
GET    /api/auth/profile
POST   /api/auth/logout
GET    /api/cart
POST   /api/cart/add
POST   /api/orders/from-cart
GET    /api/orders

# Vendor
POST   /api/vendors
GET    /api/vendors/my-profile
POST   /api/products
PATCH  /api/products/:id

# Admin
GET    /api/admin/dashboard/stats
GET    /api/admin/orders
PATCH  /api/admin/users/:id/ban
PATCH  /api/vendors/:id/approve
```

See [API_REFERENCE.md](./API_REFERENCE.md) for complete API documentation.

---

## 🔐 Security Best Practices

### **Implemented Security Features**

✅ **Password Hashing:** Bcrypt with 12 rounds  
✅ **JWT Authentication:** Access + Refresh tokens  
✅ **Token Rotation:** Refresh tokens rotated on use  
✅ **Input Validation:** class-validator for all DTOs  
✅ **SQL Injection Prevention:** TypeORM parameterized queries  
✅ **CORS:** Configured for specific origins  
✅ **Role-based Access Control:** Guards for authorization  
✅ **Error Handling:** No sensitive data in error responses  

### **Production Checklist**

- [ ] Change default JWT secrets (256-bit minimum)
- [ ] Enable HTTPS only
- [ ] Configure production CORS origins
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure logging
- [ ] Disable Swagger in production (optional)
- [ ] Set NODE_ENV=production

---

## 🧪 Testing

### **Unit Tests**

```bash
npm run test
```

Test individual services and controllers.

### **E2E Tests**

```bash
npm run test:e2e
```

Test complete API flows.

### **Test Coverage**

```bash
npm run test:cov
```

Generate code coverage report.

---

## 🚀 Deployment

### **Docker Deployment**

```bash
# Build image
docker build -t aicshop-backend .

# Run container
docker-compose up -d

# View logs
docker-compose logs -f
```

### **Manual Deployment**

```bash
# 1. Build
npm run build

# 2. Set environment
export NODE_ENV=production

# 3. Run
npm run start:prod
```

### **Recommended Stack**

- **Hosting:** AWS EC2, DigitalOcean, Railway
- **Database:** AWS RDS, DigitalOcean Managed PostgreSQL
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt
- **Monitoring:** PM2, Sentry
- **Logging:** Winston + CloudWatch

See [BUSINESS_LOGIC.md#deployment-guide](./BUSINESS_LOGIC.md#deployment-guide) for detailed deployment instructions.

---

## 📖 Swagger API Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api/docs
```

Features:
- ✅ Try out endpoints directly in browser
- ✅ View request/response schemas
- ✅ JWT authentication testing
- ✅ Organized by modules

---

## 🐛 Debugging

### **Enable Debug Mode**

```bash
npm run start:debug
```

Then attach your debugger to port 9229.

### **View Logs**

```bash
# Development logs
npm run start:dev

# Production logs (with PM2)
pm2 logs aicshop-backend
```

### **Database Queries**

Enable query logging in `.env`:

```bash
NODE_ENV=development  # Auto-enables logging
```

Or check `src/config/configuration.ts`:
```typescript
logging: process.env.NODE_ENV === 'development'
```

---

## 🤝 Contributing

### **Code Style**

- Use ESLint configuration
- Follow NestJS best practices
- Write meaningful commit messages
- Add JSDoc comments for complex logic

### **Git Workflow**

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/your-feature
```

### **Commit Message Format**

Follow Conventional Commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: refactor code
test: add tests
chore: update dependencies
```

---

## 📞 Support & Resources

### **Documentation**

- **Business Logic:** [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md)
- **API Reference:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Swagger Docs:** http://localhost:3000/api/docs

### **External Resources**

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### **Contact**

- **Developer:** Nhan Bernie
- **Email:** support@aicshop.com
- **Repository:** [GitHub](https://github.com/your-repo)

---

## 📝 License

This project is proprietary and confidential.

Copyright © 2025 AICShop. All rights reserved.

---

## 🎯 Roadmap

### **Current Version:** 1.0.0

### **Planned Features:**

- [ ] Real-time notifications (WebSocket)
- [ ] Advanced search with Elasticsearch
- [ ] Product reviews & ratings
- [ ] Wishlist functionality
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Mobile app API optimizations
- [ ] AI-powered product recommendations

---

## 🙏 Acknowledgments

Built with:
- **NestJS** - Progressive Node.js framework
- **TypeORM** - Excellent ORM for TypeScript
- **PostgreSQL** - Powerful relational database
- **Passport** - Authentication middleware
- **PayOS** - Payment gateway for Vietnam

---

**Happy Coding! 🚀**

---

**Document Version:** 1.0.0  
**Last Updated:** October 20, 2025  
**Maintained by:** AICShop Development Team


