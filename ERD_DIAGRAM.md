# Entity Relationship Diagram (ERD) - Hệ thống Quản lý Kiểm soát Ra Vào NFC

## Sơ đồ ERD tổng quan

```mermaid
erDiagram
    USER ||--o{ CARD : owns
    USER ||--o{ ACCESS_LOG : performs
    CARD ||--o{ ACCESS_LOG : uses
    CARD ||--|| CREDENTIAL : contains
    DEVICE ||--|| DOOR : controls
    DOOR ||--o{ ACCESS_LOG : accessed_through
    DEVICE ||--o{ ACCESS_LOG : recorded_by
    
    USER {
        string id PK "UUID"
        string email UK "Email (unique)"
        string displayName "Full name"
        string phoneNumber "Phone number"
        enum role "admin, user"
        enum status "active, inactive"
        datetime createdAt
        datetime updatedAt
    }
    
    CARD {
        string card_id PK "c_xxxxxxxx"
        string card_uid UK "Hardware UID (unique)"
        string user_id FK "References USER.id"
        array scope "Array of door_ids"
        enum status "active, inactive, revoked"
        boolean enroll_mode "true during enrollment"
        string enrolled_by_device FK "References DEVICE.device_id"
        boolean offline_enabled
        datetime createdAt
        datetime updatedAt
    }
    
    CREDENTIAL {
        string card_id PK_FK "References CARD.card_id"
        string format "jwt"
        string alg "EdDSA (Ed25519)"
        string raw "Signed JWT token"
        datetime exp "Expiration time"
        datetime issuedAt
    }
    
    DEVICE {
        string device_id PK "d_xxxxxxxx"
        string hardware_type "ESP32, ESP8266"
        string firmware_version "Semver format"
        string door_id FK "References DOOR.door_id"
        enum status "active, inactive, offline, error"
        datetime last_heartbeat
        datetime last_registered_at
        json config "Device configuration"
        datetime createdAt
    }
    
    DOOR {
        string door_id PK "door_main, door_lab"
        string name "Display name"
        string location "Physical location"
        string device_id FK "References DEVICE.device_id"
        enum status "locked, unlocked, error, maintenance"
        datetime lastActivity
        datetime createdAt
    }
    
    ACCESS_LOG {
        string id PK "UUID"
        string user_id FK "References USER.id"
        string card_id FK "References CARD.card_id"
        string door_id FK "References DOOR.door_id"
        string device_id FK "References DEVICE.device_id"
        boolean access_granted "true if allowed"
        string reason "valid, expired, invalid, etc."
        datetime timestamp
        boolean offline_log "true if logged offline"
        json metadata "Additional context"
    }
```

## Chi tiết Entities

### 👤 USER (Người dùng)

| Attribute | Type | Constraints | Mô tả |
|-----------|------|-------------|-------|
| **id** | String | PK, NOT NULL | UUID, auto-generated |
| **email** | String | UNIQUE, NOT NULL | Email address |
| **displayName** | String | NOT NULL | Tên đầy đủ |
| **phoneNumber** | String | NULL | Số điện thoại |
| **role** | Enum | NOT NULL, DEFAULT 'user' | admin \| user |
| **status** | Enum | NOT NULL, DEFAULT 'active' | active \| inactive |
| **createdAt** | DateTime | NOT NULL | Timestamp tạo |
| **updatedAt** | DateTime | NOT NULL | Timestamp cập nhật |

**Business Rules:**
- Email phải unique trong hệ thống
- Role 'admin' có toàn quyền quản trị
- Status 'inactive' sẽ vô hiệu hóa tất cả cards của user
- Xóa user sẽ cascade vô hiệu hóa cards (không xóa cứng)

---

### 💳 CARD (Thẻ NFC)

| Attribute | Type | Constraints | Mô tả |
|-----------|------|-------------|-------|
| **card_id** | String | PK, NOT NULL | c_xxxxxxxx, auto-generated |
| **card_uid** | String | UNIQUE, NOT NULL | Hardware UID từ NFC chip |
| **user_id** | String | FK → USER.id, NULL | NULL khi chưa assign |
| **scope** | Array\<String\> | NOT NULL, DEFAULT [] | Danh sách door_ids được phép |
| **status** | Enum | NOT NULL, DEFAULT 'inactive' | active \| inactive \| revoked |
| **enroll_mode** | Boolean | NOT NULL, DEFAULT true | true trong quá trình đăng ký |
| **enrolled_by_device** | String | FK → DEVICE.device_id | Device đăng ký card |
| **offline_enabled** | Boolean | NOT NULL, DEFAULT false | Cho phép xác thực offline |
| **createdAt** | DateTime | NOT NULL | Timestamp tạo |
| **updatedAt** | DateTime | NOT NULL | Timestamp cập nhật |

