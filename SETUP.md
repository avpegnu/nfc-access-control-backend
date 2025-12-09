# Hướng dẫn cài đặt NFC Access Control Backend

## Yêu cầu

- Node.js >= 18.x
- npm >= 9.x
- Firebase Project với Realtime Database

## Bước 1: Clone và cài đặt dependencies

```bash
cd nfc-access-control-backend
npm install
```

## Bước 2: Cấu hình Firebase

### 2.1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc sử dụng project có sẵn
3. Bật **Realtime Database**
4. Bật **Authentication** với Email/Password provider

### 2.2. Lấy Service Account Key

1. Vào **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Download file JSON

### 2.3. Lấy Web API Key

1. Vào **Project Settings** > **General**
2. Copy **Web API Key**

### 2.4. Lấy Database URL

1. Vào **Realtime Database**
2. Copy URL (dạng: `https://your-project-id-default-rtdb.firebasedatabase.app`)

## Bước 3: Cấu hình Environment

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Firebase Web API Key
FIREBASE_WEB_API_KEY=your-web-api-key

# Firebase Admin SDK Service Account (JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Firebase Database URL
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebasedatabase.app

# Device API Keys for ESP32
DEVICE_API_KEYS=[{"deviceId":"door_main","apiKey":"your-device-api-key","name":"Main Door"}]

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=50
```

### Lưu ý về FIREBASE_SERVICE_ACCOUNT

Có 2 cách cấu hình:

**Cách 1: JSON string (recommended)**
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

**Cách 2: Đường dẫn file**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

## Bước 4: Cấu hình Firebase Rules

Vào **Realtime Database** > **Rules**, set rules:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "doors": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "access_logs": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "admins": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

> **Lưu ý**: Backend sử dụng Admin SDK nên bypass rules. Rules trên chỉ áp dụng cho client-side access.

## Bước 5: Khởi chạy

### Development

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3001`

### Production

```bash
npm start
```

## Bước 6: Test API

### Health check

```bash
curl http://localhost:3001/api/health
```

### Đăng ký user

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456","displayName":"Admin"}'
```

### Đăng nhập

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'
```

## Cấu hình ESP32

ESP32 cần được cấu hình với:

```cpp
#define API_URL "http://your-server-ip:3001/api"
#define API_KEY "esp32-door-main-secret-key-2024"
#define DEVICE_ID "door_main"
```

Xem thêm tại [ESP32 Setup Guide](../esp32/README.md)

## Troubleshooting

### Lỗi Firebase initialization

- Kiểm tra `FIREBASE_SERVICE_ACCOUNT` đúng format JSON
- Kiểm tra `FIREBASE_DATABASE_URL` đúng URL

### Lỗi JWT

- Đảm bảo `JWT_SECRET` được set
- Check token có hết hạn không

### Lỗi CORS

- Thêm origin vào `ALLOWED_ORIGINS`

### Lỗi Rate Limit (429)

- Tăng `RATE_LIMIT_MAX_REQUESTS` trong development

## Deploy lên VPS

### Sử dụng PM2

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start src/server.js --name nfc-backend

# Auto-start on reboot
pm2 startup
pm2 save
```

### Sử dụng Docker

```bash
# Build image
docker build -t nfc-backend .

# Run container
docker run -d -p 3001:3001 --env-file .env nfc-backend
```

### Environment variables cho Production

```env
NODE_ENV=production
JWT_SECRET=very-long-random-string-for-production
RATE_LIMIT_MAX_REQUESTS=100
```
