# NFC Access Control Backend

Backend API server cho hệ thống kiểm soát ra vào bằng thẻ NFC.

## Kiến trúc

```
┌─────────────┐     /api/v1      ┌─────────────────┐
│   ESP32     │ ◄──────────────► │                 │
│  (Reader)   │                  │   Backend API   │
└─────────────┘                  │    (Express)    │
                                 │                 │
┌─────────────┐     /api         │                 │     ┌──────────┐
│  Frontend   │ ◄──────────────► │                 │ ◄──►│ Firebase │
│   (React)   │                  │                 │     │    DB    │
└─────────────┘                  └─────────────────┘     └──────────┘
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Firebase Realtime Database
- **Authentication**:
  - Frontend: JWT (HS256)
  - ESP32: Device Token (JWT)
  - Card Credential: EdDSA (Ed25519)
- **Realtime**: Server-Sent Events (SSE)

## Tính năng

### ESP32 (API v1)
- Device registration & token management
- Card enrollment (blank card → registered card)
- Access check with credential rotation
- Offline mode support (public key verification)
- Batch log sync

### Frontend (Legacy API)
- Admin authentication
- User management (CRUD)
- Door control
- Access logs & statistics
- Realtime updates (SSE)

## API Endpoints

### API v1 (ESP32)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/v1/device/register` | Đăng ký thiết bị | Secret |
| GET | `/api/v1/device/config` | Lấy config + offline keys | Device Token |
| POST | `/api/v1/device/heartbeat` | Gửi heartbeat | Device Token |
| POST | `/api/v1/cards` | Tạo card từ thẻ trắng | - |
| POST | `/api/v1/access/check` | Kiểm tra quyền + xoay credential | Device Token |
| POST | `/api/v1/access/log-batch` | Sync offline logs | Device Token |

### Legacy API (Frontend)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập admin |
| GET | `/api/users` | Danh sách users |
| POST | `/api/users` | Tạo user mới |
| GET | `/api/access/logs` | Lịch sử truy cập |
| GET | `/api/access/stats` | Thống kê truy cập |

## Card Enrollment Flow

```
1. Quẹt thẻ trắng lần đầu:
   ESP32 → POST /cards {card_uid}
   Backend → Tạo card (enroll_mode=true), trả card_id
   ESP32 → Ghi card_id lên thẻ (NDEF)

2. Admin gán user cho card:
   Frontend → POST /cards/:cardId/assign {user_id, policy}

3. Quẹt thẻ lần 2:
   ESP32 → POST /access/check {card_id, card_uid}
   Backend → Verify, cấp credential JWT
   ESP32 → Mở cửa + ghi credential lên thẻ

4. Các lần quẹt tiếp theo:
   ESP32 → POST /access/check {card_id, credential}
   Backend → Verify credential, rotate (cấp JWT mới)
   ESP32 → Mở cửa + ghi credential mới
```

## Offline Mode

ESP32 có thể xác thực offline khi mất mạng:

1. Lấy public key từ `GET /device/config`
2. Verify chữ ký JWT credential bằng Ed25519
3. Check expiration và card_uid
4. Cho phép/từ chối mà không cần backend
5. Sync logs khi online lại

## Authentication

### Frontend (JWT)
```
Authorization: Bearer <jwt_token>
```

### ESP32 (Device Token)
```
Authorization: Bearer <device_token>
```

Device token được cấp qua `POST /device/register` với device secret.

## Cài đặt

Xem file [SETUP.md](./SETUP.md) để biết hướng dẫn chi tiết.

## Quick Start

```bash
# Clone & install
cd nfc-access-control-backend
npm install

# Config
cp .env.example .env
# Edit .env with your Firebase credentials

# Run
npm run dev
```

## Scripts

```bash
npm run dev      # Development với hot reload
npm start        # Production
```

## Cấu trúc thư mục

```
src/
├── config/
│   ├── env.js          # Environment variables
│   ├── firebase.js     # Firebase Admin SDK
│   ├── jwt.js          # JWT utilities
│   └── crypto.js       # EdDSA key management
├── controllers/
│   ├── device.controller.js
│   ├── card.controller.js
│   ├── access.controller.js
│   └── ...
├── middleware/
│   ├── auth.js         # Frontend JWT auth
│   ├── deviceAuth.js   # ESP32 device token auth
│   └── ...
├── routes/
│   ├── v1/             # ESP32 routes
│   │   ├── device.routes.js
│   │   ├── card.routes.js
│   │   └── access.routes.js
│   └── *.routes.js     # Legacy routes
├── services/
│   ├── device.service.js
│   ├── card.service.js
│   ├── credential.service.js
│   ├── access.service.js
│   └── ...
├── utils/
│   ├── validators.js
│   ├── response.js
│   └── logger.js
├── app.js
└── server.js
```

## License

MIT
