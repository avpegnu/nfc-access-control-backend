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

# JWT Configuration (Frontend Auth)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Firebase Web API Key
FIREBASE_WEB_API_KEY=your-firebase-web-api-key

# Firebase Admin SDK Service Account (JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Firebase Database URL
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebasedatabase.app

# Device Secrets for ESP32 Registration
DEVICE_SECRETS=[{"device_id":"reader-lobby-01","secret":"your-device-secret"}]

# Device JWT Settings
DEVICE_JWT_SECRET=your-device-jwt-secret-key
DEVICE_JWT_EXPIRES_IN=365d

# Credential (Card JWT) Settings
CREDENTIAL_EXPIRES_IN=2592000

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=50
```

### Lưu ý quan trọng

**FIREBASE_SERVICE_ACCOUNT**: Có 2 cách cấu hình:

```env
# Cách 1: JSON string (recommended)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Cách 2: Đường dẫn file
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

**DEVICE_SECRETS**: Mỗi ESP32 cần 1 device_id và secret để đăng ký:

```env
DEVICE_SECRETS=[
  {"device_id":"reader-lobby-01","secret":"secret-1"},
  {"device_id":"reader-door-a1","secret":"secret-2"}
]
```

## Bước 4: Cấu hình Firebase Rules

Vào **Realtime Database** > **Rules**:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "cards": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "devices": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "access_logs": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "doors": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

> **Lưu ý**: Backend sử dụng Admin SDK nên bypass rules.

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
curl http://localhost:3001/api/v1/health
```

### Đăng ký device (ESP32)

```bash
curl -X POST http://localhost:3001/api/v1/device/register \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "reader-lobby-01",
    "secret": "esp32-lobby-secret-2024",
    "hardware_type": "esp32-pn532",
    "firmware_version": "1.0.0",
    "door_id": "door-A1"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "device_token": "eyJhbGciOiJIUzI1NiIs...",
    "config": {
      "relay_open_ms": 3000,
      "offline_mode": {
        "enabled": true,
        "cache_ttl_sec": 86400
      }
    }
  }
}
```

### Tạo card từ thẻ trắng

```bash
curl -X POST http://localhost:3001/api/v1/cards \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "reader-lobby-01",
    "card_uid": "04AABBCCDD1122"
  }'
```

### Kiểm tra quyền truy cập

```bash
curl -X POST http://localhost:3001/api/v1/access/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <device_token>" \
  -d '{
    "device_id": "reader-lobby-01",
    "door_id": "door-A1",
    "card_id": "c_8f2c1c3e",
    "card_uid": "04AABBCCDD1122",
    "timestamp": "2025-12-11T02:30:00Z"
  }'
```

## Cấu hình ESP32

ESP32 cần được cấu hình với:

```cpp
// config.h
#define API_URL "http://your-server-ip:3001/api/v1"
#define DEVICE_ID "reader-lobby-01"
#define DEVICE_SECRET "esp32-lobby-secret-2024"
#define DOOR_ID "door-A1"
```

Flow trên ESP32:
1. Khởi động → Gọi `/device/register` → Lưu device_token
2. Định kỳ gọi `/device/config` để lấy public key cho offline mode
3. Khi quẹt thẻ → Gọi `/access/check`
4. Nếu ALLOW → Mở cửa + ghi credential mới lên thẻ

## Troubleshooting

### Lỗi Firebase initialization

- Kiểm tra `FIREBASE_SERVICE_ACCOUNT` đúng format JSON
- Kiểm tra `FIREBASE_DATABASE_URL` đúng URL

### Lỗi Device Registration (401)

- Kiểm tra `device_id` và `secret` trong `DEVICE_SECRETS`
- Secret phải khớp chính xác

### Lỗi JWT verification

- Kiểm tra `JWT_SECRET` và `DEVICE_JWT_SECRET`
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

# View logs
pm2 logs nfc-backend
```

### Environment Production

```env
NODE_ENV=production
JWT_SECRET=very-long-random-string-for-production
DEVICE_JWT_SECRET=another-long-random-string
RATE_LIMIT_MAX_REQUESTS=100
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL với Certbot

```bash
sudo certbot --nginx -d api.your-domain.com
```
