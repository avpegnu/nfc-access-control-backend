# Firebase Setup Guide

## 1. Cập nhật Firebase Rules

Vào **Firebase Console** → **Realtime Database** → **Rules** và paste nội dung từ file `firebase-rules.json`:

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
    },
    "cardIndex": {
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

Click **Publish** để lưu.

## 2. Import Sample Data

### Cách 1: Import qua Firebase Console (Đơn giản)

1. Vào **Firebase Console** → **Realtime Database**
2. Click vào **⋮** (3 chấm) ở góc phải → **Import JSON**
3. Chọn file `firebase-sample-data.json`
4. Click **Import**

**Lưu ý**: Import sẽ GHI ĐÈ toàn bộ data hiện có!

### Cách 2: Import từng collection (An toàn hơn)

Nếu muốn giữ lại data cũ, import từng phần:

1. Mở file `firebase-sample-data.json`
2. Copy từng phần (users, cards, devices, etc.)
3. Trong Firebase Console, click vào node tương ứng
4. Click **⋮** → **Import JSON** và paste

### Cách 3: Dùng Firebase CLI

```bash
# Cài Firebase CLI nếu chưa có
npm install -g firebase-tools

# Login
firebase login

# Import data
firebase database:set / --data "$(cat firebase-sample-data.json)" --project YOUR_PROJECT_ID
```

## 3. Cấu hình Admin User

Sau khi import, bạn cần cập nhật UID của admin:

1. Vào **Firebase Console** → **Authentication** → **Users**
2. Copy UID của admin user
3. Vào **Realtime Database** → **admins**
4. Đổi key `REPLACE_WITH_YOUR_FIREBASE_UID` thành UID thật

## 4. Sample Data Overview

### Users (5 người dùng)
| ID | Tên | Role | Status |
|----|-----|------|--------|
| user_001 | Nguyễn Văn An | user | Active |
| user_002 | Trần Thị Bình | user | Active |
| user_003 | Lê Văn Cường | admin | Active |
| user_004 | Phạm Thị Dung | user | Inactive |
| user_005 | Hoàng Minh Đức | user | Active |

### Cards (5 thẻ)
| ID | UID | Status | User |
|----|-----|--------|------|
| card_001 | 04:A1:B2:... | active | Nguyễn Văn An |
| card_002 | 04:B2:C3:... | active | Trần Thị Bình |
| card_003 | 04:C3:D4:... | pending | (Chưa gán) |
| card_004 | 04:D4:E5:... | pending | (Chưa gán) |
| card_005 | 04:E5:F6:... | revoked | Phạm Thị Dung |

### Devices (3 thiết bị)
| ID | Door | Status |
|----|------|--------|
| ESP32_MAIN_001 | Cửa chính | online |
| ESP32_BACK_001 | Cửa sau | online |
| ESP32_PARKING_001 | Cổng bãi xe | offline |

### Access Logs (6 bản ghi)
- 3 lần access_granted (2 online, 1 offline)
- 3 lần access_denied (card_revoked, door_not_allowed, card_not_found)

## 5. Test Flow

### Test với Frontend:
1. Login vào dashboard
2. Vào **Người dùng** - Xem 5 users
3. Vào **Quản lý thẻ** - Xem 5 cards với các status khác nhau
4. Thử gán card pending cho user
5. Vào **Thiết bị** - Xem 3 devices
6. Vào **Lịch sử** - Xem access logs

### Test với API (Postman/curl):

```bash
# 1. Device Registration (dùng secret từ .env)
curl -X POST http://localhost:3000/api/v1/device/register \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_TEST_001",
    "device_secret": "your-secret-here",
    "door_id": "door_main",
    "firmware_version": "1.0.0"
  }'

# Response sẽ có device_token - lưu lại để dùng

# 2. Card Enrollment (tap thẻ mới)
curl -X POST http://localhost:3000/api/v1/cards \
  -H "Authorization: Bearer <device_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "card_uid": "04:NEW:CARD:UID"
  }'

# 3. Access Check (tap thẻ đã active)
curl -X POST http://localhost:3000/api/v1/access/check \
  -H "Authorization: Bearer <device_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "card_uid": "04:A1:B2:C3:D4:E5:F6",
    "current_credential": null
  }'
```

## 6. Cấu hình Device Secrets

Thêm device secrets vào `.env`:

```env
# Format: device_id:secret,device_id:secret
DEVICE_SECRETS=ESP32_MAIN_001:secret123,ESP32_BACK_001:secret456,ESP32_PARKING_001:secret789
```

Hoặc dùng default secret cho development:

```env
DEFAULT_DEVICE_SECRET=development-secret-key
```
