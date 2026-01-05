# Use Case Diagram - Hệ thống Quản lý Kiểm soát Ra Vào NFC

## Biểu đồ Use Case tổng quan

```mermaid
graph TB
    subgraph System["HỆ THỐNG QUẢN LÝ KIỂM SOÁT RA VÀO NFC"]
        UC1[Đăng nhập hệ thống]
        UC2[Quản lý người dùng]
        UC3[Đăng ký thiết bị ESP32]
        UC4[Giám sát trạng thái thiết bị]
        UC5[Đăng ký thẻ NFC<br/>Card Enrollment]
        UC6[Gán quyền truy cập<br/>cho thẻ]
        UC7[Xem lịch sử truy cập]
        UC8[Xem thống kê truy cập]
        UC9[Điều khiển cửa từ xa]
        UC10[Nhận thông báo<br/>realtime SSE]
        UC11[Quẹt thẻ NFC<br/>tại đầu đọc]
        UC12[Xác thực và mở cửa<br/>Online/Offline]
        UC13[Đồng bộ logs offline]
    end
    
    Admin([👤 Administrator])
    User([👤 User/Nhân viên])
    ESP32([🔧 ESP32 Device])
    
    Admin -.-> UC1
    Admin -.-> UC2
    Admin -.-> UC3
    Admin -.-> UC4
    Admin -.-> UC5
    Admin -.-> UC6
    Admin -.-> UC7
    Admin -.-> UC8
    Admin -.-> UC9
    Admin -.-> UC10
    
    User -.-> UC11
    
    ESP32 -.-> UC12
    ESP32 -.-> UC13
    
    UC11 --> UC12
    UC5 -.->|extends| UC6
    
    style System fill:#f0f8ff,stroke:#4682b4,stroke-width:3px
    style Admin fill:#90ee90,stroke:#228b22,stroke-width:2px
    style User fill:#87ceeb,stroke:#4169e1,stroke-width:2px
    style ESP32 fill:#ffa07a,stroke:#ff4500,stroke-width:2px
```

## Chi tiết Use Cases

### 👤 Administrator (Người quản trị)

| Use Case ID | Tên Use Case | Mô tả ngắn |
|-------------|--------------|------------|
| UC1 | Đăng nhập hệ thống | Admin đăng nhập bằng email/password, hệ thống cấp JWT token |
| UC2 | Quản lý người dùng | Thêm, sửa, xóa, xem danh sách người dùng trong hệ thống |
| UC3 | Đăng ký thiết bị ESP32 | Đăng ký thiết bị mới với secret key, cấp Device Token |
| UC4 | Giám sát trạng thái thiết bị | Xem trạng thái online/offline, heartbeat của các ESP32 |
| UC5 | Đăng ký thẻ NFC | Đăng ký thẻ trắng vào hệ thống, tạo card_id |
| UC6 | Gán quyền truy cập cho thẻ | Gán thẻ cho người dùng, thiết lập policy (cửa nào, thời gian) |
| UC7 | Xem lịch sử truy cập | Xem logs truy cập với filter theo user, cửa, thời gian |
| UC8 | Xem thống kê truy cập | Xem biểu đồ thống kê theo ngày/tuần/tháng |
| UC9 | Điều khiển cửa từ xa | Mở/khóa cửa khẩn cấp từ giao diện web |
| UC10 | Nhận thông báo realtime | Nhận thông báo sự kiện truy cập qua SSE |

### 👤 User/Nhân viên (Người dùng)

| Use Case ID | Tên Use Case | Mô tả ngắn |
|-------------|--------------|------------|
| UC11 | Quẹt thẻ NFC tại đầu đọc | Người dùng quẹt thẻ đã đăng ký để vào/ra khu vực |

### 🔧 ESP32 Device (Thiết bị)

| Use Case ID | Tên Use Case | Mô tả ngắn |
|-------------|--------------|------------|
| UC12 | Xác thực và mở cửa | Xác thực credential online (API) hoặc offline (public key) |
| UC13 | Đồng bộ logs offline | Tự động sync logs về server khi online trở lại |

## Luồng xử lý chính

### 🔄 Card Enrollment Flow
```mermaid
sequenceDiagram
    participant User as 👤 User
    participant ESP32 as 🔧 ESP32
    participant Backend as 🖥️ Backend API
    participant Admin as 👤 Admin
    
    User->>ESP32: Quẹt thẻ trắng lần đầu
    ESP32->>Backend: POST /cards {card_uid}
    Backend-->>ESP32: {card_id}
    ESP32->>User: Ghi card_id lên thẻ (NDEF)
    
    Admin->>Backend: Gán quyền: POST /cards/:id/assign
    Backend-->>Admin: Success
    
    User->>ESP32: Quẹt thẻ lần 2
    ESP32->>Backend: POST /access/check {card_id}
    Backend-->>ESP32: {credential (JWT)}
    ESP32->>User: Ghi credential lên thẻ + Mở cửa
```

### 🔐 Access Control Flow
```mermaid
sequenceDiagram
    participant User as 👤 User
    participant ESP32 as 🔧 ESP32
    participant Backend as 🖥️ Backend
    participant Firebase as 🔥 Firebase DB
    participant WebUI as 💻 Web Dashboard
    
    User->>ESP32: Quẹt thẻ đã có credential
    ESP32->>Backend: POST /access/check {credential}
    Backend->>Backend: Verify JWT (Ed25519)
    Backend->>Backend: Check policy & expiration
    Backend->>Firebase: Log access event
    Backend-->>ESP32: {access_granted, new_credential}
    ESP32->>User: Mở cửa + Ghi credential mới
    Firebase-->>WebUI: SSE: New access event
    WebUI->>WebUI: Update UI realtime
```

### 📡 Offline Mode Flow
```mermaid
sequenceDiagram
    participant User as 👤 User
    participant ESP32 as 🔧 ESP32 (Offline)
    participant Storage as 💾 Local Storage
    participant Backend as 🖥️ Backend (When online)
    
    User->>ESP32: Quẹt thẻ (ESP32 offline)
    ESP32->>ESP32: Verify JWT bằng public key
    ESP32->>ESP32: Check expiration & card_uid
    alt Valid credential
        ESP32->>User: Mở cửa
        ESP32->>Storage: Lưu log tạm
    else Invalid
        ESP32->>User: Từ chối truy cập
    end
    
    Note over ESP32,Backend: Khi ESP32 online trở lại
    ESP32->>Backend: POST /access/log-batch {offline_logs}
    Backend-->>ESP32: Sync success
    ESP32->>Storage: Xóa logs đã sync
```

## Quan hệ giữa các Use Cases

- **Include**: UC11 (Quẹt thẻ) → UC12 (Xác thực và mở cửa)
- **Extend**: UC5 (Đăng ký thẻ) ← UC6 (Gán quyền truy cập)
- **Generalization**: UC12 có 2 variants: Online mode và Offline mode

## Actors và vai trò

| Actor | Vai trò | Số lượng Use Cases |
|-------|---------|-------------------|
| Administrator | Quản lý toàn bộ hệ thống | 10 |
| User/Nhân viên | Sử dụng thẻ để truy cập | 1 |
| ESP32 Device | Xác thực và điều khiển cửa | 2 |

---

**Generated for:** NFC Access Control System  
**Version:** 1.0  
**Date:** January 2026