**Business Rules:**
- card_uid phải unique (một thẻ vật lý chỉ đăng ký 1 lần)
- enroll_mode=true khi card mới tạo, chưa gán user
- Sau khi assign user, enroll_mode=false, status=active
- scope rỗng nghĩa là không có quyền truy cập nào
- Một user có thể có nhiều cards (backup, different permissions)

---

### 🔐 CREDENTIAL (Thông tin xác thực trên thẻ)

| Attribute | Type | Constraints | Mô tả |
|-----------|------|-------------|-------|
| **card_id** | String | PK, FK → CARD.card_id | Reference to card |
| **format** | String | NOT NULL, DEFAULT 'jwt' | Định dạng credential |
| **alg** | String | NOT NULL, DEFAULT 'EdDSA' | Ed25519 signature |
| **raw** | String | NOT NULL | JWT token đã ký |
| **exp** | DateTime | NOT NULL | Thời gian hết hạn |
| **issuedAt** | DateTime | NOT NULL | Thời gian cấp |

**Business Rules:**
- Credential được embedded trong CARD (1-1 relationship)
- JWT payload chỉ chứa card_id và card_uid (immutable)
- Credential rotation: tạo mới sau mỗi lần quẹt thành công
- Expiration thường là 30 ngày
- Offline mode: ESP32 verify bằng public key

---

### 🔧 DEVICE (Thiết bị ESP32)

| Attribute | Type | Constraints | Mô tả |
|-----------|------|-------------|-------|
| **device_id** | String | PK, NOT NULL | d_xxxxxxxx hoặc định nghĩa trước |
| **hardware_type** | String | NOT NULL | ESP32, ESP8266, ESP32-S3 |
| **firmware_version** | String | NOT NULL | Semver format (1.0.0) |
| **door_id** | String | FK → DOOR.door_id, UNIQUE | Device điều khiển door nào |
| **status** | Enum | NOT NULL, DEFAULT 'inactive' | active \| inactive \| offline \| error |
| **last_heartbeat** | DateTime | NULL | Heartbeat cuối cùng |
| **last_registered_at** | DateTime | NOT NULL | Lần đăng ký gần nhất |
| **config** | JSON | NOT NULL | Cấu hình device |
| **createdAt** | DateTime | NOT NULL | Timestamp tạo |

**config JSON Structure:**
```json
{
  "relay_open_ms": 3000,
  "offline_mode": {
    "enabled": true,
    "cache_ttl_sec": 86400
  }
}
```

**Business Rules:**
- door_id là UNIQUE (một cửa chỉ có một device)
- Heartbeat mỗi 30s, nếu > 2 phút không có → status=offline
- Device phải register với secret key để nhận device token
- Config được push xuống device qua GET /device/config

---

### 🚪 DOOR (Cửa ra vào)

| Attribute | Type | Constraints | Mô tả |
|-----------|------|-------------|-------|
| **door_id** | String | PK, NOT NULL | door_main, door_lab, etc. |
| **name** | String | NOT NULL | Main Entrance, Lab Room |
| **location** | String | NULL | Building A, Floor 1 |
| **device_id** | String | FK → DEVICE.device_id, UNIQUE | Device điều khiển |
| **status** | Enum | NOT NULL, DEFAULT 'locked' | locked \| unlocked \| error \| maintenance |
| **lastActivity** | DateTime | NULL | Hoạt động cuối cùng |
| **createdAt** | DateTime | NOT NULL | Timestamp tạo |

**Business Rules:**
- door_id là predefined (hard-coded trong config)
- device_id là UNIQUE (một cửa chỉ có một device)
- status='error' khi device offline hoặc lỗi hardware
- status='maintenance' khi admin đang bảo trì
- Remote unlock từ web sẽ set status=unlocked tạm thời

---

### 📝 ACCESS_LOG (Lịch sử truy cập)

| Attribute | Type | Constraints | Mô tả |
|-----------|------|-------------|-------|
| **id** | String | PK, NOT NULL | UUID auto-generated |
| **user_id** | String | FK → USER.id, NULL | NULL nếu card chưa assign |
| **card_id** | String | FK → CARD.card_id, NOT NULL | Card được sử dụng |
| **door_id** | String | FK → DOOR.door_id, NOT NULL | Cửa được truy cập |
| **device_id** | String | FK → DEVICE.device_id, NOT NULL | Device ghi log |
| **access_granted** | Boolean | NOT NULL | true nếu cho phép |
| **reason** | String | NOT NULL | valid, expired, invalid_uid, etc. |
| **timestamp** | DateTime | NOT NULL | Thời gian sự kiện |
| **offline_log** | Boolean | NOT NULL, DEFAULT false | true nếu log offline |
| **metadata** | JSON | NULL | Thông tin bổ sung |

