import smpp from "smpp";
import { createSMSQueue } from "./sms-queue.js";

class SMPPService {
  constructor() {
    this.session = null;
    this.connected = false;
    this.connecting = false;
    this.messageQueue = createSMSQueue();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds

    // SMPP Configuration from environment
    this.config = {
      host: process.env.SMPP_HOST || "10.241.60.10",
      port: parseInt(process.env.SMPP_PORT) || 2775,
      system_id: process.env.SMPP_SYSTEM_ID || "Rushdie_Roh",
      password: process.env.SMPP_PASSWORD || "J7PCez",
      system_type: process.env.SMPP_SYSTEM_TYPE || "smpp",
      source_addr: process.env.SMPP_SOURCE_ADDR || "Protocol",
    };

    // Auto-connect on initialization
    this.connect();

    // Setup queue processor
    this.setupQueueProcessor();
  }

  /**
   * Connect to SMPP server
   */
  connect() {
    if (this.connected || this.connecting) {
      console.log("⚠️ SMPP: Already connected or connecting");
      return;
    }

    this.connecting = true;
    console.log("🔌 SMPP: Connecting to Megafon SMPP server...");
    console.log(`📡 SMPP: Host: ${this.config.host}:${this.config.port}`);
    console.log(`👤 SMPP: System ID: ${this.config.system_id}`);

    try {
      this.session = smpp.connect(
        {
          url: `smpp://${this.config.host}:${this.config.port}`,
          auto_enquire_link_period: 30000, // 30 seconds keep-alive
        },
        () => {
          // Connection established, now bind as transmitter
          this.session.bind_transmitter(
            {
              system_id: this.config.system_id,
              password: this.config.password,
              system_type: this.config.system_type,
            },
            (pdu) => {
              if (pdu.command_status === 0) {
                console.log("✅ SMPP: Successfully connected and bound to Megafon");
                this.connected = true;
                this.connecting = false;
                this.reconnectAttempts = 0;
              } else {
                console.error("❌ SMPP: Bind failed with status:", pdu.command_status);
                this.handleDisconnect();
              }
            }
          );
        }
      );

      // Event handlers
      this.session.on("error", (error) => {
        console.error("❌ SMPP: Connection error:", error.message);
        this.handleDisconnect();
      });

      this.session.on("close", () => {
        console.log("🔌 SMPP: Connection closed");
        this.handleDisconnect();
      });

      this.session.on("deliver_sm", (pdu) => {
        // Handle delivery receipts
        this.handleDeliveryReceipt(pdu);
        this.session.send(pdu.response());
      });

    } catch (error) {
      console.error("❌ SMPP: Connection failed:", error.message);
      this.connecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Handle disconnection and schedule reconnect
   */
  handleDisconnect() {
    this.connected = false;
    this.connecting = false;
    this.session = null;
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ SMPP: Max reconnection attempts reached. Manual intervention required.");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 SMPP: Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay / 1000}s`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send SMS message
   * @param {string} phoneNumber - Recipient phone number (international format)
   * @param {string} message - SMS message text
   * @param {string} priority - Message priority (high, normal, low)
   * @returns {Promise<object>} - Send result
   */
  async sendSMS(phoneNumber, message, priority = "normal") {
    // Validate phone number
    const validatedPhone = this.validatePhoneNumber(phoneNumber);
    if (!validatedPhone) {
      throw new Error("Invalid phone number format");
    }

    // Split message if too long (UCS2 encoding: 70 chars limit)
    const messages = this.splitMessage(message, 70);
    
    if (!this.connected) {
      console.log("⏸️ SMPP: Not connected, queuing message...");
      // Queue the message for later delivery
      return this.queueMessage(validatedPhone, message, priority);
    }

    try {
      const results = [];
      
      for (let i = 0; i < messages.length; i++) {
        const part = messages[i];
        const result = await this.sendSingleSMS(validatedPhone, part, i + 1, messages.length);
        results.push(result);
      }

      console.log(`✅ SMPP: Successfully sent ${messages.length} SMS part(s) to ${validatedPhone}`);
      
      return {
        success: true,
        messageId: results[0].messageId,
        parts: messages.length,
        results,
      };
    } catch (error) {
      console.error("❌ SMPP: Failed to send SMS:", error.message);
      
      // Queue the message for retry
      await this.queueMessage(validatedPhone, message, priority);
      
      throw error;
    }
  }

  /**
   * Send a single SMS PDU
   */
  sendSingleSMS(phoneNumber, message, partNum, totalParts) {
    return new Promise((resolve, reject) => {
      if (!this.session || !this.connected) {
        reject(new Error("SMPP session not connected"));
        return;
      }

      // Remove leading + from phone number
      const cleanPhone = phoneNumber.replace(/^\+/, "");

      // Prepare SMS PDU
      const pdu = {
        source_addr: this.config.source_addr,
        destination_addr: cleanPhone,
        short_message: message,
        data_coding: 0x08, // UCS2 encoding for Unicode (Russian/Tajik)
        registered_delivery: 1, // Request delivery receipt
      };

      // Add UDH for multi-part messages
      if (totalParts > 1) {
        const msgRef = Math.floor(Math.random() * 255);
        pdu.esm_class = 0x40; // UDH indicator
        pdu.message_payload = Buffer.concat([
          Buffer.from([0x05, 0x00, 0x03, msgRef, totalParts, partNum]),
          Buffer.from(message, "ucs2"),
        ]);
        delete pdu.short_message;
      } else {
        pdu.short_message = Buffer.from(message, "ucs2");
      }

      this.session.submit_sm(pdu, (pdu) => {
        if (pdu.command_status === 0) {
          resolve({
            success: true,
            messageId: pdu.message_id,
            partNum,
            totalParts,
          });
        } else {
          reject(new Error(`SMPP submit failed with status: ${pdu.command_status}`));
        }
      });
    });
  }

  /**
   * Queue message for later delivery
   */
  async queueMessage(phoneNumber, message, priority) {
    console.log(`📬 SMPP: Queuing message for ${phoneNumber} with priority: ${priority}`);
    
    const job = await this.messageQueue.add(
      "send-sms",
      {
        phoneNumber,
        message,
        priority,
        queuedAt: new Date(),
      },
      {
        priority: this.getPriorityValue(priority),
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );

    return {
      success: true,
      queued: true,
      jobId: job.id,
      message: "Message queued for delivery",
    };
  }

  /**
   * Setup queue processor
   */
  setupQueueProcessor() {
    this.messageQueue.process("send-sms", async (job) => {
      const { phoneNumber, message, priority } = job.data;
      
      console.log(`🔄 SMPP: Processing queued message for ${phoneNumber}`);
      
      // Wait for connection if not connected
      if (!this.connected) {
        let waitTime = 0;
        const maxWait = 60000; // 60 seconds
        
        while (!this.connected && waitTime < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          waitTime += 1000;
        }
        
        if (!this.connected) {
          throw new Error("SMPP not connected after waiting");
        }
      }

      // Send the message
      return await this.sendSMS(phoneNumber, message, priority);
    });

    this.messageQueue.on("completed", (job, result) => {
      console.log(`✅ Queue: Job ${job.id} completed successfully`);
    });

    this.messageQueue.on("failed", (job, err) => {
      console.error(`❌ Queue: Job ${job.id} failed:`, err.message);
    });
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");
    
    // Must start with +992 (Tajikistan)
    if (!cleaned.startsWith("+992")) {
      if (cleaned.startsWith("992")) {
        cleaned = "+" + cleaned;
      } else if (cleaned.startsWith("9")) {
        cleaned = "+992" + cleaned;
      } else {
        return null;
      }
    }

    // Should be +992 followed by 9 digits
    const regex = /^\+992\d{9}$/;
    return regex.test(cleaned) ? cleaned : null;
  }

  /**
   * Split message into parts based on character limit
   */
  splitMessage(message, maxLength) {
    if (message.length <= maxLength) {
      return [message];
    }

    const parts = [];
    let currentPart = "";

    for (const char of message) {
      if (currentPart.length >= maxLength) {
        parts.push(currentPart);
        currentPart = char;
      } else {
        currentPart += char;
      }
    }

    if (currentPart) {
      parts.push(currentPart);
    }

    return parts;
  }

  /**
   * Handle delivery receipt
   */
  handleDeliveryReceipt(pdu) {
    try {
      console.log("📨 SMPP: Delivery receipt received:", {
        messageId: pdu.message_id,
        status: pdu.stat,
      });

      // TODO: Update SMS log in database with delivery status
      // This will be implemented when we create the SMS log model
    } catch (error) {
      console.error("❌ SMPP: Error handling delivery receipt:", error.message);
    }
  }

  /**
   * Convert priority string to numeric value
   */
  getPriorityValue(priority) {
    const priorities = {
      high: 1,
      normal: 2,
      low: 3,
    };
    return priorities[priority] || 2;
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS(phoneNumbers, message, priority = "normal") {
    const results = [];
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.sendSMS(phoneNumber, message, priority);
        results.push({ phoneNumber, ...result });
      } catch (error) {
        results.push({
          phoneNumber,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      connecting: this.connecting,
      reconnectAttempts: this.reconnectAttempts,
      config: {
        host: this.config.host,
        port: this.config.port,
        system_id: this.config.system_id,
        source_addr: this.config.source_addr,
      },
    };
  }

  /**
   * Disconnect from SMPP server
   */
  disconnect() {
    if (this.session) {
      console.log("👋 SMPP: Disconnecting...");
      this.session.unbind();
      this.session.close();
      this.connected = false;
      this.session = null;
    }
  }
}

// Create singleton instance
let smppService = null;

export const getSMPPService = () => {
  if (!smppService) {
    smppService = new SMPPService();
  }
  return smppService;
};

export const sendSMS = async (phoneNumber, message, priority = "normal") => {
  const service = getSMPPService();
  return await service.sendSMS(phoneNumber, message, priority);
};

export const sendBulkSMS = async (phoneNumbers, message, priority = "normal") => {
  const service = getSMPPService();
  return await service.sendBulkSMS(phoneNumbers, message, priority);
};

export default getSMPPService;
