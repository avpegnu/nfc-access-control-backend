const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NFC Access Control API",
      version: "1.4.0",
      description: `API quản lý hệ thống kiểm soát truy cập bằng thẻ NFC - Bài tập IoT`,
      contact: {
        name: "Contact HUST Student",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    tags: [
      { name: "Health", description: "Health check endpoints" },
      { name: "Auth", description: "Authentication endpoints (Frontend)" },
      { name: "Users", description: "User management (Frontend)" },
      { name: "Doors", description: "Door management (Frontend & ESP32)" },
      { name: "Access", description: "Access control & logs (Frontend)" },
      { name: "Realtime", description: "Realtime events via SSE" },
      { name: "Device", description: "Device management (ESP32)" },
      { name: "Cards", description: "NFC Card management" },
      { name: "Access V1", description: "Access control (ESP32)" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for Frontend authentication",
        },
        DeviceToken: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Device JWT token for ESP32 authentication (use Authorization: Bearer header)",
        },
        ApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key for device authentication",
        },
      },
      schemas: {
        // Common schemas
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "ERROR_CODE" },
                message: { type: "string", example: "Error message" },
              },
            },
          },
        },
        // Auth schemas
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "admin@example.com",
            },
            password: { type: "string", minLength: 6, example: "password123" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password", "displayName"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "admin@example.com",
            },
            password: { type: "string", minLength: 6, example: "password123" },
            displayName: { type: "string", example: "Admin User" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                user: {
                  type: "object",
                  properties: {
                    uid: { type: "string" },
                    email: { type: "string" },
                    displayName: { type: "string" },
                  },
                },
                token: { type: "string" },
                expiresIn: { type: "number", example: 86400 },
              },
            },
          },
        },
        // User schemas
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            cardUid: { type: "string" },
            role: { type: "string", enum: ["user", "admin"] },
            isActive: { type: "boolean" },
            createdAt: { type: "number" },
            updatedAt: { type: "number" },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Nguyen Van A" },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            cardUid: { type: "string", example: "ABC123DEF" },
            role: { type: "string", enum: ["user", "admin"], default: "user" },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            cardUid: { type: "string" },
            role: { type: "string", enum: ["user", "admin"] },
          },
        },
        // Door schemas
        Door: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            isOpen: { type: "boolean" },
            isOnline: { type: "boolean" },
            lastActivity: { type: "number" },
          },
        },
        DoorCommand: {
          type: "object",
          required: ["action"],
          properties: {
            action: { type: "string", enum: ["lock", "unlock"] },
          },
        },
        DoorStatus: {
          type: "object",
          required: ["isOpen"],
          properties: {
            isOpen: { type: "boolean" },
            isOnline: { type: "boolean", default: true },
          },
        },
        // Access schemas
        AccessLog: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            userName: { type: "string" },
            cardUid: { type: "string" },
            doorId: { type: "string" },
            action: { type: "string", enum: ["entry", "exit"] },
            result: { type: "string", enum: ["granted", "denied"] },
            reason: { type: "string" },
            timestamp: { type: "number" },
          },
        },
        VerifyAccessRequest: {
          type: "object",
          required: ["cardUid"],
          properties: {
            cardUid: { type: "string", example: "ABC123DEF" },
            doorId: { type: "string", default: "door_main" },
            action: {
              type: "string",
              enum: ["entry", "exit"],
              default: "entry",
            },
          },
        },
        // Device schemas
        DeviceRegisterRequest: {
          type: "object",
          required: ["device_id", "secret", "hardware_type", "door_id"],
          properties: {
            device_id: { type: "string", example: "esp32_001" },
            secret: { type: "string", example: "device_secret_key" },
            hardware_type: { type: "string", example: "ESP32-WROOM-32" },
            firmware_version: { type: "string", example: "1.0.0" },
            door_id: { type: "string", example: "door_main" },
          },
        },
        DeviceHeartbeat: {
          type: "object",
          required: ["device_id", "timestamp"],
          properties: {
            device_id: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            status: {
              type: "object",
              properties: {
                uptime_sec: { type: "integer" },
                rssi: { type: "integer" },
                fw_version: { type: "string" },
              },
            },
          },
        },
        Device: {
          type: "object",
          properties: {
            device_id: { type: "string" },
            door_id: { type: "string" },
            hardware_type: { type: "string" },
            firmware_version: { type: "string" },
            online: { type: "boolean" },
            last_heartbeat_at: { type: "string", format: "date-time" },
            config: {
              type: "object",
              properties: {
                relay_open_ms: { type: "integer", default: 3000 },
                offline_mode: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
        // Card schemas
        Card: {
          type: "object",
          properties: {
            card_id: { type: "string" },
            card_uid: { type: "string" },
            user_id: { type: "string" },
            status: { type: "string", enum: ["active", "revoked"] },
            enroll_mode: { type: "boolean" },
            policy: {
              type: "object",
              properties: {
                access_level: {
                  type: "string",
                  enum: ["guest", "staff", "manager", "admin"],
                },
                valid_until: { type: "string", format: "date-time" },
              },
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CardCreateRequest: {
          type: "object",
          required: ["device_id", "card_uid"],
          properties: {
            device_id: { type: "string", example: "esp32_001" },
            card_uid: { type: "string", example: "ABC123DEF456" },
          },
        },
        CardAssignRequest: {
          type: "object",
          required: ["user_id"],
          properties: {
            user_id: { type: "string" },
            policy: {
              type: "object",
              properties: {
                access_level: {
                  type: "string",
                  enum: ["guest", "staff", "manager", "admin"],
                  default: "staff",
                },
                valid_until: { type: "string", format: "date-time" },
              },
            },
          },
        },
        // Access Check schema (ESP32)
        AccessCheckRequest: {
          type: "object",
          required: ["device_id", "door_id", "timestamp"],
          properties: {
            device_id: { type: "string" },
            door_id: { type: "string" },
            card_id: { type: "string" },
            card_uid: { type: "string" },
            credential: {
              type: "object",
              properties: {
                raw: { type: "string" },
                format: { type: "string", enum: ["jwt", "custom"] },
              },
            },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        AccessCheckResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                decision: { type: "string", enum: ["ALLOW", "DENY"] },
                reason: { type: "string" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/routes/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