**metadata JSON Structure:**
```json
{
  "credential_age_sec": 1234567,
  "rotation_performed": true,
  "verification_mode": "online",
  "rssi": -45
}
```

**Business Rules:**
- user_id có thể NULL nếu card chưa assign user
- offline_log=true cho logs được sync từ ESP32 sau khi offline
- reason codes:
  - 'valid': Access granted
  - 'expired': Credential hết hạn
  - 'invalid_uid': card_uid không khớp
  - 'no_permission': User không có quyền với door này
  - 'inactive_user': User bị vô hiệu hóa
  - 'invalid_signature': Credential signature không hợp lệ
- Log không bao giờ bị xóa (audit trail)

---

## Relationships (Quan hệ giữa các Entities)

### 1️⃣ USER → CARD (One-to-Many)

**Cardinality:** 1:N  
**Type:** Identifying  
**Description:** Một user có thể sở hữu nhiều cards, một card chỉ thuộc về một user.

```
USER (1) ----< (N) CARD
     id          user_id (FK)
```

**Cascade Rules:**
- DELETE USER → SET CARD.user_id = NULL, status = 'revoked'
- UPDATE USER.status = 'inactive' → Tất cả cards bị vô hiệu hóa

---

### 2️⃣ CARD → CREDENTIAL (One-to-One)

**Cardinality:** 1:1  
**Type:** Composition  
**Description:** Mỗi card có một credential duy nhất (embedded).

```
CARD (1) ---- (1) CREDENTIAL
   card_id      card_id (PK, FK)
```

**Cascade Rules:**
- DELETE CARD → DELETE CREDENTIAL (cascade)
- Credential được rotate sau mỗi access thành công

---

### 3️⃣ DEVICE ↔ DOOR (One-to-One Bidirectional)

**Cardinality:** 1:1  
**Type:** Association  
**Description:** Một device điều khiển một door, một door có một device.

```
DEVICE (1) ---- (1) DOOR
   door_id (FK)    door_id
   device_id       device_id (FK)
```

**Cascade Rules:**
- DELETE DEVICE → SET DOOR.device_id = NULL, status = 'error'
- DELETE DOOR → SET DEVICE.door_id = NULL, status = 'inactive'

---

### 4️⃣ USER → ACCESS_LOG (One-to-Many)

**Cardinality:** 1:N  
**Type:** Non-identifying  
**Description:** Một user thực hiện nhiều access logs.

```
USER (1) ----< (N) ACCESS_LOG
     id          user_id (FK)
```

**Cascade Rules:**
- DELETE USER → SET ACCESS_LOG.user_id = NULL (keep log for audit)

---

### 5️⃣ CARD → ACCESS_LOG (One-to-Many)

**Cardinality:** 1:N  
**Type:** Non-identifying  
**Description:** Một card được sử dụng trong nhiều access logs.

```
CARD (1) ----< (N) ACCESS_LOG
   card_id      card_id (FK)
```

**Cascade Rules:**
- DELETE CARD → SET ACCESS_LOG.card_id = NULL (keep log)

---

### 6️⃣ DOOR → ACCESS_LOG (One-to-Many)

**Cardinality:** 1:N  
**Type:** Non-identifying  
**Description:** Một door có nhiều access logs.

```
DOOR (1) ----< (N) ACCESS_LOG
   door_id      door_id (FK)
```

**Cascade Rules:**
- DELETE DOOR → CASCADE DELETE ACCESS_LOG (optional, hoặc giữ lại)

---

### 7️⃣ DEVICE → ACCESS_LOG (One-to-Many)

**Cardinality:** 1:N  
**Type:** Non-identifying  
**Description:** Một device ghi nhiều access logs.

```
DEVICE (1) ----< (N) ACCESS_LOG
   device_id    device_id (FK)
```

**Cascade Rules:**
- DELETE DEVICE → SET ACCESS_LOG.device_id = NULL

---

## Cardinality Summary

| Relationship | Type | Cardinality | Mandatory |
|--------------|------|-------------|-----------|
| USER → CARD | 1:N | Optional:Mandatory | User phải tồn tại khi assign card |
| CARD → CREDENTIAL | 1:1 | Mandatory:Mandatory | Card phải có credential sau assign |
| DEVICE ↔ DOOR | 1:1 | Mandatory:Mandatory | Device và Door phải liên kết |
| USER → ACCESS_LOG | 1:N | Optional:Mandatory | Access log phải có card |
| CARD → ACCESS_LOG | 1:N | Mandatory:Mandatory | - |
| DOOR → ACCESS_LOG | 1:N | Mandatory:Mandatory | - |
| DEVICE → ACCESS_LOG | 1:N | Mandatory:Mandatory | - |

---

## Indexes và Performance

### Primary Keys
- USER.id (UUID) - Clustered index
- CARD.card_id - Clustered index
- DEVICE.device_id - Clustered index
- DOOR.door_id - Clustered index
- ACCESS_LOG.id - Clustered index

