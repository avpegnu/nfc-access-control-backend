# Luồng Tương Tác Chi Tiết: Thiết Bị (ESP32) - Backend V1

Tài liệu này mô tả chi tiết kỹ thuật, bao gồm định dạng dữ liệu (payload), xử lý lỗi, và biểu đồ tuần tự (sequence flow) cho các tương tác giữa Firmware ESP32 và Backend Node.js.

## Mục Lục
1. [Cơ Chế Xác Thực & Bảo Mật](#1-cơ-chế-xác-thực--bảo-mật)
2. [Chi Tiết Luồng Đăng Ký (Registration)](#2-chi-tiết-luồng-đăng-ký-registration)
3. [Luồng Kiểm Tra Thẻ (Access Check - Critical Path)](#3-luồng-kiểm-tra-thẻ-access-check---critical-path)
4. [Cơ Chế Điều Khiển Từ Xa (Long Polling)](#4-cơ-chế-điều-khiển-từ-xa-long-polling)
5. [Đồng Bộ Dữ Liệu & Heartbeat](#5-đồng-bộ-dữ-liệu--heartbeat)
6. [Xử Lý Lỗi & Retry](#6-xử-lý-lỗi--retry)

---

## 1. Cơ Chế Xác Thực & Bảo Mật

*   **Transport Layer:** Tất cả request **BẮT BUỘC** phải đi qua **HTTPS** (trong môi trường Production) hoặc HTTP (Dev) để đảm bảo mã hóa đường truyền.
*   **Authentication:** Sử dụng **JWT (JSON Web Token)**.
    *   **Header Key:** `x-device-token` (Khác với `Authorization: Bearer` của User để dễ phân biệt logic).
    *   **Token Payload:** Chứa `deviceId`, `deviceRole`, `iat`, `exp`.
    *   **Token Expiry:** Token thiết bị thường có thời hạn dài (ví dụ: 1 năm) hoặc không hết hạn tùy policy, nhưng có thể bị thu hồi (revoke) nếu thiết bị bị mất.

---

## 2. Chi Tiết Luồng Đăng Ký (Registration)

**Mô tả:** Thiết bị (Firmware) khi xuất xưởng chưa có Token. Nó chỉ có `DEVICE_ID` và `DEVICE_SECRET` được Hardcode hoặc lưu trong NVS (Non-Volatile Storage).

**Quy trình chi tiết:**
1.  **Boot Up:** ESP32 khởi động, kiểm tra xem trong SPIFFS/EEPROM đã có file `token.txt` chưa.
2.  **Check:**
    *   Nếu **CÓ**: Bỏ qua bước đăng ký, chuyển sang Verify Token (gọi Heartbeat).
    *   Nếu **KHÔNG**: Bắt đầu gọi API Register.

**API Request:**
*   **Method:** `POST /api/v1/device/register`
*   **Headers:** `Content-Type: application/json`

**Payload Request:**
```json
{
  "device_id": "READER_LOBBY_01",    // Bắt buộc, String
  "secret": "s3cr3t_k3y_h4rdc0d3d"   // Bắt buộc, String
}
```

**Logic Server:**
1.  Tìm trong DB/Config xem có cặp `device_id` và `secret` này không.
2.  Nếu tìm thấy: Tạo JWT mới.
3.  Cập nhật trạng thái thiết bị thành `REGISTERED`.

**Payload Response (Success - 200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5c...", // JWT Token
    "device": {
      "id": "READER_LOBBY_01",
      "name": "Đầu đọc sảnh chính",
      "location": "Tầng 1"
    }
  }
}
```

**Xử lý tại ESP32:**
1.  Nhận 200 OK -> Giải mã JSON lấy `data.token`.
2.  Lưu `data.token` vào file hệ thống (ví dụ: `/spiffs/token.txt`).
3.  **Quan trọng:** Sau khi lưu, Soft Reset hoặc chuyển sang trạng thái hoạt động chính, sử dụng Token này cho mọi request sau.

---

## 3. Luồng Kiểm Tra Thẻ (Access Check - Critical Path)

**Yêu cầu độ trễ (Latency):** < 500ms để trải nghiệm người dùng tốt nhất.

**Sequence Flow:**
User -> (Tap Card) -> ESP32 -> (HTTP POST) -> Server API -> (DB Query) -> Server API -> (Response) -> ESP32 -> (Relay/Beep)

**API Request:**
*   **Endpoint:** `/api/v1/access/check`
*   **Header:** `x-device-token: <SAVED_TOKEN>`

**Payload Request:**
```json
{
  "cardUid": "04:1A:2B:3C",  // UID thẻ dạng Hex String, phân tách bởi dấu ":" hoặc liền
  "doorId": "door_01"        // ID của cửa mà đầu đọc này đang quản lý
}
```

**Logic Xử Lý Server (Backend):**
1.  **Validation:** `cardUid` có đúng format không? `doorId` có tồn tại không?
2.  **Check Card:** Tìm `cardUid` trong bảng `Cards`.
    *   Nếu không tìm thấy -> Trả về `allowed: false`.
    *   Nếu tìm thấy nhưng `isActive: false` -> Trả về `allowed: false`.
3.  **Check Permission:** Tìm User sở hữu thẻ. Kiểm tra xem User này có quyền (Role/Group) mở `doorId` vào thời điểm này không (Time schedule).
4.  **Logging:** Ghi record vào bảng `AccessLogs` bất kể thành công hay thất bại.

**Payload Response:**
*   **Trường hợp CẤP PHÉP (Success):**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "user": {
      "name": "Nguyễn Văn A", // Để hiển thị lên màn hình LCD (nếu có)
      "role": "admin"
    }
  }
}
```
*   **Trường hợp TỪ CHỐI (Denied):**
```json
{
  "success": true, // Request thành công, nhưng kết quả nghiệp vụ là từ chối
  "data": {
    "allowed": false,
    "reason": "CARD_LOCKED" // Hoặc "ACCESS_DENIED", "UNKNOWN_CARD"
  }
}
```

**Hành động ESP32:**
*   `allowed: true` =>
    1.  Relay: HIGH (trong X giây cấu hình).
    2.  Buzzer: Beep ngắn (100ms).
    3.  LED: Xanh lá.
*   `allowed: false` =>
    1.  Relay: Giữ nguyên (LOW).
    2.  Buzzer: Beep dài gấp 3 (Error tone).
    3.  LED: Đỏ nhấp nháy.

---

## 4. Cơ Chế Điều Khiển Từ Xa (Long Polling)

Do ESP32 không có địa chỉ IP công khai (Public IP) và nằm sau NAT, Server không thể chủ động gọi API của ESP32. Giải pháp tối ưu là **Long Polling**.

**Nguyên lý:**
*   ESP32 gửi 1 request GET lên Server và nói: "Có lệnh gì mới không? Nếu chưa có, hãy giữ kết nối này đừng trả lời vội".
*   Server giữ kết nối đó trong **30 giây** (Timeout).
*   Nếu trong 30s đó có Admin bấm nút mở cửa -> Server trả lời ngay lập tức.
*   Nếu hết 30s không có gì -> Server trả về EmptyResponse -> ESP32 lập tức gửi request mới.

**Flow Chi Tiết:**

1.  **ESP32 Loop:**
    *   Gọi `GET /api/v1/doors/{id}/command/poll`
    *   Set client timeout (tại ESP32) là **35s** (lớn hơn Server timeout một chút).

2.  **Server side (Door Controller):**
    *   Check hàng đợi lệnh (Command Queue) cho `doorId` này.
    *   **Case A (Có lệnh):** Pop lệnh ra khỏi hàng đợi -> Trả về JSON ngay.
    *   **Case B (Hàng đợi rỗng):**
        *   Tạo một `EventEmitter` hoặc `Promise`.
        *   Set Timeout 30s.
        *   Khi Timeout chạy: Trả về 200 OK với `hasCommand: false`.

3.  **Trigger từ Admin (Web App):**
    *   Admin bấm "Unlock".
    *   API `POST /api/v1/doors/{id}/command` được gọi.
    *   Controller lưu lệnh, đồng thời emit sự kiện (hoặc resolve Promise đang treo ở bước 2).
    *   Request Long Polling của ESP32 (đang treo) được trả về ngay kết quả.

**Response cấu trúc:**
```json
{
  "success": true,
  "data": {
    "hasCommand": true,
    "command": {
      "id": "cmd_123456",
      "action": "unlock",    // hoặc lock, restart, update_fw
      "params": {            // Các tham số phụ
         "duration": 5000    // Mở trong 5s
      }
    }
  }
}
```

4.  **Acknowledge (Quan Trọng):**
    *   ESP32 nhận lệnh -> Thực thi Hardware -> Gửi xác nhận `POST /api/v1/doors/{id}/command/ack`.
    *   Nếu Server không nhận được ACK sau một khoảng thời gian, Server có thể coi như lệnh thất bại và báo lỗi cho Admin.

---

## 5. Đồng Bộ Dữ Liệu & Heartbeat

### 5.1 Offline Mode Sync
*   Khi mất kết nối Wifi/Internet, ESP32 **KHÔNG ĐƯỢC** chặn người dùng (nếu có hỗ trợ cache local) hoặc ít nhất phải lưu log những lần chạm thẻ thất bại do lỗi mạng.
*   Lưu vào bộ nhớ đệm (Circular Buffer).
*   Khi có mạng: Gửi `POST /api/v1/access/log-batch`.
*   Server trả lời 200 OK -> ESP32 xóa Buffer. Nếu trả lỗi -> Giữ Buffer, thử lại sau.

### 5.2 Heartbeat (Keep-Alive)
*   Mục đích: Giám sát online/offline trên Dashboard Admin.
*   Payload mở rộng:
    ```json
    {
      "status": "online",
      "uptime": 3600,       // Giây
      "wifiSignal": -50,    // RSSI (dBm), báo hiệu sóng khỏe/yếu
      "freeHeap": 15000,    // Byte
      "version": "1.0.2"    // Firmware version
    }
    ```
*   Nếu Server không nhận được Heartbeat trong 3 x Chu kỳ (ví dụ 3 x 60s = 3 phút) -> Đánh dấu thiết bị là **Offline**.

---

## 6. Xử Lý Lỗi & Retry

Bảng mã xử lý lỗi phía ESP32:

| HTTP Status | Nguyên Nhân | Hành Động Của ESP32 |
| :--- | :--- | :--- |
| **200 OK** | Thành công | Xử lý data bình thường. |
| **401 Unauthorized** | Token hết hạn / Sai Secret | **Nguy hiểm.** Xóa Token cũ, thử chạy lại quy trình Đăng Ký (Register). Nếu Register vẫn lỗi -> Báo đèn lỗi hệ thống. |
| **403 Forbidden** | Bị Admin Block | Dừng hoạt động, nháy đèn đỏ chờ can thiệp. |
| **404 Not Found** | Sai URL API | Kiểm tra lại cấu hình Firmware. |
| **500 Internal Error** | Server sập / Bug | **Retry:** Thử lại sau 5s, 10s, 30s (Backoff exponential). Không spam request liên tục. |
| **Connection Timeout** | Mất mạng | Chuyển sang chế độ Offline, lưu log vào buffer. Thử reconnect Wifi. |

---

## Tóm Tắt Các Biến Cấu Hình Cần Thống Nhất
Để code Firmware và Backend khớp nhau, cần thống nhất các hằng số:
*   `SERVER_URL`: `https://api.domain.com` (hoặc IP LAN).
*   `POLL_TIMEOUT`: 30000 (ms).
*   `HEARTBEAT_INTERVAL`: 60000 (ms).
*   `RELAY_OPEN_TIME`: 5000 (ms) - Mặc định, có thể override từ config.
