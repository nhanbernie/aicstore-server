# WDP Server - Run Guide

This guide provides comprehensive instructions for running the WDP Server in both local and Docker environments.

## 📋 Prerequisites

### For Local Development
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL**: v16.x or higher
- **Git**: Latest version

### For Docker Development
- **Docker**: v24.x or higher
- **Docker Compose**: v2.x or higher

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone and setup
git clone <repository-url>
cd wdp-server

# Copy environment variables
cp env.example .env

# Edit .env with your values
nano .env  # or your preferred editor

# Run with Docker
npm run docker:up
```

### Option 2: Local Development
```bash
# Clone and setup
git clone <repository-url>
cd wdp-server

# Install dependencies
npm install

# Setup database (PostgreSQL must be running)
# Create database: wdp_server

# Copy and configure environment
cp env.example .env
nano .env  # Edit with your database credentials

# Run the application
npm run start:dev
```

## 🔧 Environment Configuration

### 1. Copy Environment Template
```bash
cp env.example .env
```

### 2. Required Environment Variables

**Database Configuration:**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=wdp_server
```

**JWT Configuration (CRITICAL - Change in Production!):**
```env
JWT_SECRET=your-super-secret-jwt-key-min-256-bits
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-256-bits
```

### 3. Generate Secure JWT Secrets
```bash
# Generate secure random secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🐳 Docker Setup

### Development Environment
```bash
# Start development stack (with hot reload)
npm run docker:dev

# Stop development stack
docker-compose -f docker-compose.dev.yml down
```

**Services Available:**
- **API**: http://localhost:3000
- **PostgreSQL**: localhost:5433
- **pgAdmin**: http://localhost:8080 (admin@wdp.local / admin123)

### Production Environment
```bash
# Start production stack
npm run docker:prod

# Stop production stack
npm run docker:down
```

**Services Available:**
- **API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### Docker Commands Reference
```bash
# Build only
npm run docker:build

# View logs
docker-compose logs -f api
docker-compose logs -f postgres

# Execute commands in containers
docker-compose exec api sh
docker-compose exec postgres psql -U postgres -d wdp_server
```

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Start PostgreSQL (if not running)
# Windows: net start postgresql-x64-16
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE wdp_server;"
```

### 3. Environment Configuration
```bash
# Copy template
cp env.example .env

# Edit with your local database credentials
nano .env
```

### 4. Run Application
```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 🔍 Development Tools

### Available Scripts
```bash
# Development
npm run start:dev          # Hot reload development
npm run start:debug        # Debug mode with inspector

# Building
npm run build              # Build for production
npm run start:prod         # Run built application

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Docker
npm run docker:build       # Build Docker image
npm run docker:up          # Run production stack
npm run docker:down        # Stop containers
npm run docker:dev         # Run development stack
```

## 🏥 Health Checks & Monitoring

### Application Health
```bash
# Check if API is running
curl http://localhost:3000/health

# Check authentication endpoint
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Database Health
```bash
# Check PostgreSQL connection
docker-compose exec postgres pg_isready -U postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d wdp_server
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3000
netstat -tulpn | grep :3000  # Linux/macOS
netstat -ano | findstr :3000 # Windows

# Kill process using port
kill -9 $(lsof -ti:3000)     # Linux/macOS
```

#### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up postgres
```

#### Permission Issues (Linux/macOS)
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER .
```

#### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

### Debug Mode
```bash
# Run in debug mode
npm run start:debug

# Connect debugger to: chrome://inspect (Node.js)
# Debug port: 9229
```

### Logs
```bash
# View application logs
docker-compose logs -f api

# View database logs  
docker-compose logs -f postgres

# View all logs
docker-compose logs -f
```

## 🔐 Authentication API Usage

### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com", 
    "password": "securepassword123"
  }'
```

### Access Protected Route
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Development Workflow

1. **Start Development Environment**
   ```bash
   npm run docker:dev  # or npm run start:dev for local
   ```

2. **Make Changes**
   - Edit source files in `src/`
   - Hot reload will automatically restart the server

3. **Test Changes**
   ```bash
   npm run test
   npm run lint
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run docker:prod
   ```

## 🛡️ Security Notes

- **Never commit `.env` files** - they contain secrets!
- **Change JWT secrets** in production environments
- **Use strong database passwords**
- **Enable HTTPS** in production
- **Regular dependency updates**: `npm audit && npm update`

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review application logs
3. Check [UPGRADE_NOTES.md](./UPGRADE_NOTES.md) for breaking changes
4. Open an issue with:
   - Your environment details
   - Error logs
   - Steps to reproduce

---
**Happy Coding! 🚀**