### Foreign Keys
- CARD.user_id → USER.id
- CARD.enrolled_by_device → DEVICE.device_id
- DEVICE.door_id → DOOR.door_id
- DOOR.device_id → DEVICE.device_id
- ACCESS_LOG.user_id → USER.id
- ACCESS_LOG.card_id → CARD.card_id
- ACCESS_LOG.door_id → DOOR.door_id
- ACCESS_LOG.device_id → DEVICE.device_id

### Unique Indexes
- USER.email (unique)
- CARD.card_uid (unique)
- DEVICE.door_id (unique)
- DOOR.device_id (unique)

### Composite Indexes (Recommended)
```sql
-- Query: Get access logs by user and date range
INDEX idx_access_log_user_timestamp ON ACCESS_LOG (user_id, timestamp DESC)

-- Query: Get access logs by door and date range
INDEX idx_access_log_door_timestamp ON ACCESS_LOG (door_id, timestamp DESC)

-- Query: Find cards by user
INDEX idx_card_user_status ON CARD (user_id, status)

-- Query: Find active devices
INDEX idx_device_status ON DEVICE (status)

-- Query: Access log statistics
INDEX idx_access_log_granted_timestamp ON ACCESS_LOG (access_granted, timestamp)
```

---

## Normalization

**Mức độ chuẩn hóa:** 3NF (Third Normal Form)

### 1NF (First Normal Form)
✅ Tất cả attributes đều atomic  
✅ Không có repeating groups  
✅ Mỗi table có primary key

### 2NF (Second Normal Form)
✅ Đạt 1NF  
✅ Không có partial dependency (non-key attributes depend on full PK)

### 3NF (Third Normal Form)
✅ Đạt 2NF  
✅ Không có transitive dependency

**Lưu ý:**
- CARD.scope là Array (denormalization cho performance)
- Có thể tách thành table CARD_SCOPE(card_id, door_id) nếu cần strict 3NF
- DEVICE.config là JSON (denormalization cho flexibility)

---

## Data Integrity Constraints

### Referential Integrity
- Foreign keys phải reference đến existing records
- Cascade delete/update rules được định nghĩa rõ ràng

### Domain Constraints
- Enums: role (admin|user), status (active|inactive|...)
- Date validation: createdAt <= updatedAt
- String format: email phải valid format

### Business Logic Constraints
```sql
-- Card chỉ active khi đã assign user và không trong enroll_mode
CHECK (status = 'active' IMPLIES (user_id IS NOT NULL AND enroll_mode = false))

-- Device phải có door_id khi status = 'active'
CHECK (status = 'active' IMPLIES door_id IS NOT NULL)

-- Access log: nếu access_granted = false thì phải có reason
CHECK (access_granted = false IMPLIES reason IS NOT NULL)

-- Credential expiration phải > issuedAt
CHECK (exp > issuedAt)
```

---

## Firebase Realtime Database Structure

```
nfc-access-control/
├── users/
│   └── {userId}/
│       ├── id
│       ├── email
│       ├── displayName
│       ├── phoneNumber
│       ├── role
│       ├── status
│       ├── createdAt
│       └── updatedAt
├── cards/
│   └── {cardId}/
│       ├── card_id
│       ├── card_uid
│       ├── user_id
│       ├── scope/
│       │   ├── 0: "door_main"
│       │   └── 1: "door_lab"
│       ├── status
│       ├── enroll_mode
│       ├── enrolled_by_device
│       ├── offline_enabled
│       ├── credential/
│       │   ├── format
│       │   ├── alg
│       │   ├── raw
│       │   └── exp
│       ├── createdAt
│       └── updatedAt
├── devices/
│   └── {deviceId}/
│       ├── device_id
│       ├── hardware_type
│       ├── firmware_version
│       ├── door_id
│       ├── status
│       ├── last_heartbeat
│       ├── last_registered_at
│       ├── config/
│       │   ├── relay_open_ms
│       │   └── offline_mode/
│       │       ├── enabled
│       │       └── cache_ttl_sec
│       └── createdAt
├── doors/
│   └── {doorId}/
│       ├── door_id
│       ├── name
│       ├── location
│       ├── device_id
│       ├── status
│       ├── lastActivity
│       └── createdAt
└── access_logs/
    └── {logId}/
        ├── id
        ├── user_id
        ├── card_id
        ├── door_id
        ├── device_id
        ├── access_granted
        ├── reason
        ├── timestamp
        ├── offline_log
        └── metadata/
            ├── credential_age_sec
            ├── rotation_performed
            ├── verification_mode
            └── rssi
```

---

**Generated for:** NFC Access Control System  
**Version:** 1.0  
**Date:** January 2026  
**Database:** Firebase Realtime Database (NoSQL)
