import smpp from "smpp";
import { createSMSQueue } from "./sms-queue.js";

class SMPPService {
  constructor() {
    this.session = null;
    this.connected = false;
    this.connecting = false;
    this.messageQueue = createSMSQueue();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = Infinity; // Infinite reconnection attempts
    this.reconnectDelay = 5000; // 5 seconds base delay
    this.maxReconnectDelay = 300000; // Max 5 minutes between attempts

    // SMPP Configuration from environment
    this.config = {
      host: process.env.SMPP_HOST || "10.241.60.10",
      port: parseInt(process.env.SMPP_PORT) || 2775,
      system_id: process.env.SMPP_SYSTEM_ID || "Rushdie_Roh",
      password: process.env.SMPP_PASSWORD || "J7PCez",
      system_type: process.env.SMPP_SYSTEM_TYPE || "smpp",
      source_addr: process.env.SMPP_SOURCE_ADDR || "Protocol",
      bind_mode: process.env.SMPP_BIND_MODE || "transmitter", // transmitter, receiver, or transceiver
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
    console.log(`🔧 SMPP: Bind Mode: ${this.config.bind_mode}`);

    try {
      this.session = smpp.connect(
        {
          url: `smpp://${this.config.host}:${this.config.port}`,
          auto_enquire_link_period: 30000, // 30 seconds keep-alive
          debug: true, // Enable debug mode for PDU logging
        },
        () => {
          // Connection established, now bind based on configured mode
          const bindMethod = `bind_${this.config.bind_mode}`;
          
          if (!this.session[bindMethod]) {
            console.error(`❌ SMPP: Invalid bind mode: ${this.config.bind_mode}`);
            this.handleDisconnect();
            return;
          }

          const bindParams = {
            system_id: this.config.system_id,
            password: this.config.password,
            system_type: this.config.system_type,
            addr_ton: 5,  // Alphanumeric for sender "Protocol"
            addr_npi: 0,  // Unknown/Not applicable (working config from 10.12.2025)
          };

          // Log bind request PDU details
          console.log("\n" + "=".repeat(80));
          console.log("📤 SMPP BIND REQUEST PDU");
          console.log("=".repeat(80));
          console.log("⏰ Timestamp:", new Date().toISOString());
          console.log("🔧 Bind Method:", bindMethod);
          console.log("📋 Parameters:");
          console.log("   - system_id:", bindParams.system_id);
          console.log("   - password:", "*".repeat(bindParams.password.length), `(${bindParams.password.length} chars)`);
          console.log("   - system_type:", bindParams.system_type || "(empty)");
          console.log("   - addr_ton:", bindParams.addr_ton);
          console.log("   - addr_npi:", bindParams.addr_npi);
          console.log("=".repeat(80) + "\n");

          this.session[bindMethod](
            bindParams,
            (pdu) => {
              // Log bind response PDU details
              console.log("\n" + "=".repeat(80));
              console.log("📥 SMPP BIND RESPONSE PDU");
              console.log("=".repeat(80));
              console.log("⏰ Timestamp:", new Date().toISOString());
              console.log("📋 Response Details:");
              console.log("   - command:", pdu.command);
              console.log("   - command_id:", pdu.command_id);
              console.log("   - command_status:", pdu.command_status);
              console.log("   - sequence_number:", pdu.sequence_number);
              console.log("   - system_id:", pdu.system_id || "(none)");
              
              if (pdu.command_status !== 0) {
                console.log("\n❌ BIND FAILED!");
                console.log("   Status Code:", pdu.command_status);
                console.log("   Status Meaning:", this.getStatusMessage(pdu.command_status));
              }
              console.log("=".repeat(80) + "\n");

              if (pdu.command_status === 0) {
                console.log(`✅ SMPP: Successfully connected and bound as ${this.config.bind_mode}`);
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
   * Schedule reconnection attempt with exponential backoff (capped)
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    
    // Exponential backoff with cap
    const exponentialDelay = this.reconnectDelay * Math.min(this.reconnectAttempts, 10);
    const delay = Math.min(exponentialDelay, this.maxReconnectDelay);
    
    console.log(`🔄 SMPP: Scheduling reconnect attempt ${this.reconnectAttempts} (∞) in ${delay / 1000}s`);
    
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

      // Prepare SMS PDU with explicit TON/NPI for proper routing
      const pdu = {
        source_addr: this.config.source_addr,
        source_addr_ton: 5,      // TON=5: Alphanumeric (for sender "Protocol")
        source_addr_npi: 0,      // NPI=0: Unknown/Not applicable (working config from 10.12.2025)
        destination_addr: cleanPhone,
        dest_addr_ton: 1,        // TON=1: International number format
        dest_addr_npi: 1,        // NPI=1: ISDN/E.164 numbering plan
        short_message: message,
        data_coding: 0x08,       // UCS2 encoding for Unicode (Russian/Tajik)
        registered_delivery: 1,  // Request delivery receipt
      };

      // Convert message to UTF-16BE (Big Endian) for proper SMS encoding
      // Node.js 'ucs2'/'utf16le' is Little Endian, but SMS requires Big Endian
      const messageBuffer = Buffer.from(message, 'utf16le').swap16();

      // Add UDH for multi-part messages
      if (totalParts > 1) {
        const msgRef = Math.floor(Math.random() * 255);
        pdu.esm_class = 0x40; // UDH indicator
        pdu.message_payload = Buffer.concat([
          Buffer.from([0x05, 0x00, 0x03, msgRef, totalParts, partNum]),
          messageBuffer,
        ]);
        delete pdu.short_message;
      } else {
        pdu.short_message = messageBuffer;
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
   * Get human-readable status message for SMPP error codes
   */
  getStatusMessage(statusCode) {
    const statusMessages = {
      0: "ESME_ROK - No Error",
      1: "ESME_RINVMSGLEN - Message Length is invalid",
      2: "ESME_RINVCMDLEN - Command Length is invalid",
      3: "ESME_RINVCMDID - Invalid Command ID",
      4: "ESME_RINVBNDSTS - Incorrect BIND Status for given command",
      5: "ESME_RALYBND - ESME Already in Bound State",
      6: "ESME_RINVPRTFLG - Invalid Priority Flag",
      7: "ESME_RINVREGDLVFLG - Invalid Registered Delivery Flag",
      8: "ESME_RSYSERR - System Error",
      10: "ESME_RINVSRCADR - Invalid Source Address",
      11: "ESME_RINVDSTADR - Invalid Dest Addr",
      12: "ESME_RINVMSGID - Message ID is invalid",
      13: "ESME_RBINDFAIL - Bind Failed (Invalid System ID or Password)",
      14: "ESME_RINVPASWD - Invalid Password",
      15: "ESME_RINVSYSID - Invalid System ID",
      17: "ESME_RCANCELFAIL - Cancel SM Failed",
      19: "ESME_RREPLACEFAIL - Replace SM Failed",
      20: "ESME_RMSGQFUL - Message Queue Full",
      21: "ESME_RINVSERTYP - Invalid Service Type",
      51: "ESME_RINVNUMDESTS - Invalid number of destinations",
      52: "ESME_RINVDLNAME - Invalid Distribution List name",
      64: "ESME_RINVDESTFLAG - Destination flag is invalid",
      66: "ESME_RINVSUBREP - Invalid submit with replace request",
      67: "ESME_RINVESMCLASS - Invalid esm_class field data",
      68: "ESME_RCNTSUBDL - Cannot Submit to Distribution List",
      69: "ESME_RSUBMITFAIL - submit_sm or submit_multi failed",
      72: "ESME_RINVSRCTON - Invalid Source address TON",
      73: "ESME_RINVSRCNPI - Invalid Source address NPI",
      80: "ESME_RINVDSTTON - Invalid Destination address TON",
      81: "ESME_RINVDSTNPI - Invalid Destination address NPI",
      83: "ESME_RINVSYSTYP - Invalid system_type field",
      84: "ESME_RINVREPFLAG - Invalid replace_if_present flag",
      85: "ESME_RINVNUMMSGS - Invalid number of messages",
      88: "ESME_RTHROTTLED - Throttling error (ESME has exceeded allowed message limits)",
      97: "ESME_RINVSCHED - Invalid Scheduled Delivery Time",
      98: "ESME_RINVEXPIRY - Invalid message validity period (Expiry time)",
      99: "ESME_RINVDFTMSGID - Predefined Message Invalid or Not Found",
      254: "ESME_RDELIVERYFAILURE - Delivery Failure (used for data_sm_resp)",
      255: "ESME_RUNKNOWNERR - Unknown Error",
    };

    return statusMessages[statusCode] || `Unknown Status Code: ${statusCode}`;
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
