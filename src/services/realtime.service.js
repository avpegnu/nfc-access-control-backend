const firebaseService = require("./firebase.service");
const logger = require("../utils/logger");

/**
 * Realtime updates service using Server-Sent Events (SSE)
 */
class RealtimeService {
  constructor() {
    this.clients = new Map(); // Map of client connections
    this.subscriptions = []; // Firebase subscriptions
    this.initialized = false;
  }

  /**
   * Initialize Firebase listeners
   */
  initialize() {
    if (this.initialized) return;

    // Subscribe to door status changes
    const unsubDoorStatus = firebaseService.subscribe(
      "doors/door_main/status",
      (status) => {
        this.broadcast("door_status", {
          doorId: "door_main",
          status,
        });
      }
    );
    this.subscriptions.push(unsubDoorStatus);

    // Subscribe to new access logs
    const unsubAccessLogs = firebaseService.subscribeChild(
      "accessLogs",
      "child_added",
      (log) => {
        this.broadcast("access_log", log);
      }
    );
    this.subscriptions.push(unsubAccessLogs);

    // Subscribe to user changes
    const unsubUsers = firebaseService.subscribe("users", (users) => {
      this.broadcast("user_update", { action: "refresh" });
    });
    this.subscriptions.push(unsubUsers);

    this.initialized = true;
    logger.info("Realtime service initialized");
  }

  /**
   * Add new SSE client connection
   */
  addClient(clientId, res) {
    this.clients.set(clientId, res);
    logger.info(
      `SSE client connected: ${clientId} (total: ${this.clients.size})`
    );

    // Initialize if first client
    if (!this.initialized) {
      this.initialize();
    }
  }

  /**
   * Remove client connection
   */
  removeClient(clientId) {
    this.clients.delete(clientId);
    logger.info(
      `SSE client disconnected: ${clientId} (total: ${this.clients.size})`
    );
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(eventType, data) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

    logger.info(
      `📡 Broadcasting ${eventType} to ${this.clients.size} client(s):`,
      data
    );

    if (this.clients.size === 0) {
      logger.warn("⚠️ No SSE clients connected to receive broadcast!");
    }

    this.clients.forEach((res, clientId) => {
      try {
        res.write(message);
        logger.debug(`✅ Sent to client ${clientId}`);
      } catch (error) {
        logger.error(`❌ Error sending to client ${clientId}:`, error.message);
        this.removeClient(clientId);
      }
    });
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId, eventType, data) {
    const client = this.clients.get(clientId);
    if (client) {
      const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
      client.write(message);
    }
  }

  /**
   * Send heartbeat to all clients
   */
  sendHeartbeat() {
    this.broadcast("heartbeat", { timestamp: Date.now() });
  }

  /**
   * Get connected clients count
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Cleanup - unsubscribe from Firebase
   */
  cleanup() {
    this.subscriptions.forEach((unsub) => unsub());
    this.subscriptions = [];
    this.clients.clear();
    this.initialized = false;
    logger.info("Realtime service cleaned up");
  }
}

// Export singleton instance
module.exports = new RealtimeService();
