
## Cách 1: Seed data từ bên ngoài Docker container

### Bước 1: Chạy Docker services
```bash
# Chạy database và API
npm run docker:dev
```

### Bước 2: Seed data từ host machine
```bash
# Trong terminal mới, chạy seed từ host
npm run seed
# hoặc
npm run seed:refresh  # Clear và re-seed
```

## Cách 2: Seed data bên trong Docker container

### Bước 1: Chạy Docker services
```bash
npm run docker:dev
```

### Bước 2: Exec vào container và chạy seed
```bash
# Lấy container ID hoặc name
docker ps

# Exec vào container API
docker exec -it wdp-server-api-dev-1 /bin/sh

# Trong container, chạy seed
npm run seed
# hoặc
npm run seed:refresh
```

## Cách 3: Tự động seed khi khởi động container

### Thêm script vào Dockerfile
Thêm vào `Dockerfile` sau dòng `EXPOSE 3000`:

```dockerfile
# Copy seed script
COPY scripts/docker-seed.sh /usr/src/app/scripts/
RUN chmod +x /usr/src/app/scripts/docker-seed.sh
```

### Tạo script tự động seed
Tạo file `scripts/docker-seed.sh`:

```bash
#!/bin/sh
echo "Waiting for database to be ready..."
sleep 10

echo "Running database seeding..."
npm run seed

echo "Starting application..."
exec "$@"
```

### Cập nhật docker-compose.dev.yml
```yaml
api-dev:
  # ... existing config
  command: ["./scripts/docker-seed.sh", "npm", "run", "start:dev"]
```

## Cách 4: Seed data qua Docker Compose exec

```bash
# Chạy services
npm run docker:dev

# Trong terminal khác, exec command
docker-compose -f docker-compose.dev.yml exec api-dev npm run seed
```

## Kiểm tra kết quả

### Kiểm tra database
```bash
# Connect vào PostgreSQL container
docker-compose -f docker-compose.dev.yml exec postgres psql -U wdp_user -d wdp_db

# Kiểm tra tables
\dt

# Kiểm tra data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM categories;
```

### Kiểm tra qua API
```bash
# Test login với seeded user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@wdp.com", "password": "Admin123!"}'

# Test products API
curl http://localhost:3000/api/products
```

## Troubleshooting

### Lỗi: Database connection refused
```bash
# Kiểm tra database container
docker-compose -f docker-compose.dev.yml logs postgres

# Restart services
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Lỗi: Tables không tồn tại
```bash
# Xóa volumes và rebuild
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### Lỗi: Permission denied
```bash
# Chạy với sudo (Linux/Mac)
sudo docker-compose -f docker-compose.dev.yml exec api-dev npm run seed
```

## Recommended Workflow

1. **Development**: Sử dụng **Cách 1** - seed từ host machine
2. **Testing**: Sử dụng **Cách 4** - docker-compose exec
3. **Production**: Sử dụng **Cách 3** - tự động seed khi deploy

## Sample Data Available

Sau khi seed thành công, bạn sẽ có:
- **5 Users**: 1 admin, 2 vendors, 2 users
- **2 Vendors**: Approved và ready to use
- **5 Categories**: Với spec schemas đầy đủ
- **4 Products**: Với images, options, variants

### Test Accounts
- **Admin**: `admin@wdp.com` / `Admin123!`
- **Vendor**: `vendor1@example.com` / `Vendor123!`
- **User**: `user1@example.com` / `User123!`
