# NFC Access Control Backend

Backend API server cho hệ thống kiểm soát ra vào bằng thẻ NFC.

## Kiến trúc

```
Frontend (React) ←→ Backend API (Express) ←→ Firebase Realtime Database
                                    ↑
                              ESP32 Device
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Realtime Database
- **Authentication**: JWT (Frontend), API Key (ESP32)
- **Realtime**: Server-Sent Events (SSE)

## Tính năng

- Authentication (login/register/logout)
- Quản lý người dùng (CRUD)
- Điều khiển cửa (lock/unlock)
- Xác thực thẻ NFC
- Ghi log truy cập
- Realtime updates via SSE
- Rate limiting
- Request validation

## API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/auth/me` | Thông tin user hiện tại |

### Users
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users` | Danh sách users |
| GET | `/api/users/:id` | Chi tiết user |
| POST | `/api/users` | Tạo user mới |
| PUT | `/api/users/:id` | Cập nhật user |
| DELETE | `/api/users/:id` | Xóa user |

### Doors
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/doors/:doorId/status` | Trạng thái cửa |
| POST | `/api/doors/:doorId/command` | Điều khiển cửa |
| POST | `/api/doors/:doorId/status` | Cập nhật trạng thái (ESP32) |

### Access
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/access/verify` | Xác thực thẻ NFC |
| GET | `/api/access/logs` | Lịch sử truy cập |
| GET | `/api/access/stats` | Thống kê truy cập |

### Realtime (SSE)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/realtime/doors/:doorId` | Stream trạng thái cửa |
| GET | `/api/realtime/access` | Stream log truy cập |

## Authentication

### Frontend (JWT)
```
Authorization: Bearer <jwt_token>
```

### ESP32 Device (API Key)
```
X-API-Key: <device_api_key>
X-Device-ID: <device_id>
```

## Cài đặt

Xem file [SETUP.md](./SETUP.md) để biết hướng dẫn chi tiết.

## Scripts

```bash
# Development
npm run dev

# Production
npm start

# Lint
npm run lint
```

## Cấu trúc thư mục

```
src/
├── config/          # Cấu hình (env, firebase, jwt)
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── services/        # Business logic
├── utils/           # Utilities (validators, logger)
├── app.js          # Express app setup
└── server.js       # Entry point
```

## License

MIT
