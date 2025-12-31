# ESP32 LONG POLLING IMPLEMENTATION

## **Long Polling là gì?**

**Long Polling** = HTTP request "đợi" cho đến khi có data hoặc timeout.

### **So sánh với Normal Polling:**

| | Normal Polling | Long Polling |
|---|---|---|
| **Latency** | 0-3s ngẫu nhiên | ~500ms |
| **Bandwidth** | Nhiều requests không cần thiết | Ít requests hơn |
| **Cách hoạt động** | Request → Response ngay | Request → Đợi → Response khi có data |

---

## **Cách hoạt động:**

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│  ESP32  │                │ Backend │                │ Firebase│
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ GET /command/poll        │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ Check Firebase           │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │ No command               │
     │                          │                          │
     │   [Connection mở         │                          │
     │    đợi 30s hoặc          │                          │
     │    có command]           │                          │
     │                          │                          │
     │         [Admin click unlock]                        │
     │                          │<─────────────────────────┤
     │                          │ Command arrived!         │
     │                          │                          │
     │<─────────────────────────┤                          │
     │ Response: {unlock}       │                          │
     │ (INSTANT - <500ms!)      │                          │
     │                          │                          │
     │ Execute relay            │                          │
     ├──────────┐               │                          │
     │          │ Open door     │                          │
     │<─────────┘               │                          │
     │                          │                          │
     │ POST /command/ack        │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │ GET /command/poll        │                          │
     ├─────────────────────────>│ (Recursive - GỬI LẠI)   │
     │                          │                          │
```

---

## **Backend Endpoint:**

Đã implement sẵn: `GET /api/doors/{doorId}/command/poll`

**Parameters:**
- `doorId`: ID của cửa (e.g., "door_main")
- Header: `Authorization: Bearer <device_token>`

**Response:**

```json
// Trường hợp có command
{
  "success": true,
  "data": {
    "hasCommand": true,
    "command": {
      "action": "unlock",
      "timestamp": 1704067200000,
      "requestedBy": "admin@example.com"
    },
    "waitTime": 2543  // ms đã đợi
  }
}

// Trường hợp timeout (30s không có command)
{
  "success": true,
  "data": {
    "hasCommand": false,
    "command": null,
    "waitTime": 30000
  }
}
```

---

## **ESP32 Code Implementation:**

### **Option 1: Blocking Long Poll (Đơn giản nhất)**

```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Config
const char* API_URL = "http://192.168.1.100:3000/api";
const char* DOOR_ID = "door_main";
String deviceToken = "your_device_token_here";

// ⚡ Long polling function
void checkCommandLongPoll() {
  HTTPClient http;
  
  String url = String(API_URL) + "/doors/" + DOOR_ID + "/command/poll";
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + deviceToken);
  http.setTimeout(35000);  // 35s timeout (lớn hơn backend 30s)
  
  Serial.println("⏳ Long polling started... (waiting for command)");
  unsigned long startTime = millis();
  
  // ⏸️ HTTP request sẽ BLOCK ở đây cho đến khi:
  // - Backend trả về command (instant)
  // - Hoặc timeout 30s
  int httpCode = http.GET();
  
  unsigned long elapsed = millis() - startTime;
  Serial.println("📨 Response received after " + String(elapsed) + "ms");
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      bool hasCommand = doc["data"]["hasCommand"];
      int waitTime = doc["data"]["waitTime"];
      
      if (hasCommand) {
        // ⚡ CÓ COMMAND - Execute ngay
        String action = doc["data"]["command"]["action"];
        Serial.println("🚪 Command: " + action);
        
        executeCommand(action);
        
      } else {
        // ⏱️ TIMEOUT - Không có command
        Serial.println("⏱️ No command (timeout)");
      }
    }
  } else {
    Serial.println("❌ HTTP Error: " + String(httpCode));
  }
  
  http.end();
  
  // ♻️ GỬI LẠI REQUEST NGAY để đợi command tiếp theo
  delay(100);  // Small delay để tránh spam
  checkCommandLongPoll();  // Recursive call
}

void executeCommand(String action) {
  if (action == "unlock") {
    Serial.println("🔓 Unlocking door...");
    digitalWrite(RELAY_PIN, HIGH);
    delay(3000);
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("🔒 Door locked");
    
    // ACK
    acknowledgeCommand(true);
    
  } else if (action == "lock") {
    Serial.println("🔒 Locking door...");
    digitalWrite(RELAY_PIN, LOW);
    
    acknowledgeCommand(true);
  }
}

void acknowledgeCommand(bool success) {
  HTTPClient http;
  String url = String(API_URL) + "/doors/" + DOOR_ID + "/command/ack";
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + deviceToken);
  http.addHeader("Content-Type", "application/json");
  
  String body = "{\"success\": " + String(success ? "true" : "false") + "}";
  int httpCode = http.POST(body);
  
  if (httpCode == 200) {
    Serial.println("✅ Command acknowledged");
  }
  
  http.end();
}

void setup() {
  Serial.begin(115200);
  
  // WiFi setup
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
  
  // Relay setup
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  
  // ⚡ Start long polling
  checkCommandLongPoll();
}

void loop() {
  // Long polling chạy recursive trong checkCommandLongPoll()
  // Loop có thể dùng cho tasks khác
  delay(1000);
}
```

---

### **Option 2: Non-blocking Long Poll (Với FreeRTOS Task)**

```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Task handle
TaskHandle_t longPollTask;

// Long polling task chạy riêng biệt
void longPollTaskFunction(void * parameter) {
  while(true) {
    HTTPClient http;
    
    String url = String(API_URL) + "/doors/" + DOOR_ID + "/command/poll";
    http.begin(url);
    http.addHeader("Authorization", "Bearer " + deviceToken);
    http.setTimeout(35000);
    
    Serial.println("⏳ Long polling...");
    int httpCode = http.GET();
    
    if (httpCode == 200) {
      String payload = http.getString();
      
      DynamicJsonDocument doc(1024);
      deserializeJson(doc, payload);
      
      bool hasCommand = doc["data"]["hasCommand"];
      
      if (hasCommand) {
        String action = doc["data"]["command"]["action"];
        executeCommand(action);
      }
    }
    
    http.end();
    vTaskDelay(100 / portTICK_PERIOD_MS);  // Small delay
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  // ⚡ Tạo task riêng cho long polling
  xTaskCreatePinnedToCore(
    longPollTaskFunction,   // Function
    "LongPoll",             // Name
    10000,                  // Stack size
    NULL,                   // Parameter
    1,                      // Priority
    &longPollTask,          // Handle
    0                       // Core
  );
}

void loop() {
  // ✅ Loop không bị block, có thể làm tasks khác
  checkCardRead();
  updateDisplay();
  delay(100);
}
```

---

## **Testing:**

### **1. Test Backend:**

```bash
# Terminal 1: Start server
cd nfc-access-control-backend
npm run dev

# Terminal 2: Test long polling
curl -X GET "http://localhost:3000/api/doors/door_main/command/poll" \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -w "\nTime: %{time_total}s\n"

# → Sẽ đợi 30s nếu không có command
# → Trả về ngay nếu bạn click unlock trong lúc đợi
```

### **2. Test với Postman:**

1. **Request 1:** GET `/api/doors/door_main/command/poll`
   - Để chạy (sẽ đợi)
   
2. **Request 2:** POST `/api/doors/door_main/command`
   - Body: `{"action": "unlock"}`
   - Click Send
   
3. **Request 1 sẽ trả về NGAY LẬP TỨC!** ⚡

---

## **Monitoring:**

Backend sẽ log:

```
[INFO] Long polling started for door door_main
[INFO] Long polling: Command found for door door_main after 2543ms
```

ESP32 sẽ print:

```
⏳ Long polling started... (waiting for command)
📨 Response received after 2543ms
🚪 Command: unlock
🔓 Unlocking door...
✅ Command acknowledged
⏳ Long polling started... (waiting for command)
```

---

## **Performance:**

| Metric | Normal Polling | Long Polling |
|--------|----------------|--------------|
| **Average latency** | 1.5s | ~500ms |
| **Requests/hour (idle)** | 1800 | 120 |
| **Bandwidth saved** | Baseline | **93%** ⬇️ |
| **ESP32 power** | Same | Same |

---

## **Troubleshooting:**

### **❌ Problem: Connection timeout**

```cpp
// Tăng timeout
http.setTimeout(40000);  // 40s
```

### **❌ Problem: WiFi disconnect trong long poll**

```cpp
// Thêm WiFi keepalive
void loop() {
  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected, reconnecting...");
    WiFi.reconnect();
    delay(5000);
  }
}
```

### **❌ Problem: ESP32 watchdog reset**

```cpp
// Feed watchdog trong long poll
#include "esp_task_wdt.h"

void checkCommandLongPoll() {
  // Feed watchdog trước khi long request
  esp_task_wdt_reset();
  
  // Long poll...
}
```

---

## **Next Steps:**

1. ✅ Deploy code lên ESP32
2. ✅ Test với admin panel
3. ⚡ Enjoy <500ms latency!

Nếu muốn **<100ms** → Migrate sang **MQTT** (xem DOOR_CONTROL_FLOW.md section 4)
