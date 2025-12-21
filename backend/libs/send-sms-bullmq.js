import smpp from "smpp";
import { Worker } from "bullmq";
import { createSMSQueue } from "./sms-queue-bullmq.js";

// Redis configuration for Worker
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

class SMPPService {
  constructor() {
    this.session = null;
    this.connected = false;
    this.connecting = false;
    this.messageQueue = createSMSQueue();
    this.worker = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = Infinity;
    this.reconnectDelay = 5000;
    this.maxReconnectDelay = 300000;

    // SMPP Configuration - Validate required credentials
    if (!process.env.SMPP_PASSWORD) {
      console.error("❌ CRITICAL: SMPP_PASSWORD environment variable is not set!");
      console.error("   SMS functionality will be disabled until configured.");
    }

    this.config = {
      host: process.env.SMPP_HOST || "10.241.60.10",
      port: parseInt(process.env.SMPP_PORT) || 2775,
      system_id: process.env.SMPP_SYSTEM_ID || "Rushdie_Roh",
      password: process.env.SMPP_PASSWORD, // SECURITY: No fallback - must be set in .env
      system_type: process.env.SMPP_SYSTEM_TYPE || "smpp",
      source_addr: process.env.SMPP_SOURCE_ADDR || "Protocol",
      bind_mode: process.env.SMPP_BIND_MODE || "transmitter",
    };

    // Auto-connect
    this.connect();

    // Setup Worker processor
    this.setupWorkerProcessor();
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
          auto_enquire_link_period: 30000,
          debug: true,
        },
        () => {
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
            addr_ton: 5,
            addr_npi: 0,
          };

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

          this.session[bindMethod](bindParams, (pdu) => {
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
          });
        }
      );

      this.session.on("error", (error) => {
        console.error("❌ SMPP: Connection error:", error.message);
        this.handleDisconnect();
      });

      this.session.on("close", () => {
        console.log("🔌 SMPP: Connection closed");
        this.handleDisconnect();
      });

      this.session.on("deliver_sm", (pdu) => {
        this.handleDeliveryReceipt(pdu);
        this.session.send(pdu.response());
      });

    } catch (error) {
      console.error("❌ SMPP: Connection failed:", error.message);
      this.connecting = false;
      this.scheduleReconnect();
    }
  }

  handleDisconnect() {
    this.connected = false;
    this.connecting = false;
    this.session = null;
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const exponentialDelay = this.reconnectDelay * Math.min(this.reconnectAttempts, 10);
    const delay = Math.min(exponentialDelay, this.maxReconnectDelay);
    
    console.log(`🔄 SMPP: Scheduling reconnect attempt ${this.reconnectAttempts} (∞) in ${delay / 1000}s`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send SMS message
   */
  async sendSMS(phoneNumber, message, priority = "normal") {
    console.log("\n" + "=".repeat(80));
    console.log("📤 SMS ОТПРАВКА - НАЧАЛО");
    console.log("=".repeat(80));
    console.log("⏰ Время:", new Date().toISOString());
    console.log("📱 Номер:", phoneNumber);
    console.log("💬 Сообщение:", message.substring(0, 100) + (message.length > 100 ? "..." : ""));
    console.log("🔧 Приоритет:", priority);
    console.log("🔌 Статус соединения:", this.connected ? "✅ Подключено" : "❌ Отключено");
    
    // Wait for SMPP connection if currently connecting (up to 10 seconds)
    if (!this.connected && this.connecting) {
      console.log("⏳ SMPP: Ожидание подключения...");
      let waitTime = 0;
      while (!this.connected && waitTime < 10000) {
        await new Promise(r => setTimeout(r, 500));
        waitTime += 500;
      }
      if (this.connected) {
        console.log(`✅ SMPP: Подключено после ожидания (${waitTime}ms)`);
      } else {
        console.log("⏰ SMPP: Таймаут ожидания подключения");
      }
    }
    
    const validatedPhone = this.validatePhoneNumber(phoneNumber);
    if (!validatedPhone) {
      console.log("❌ Неверный формат номера телефона");
      console.log("=".repeat(80) + "\n");
      throw new Error("Invalid phone number format");
    }
    console.log("✅ Номер валидирован:", validatedPhone);

    const messages = this.splitMessage(message, 70);
    console.log(`📊 Сообщение разделено на ${messages.length} часть(ей)`);
    
    if (!this.connected) {
      console.log("⏸️ SMPP: Соединение не активно, добавляем в очередь...");
      console.log("=".repeat(80) + "\n");
      return this.queueMessage(validatedPhone, message, priority);
    }

    try {
      const results = [];
      
      for (let i = 0; i < messages.length; i++) {
        const part = messages[i];
        console.log(`📤 Отправка части ${i + 1}/${messages.length}...`);
        const result = await this.sendSingleSMS(validatedPhone, part, i + 1, messages.length);
        results.push(result);
        console.log(`✅ Часть ${i + 1} отправлена, Message ID: ${result.messageId}`);
      }

      console.log(`✅ SMPP: Успешно отправлено ${messages.length} SMS часть(ей) на ${validatedPhone}`);
      console.log("=".repeat(80) + "\n");
      
      return {
        success: true,
        messageId: results[0].messageId,
        parts: messages.length,
        results,
      };
    } catch (error) {
      console.error("❌ SMPP: Ошибка отправки SMS:", error.message);
      console.log("📬 Добавляем в очередь как fallback...");
      console.log("=".repeat(80) + "\n");
      await this.queueMessage(validatedPhone, message, priority);
      throw error;
    }
  }

  sendSingleSMS(phoneNumber, message, partNum, totalParts) {
    return new Promise((resolve, reject) => {
      if (!this.session || !this.connected) {
        reject(new Error("SMPP session not connected"));
        return;
      }

      const cleanPhone = phoneNumber.replace(/^\+/, "");

      const pdu = {
        source_addr: this.config.source_addr,
        source_addr_ton: 5,
        source_addr_npi: 0,
        destination_addr: cleanPhone,
        dest_addr_ton: 1,
        dest_addr_npi: 1,
        short_message: message,
        data_coding: 0x08,
        registered_delivery: 1,
      };

      const messageBuffer = Buffer.from(message, 'utf16le').swap16();

      if (totalParts > 1) {
        const msgRef = Math.floor(Math.random() * 255);
        pdu.esm_class = 0x40;
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
   * Queue message with BullMQ
   */
  async queueMessage(phoneNumber, message, priority) {
    console.log(`📬 SMPP: Queuing message for ${phoneNumber} with priority: ${priority}`);
    
    const job = await this.messageQueue.add(
      "send-sms",
      {
        phoneNumber,
        message,
        priority,
        queuedAt: new Date().toISOString(),
      },
      {
        priority: this.getPriorityValue(priority),
        attempts: 3,
        backoff: {
          type: "fixed",
          delay: 30000, // 30 seconds between retries
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
   * Setup Worker processor for BullMQ
   */
  setupWorkerProcessor() {
    console.log("👷 SMPP: Setting up BullMQ Worker...");
    
    this.worker = new Worker(
      "sms-queue",
      async (job) => {
        const { phoneNumber, message, priority } = job.data;
        
        console.log(`🔄 SMPP: Processing queued message for ${phoneNumber} (Job ${job.id})`);
        
        // Wait for connection
        if (!this.connected) {
          let waitTime = 0;
          const maxWait = 60000;
          
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
      },
      {
        connection: redisConfig,
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // per second
        },
      }
    );

    this.worker.on("completed", (job) => {
      console.log(`✅ Worker: Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`❌ Worker: Job ${job?.id} failed:`, err.message);
    });

    this.worker.on("error", (err) => {
      console.error(`❌ Worker: Error:`, err.message);
    });

    console.log("✅ SMPP: BullMQ Worker setup complete");
  }

  validatePhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");
    
    if (!cleaned.startsWith("+992")) {
      if (cleaned.startsWith("992")) {
        cleaned = "+" + cleaned;
      } else if (cleaned.startsWith("9")) {
        cleaned = "+992" + cleaned;
      } else {
        return null;
      }
    }

    const regex = /^\+992\d{9}$/;
    return regex.test(cleaned) ? cleaned : null;
  }

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

  handleDeliveryReceipt(pdu) {
    try {
      console.log("📨 SMPP: Delivery receipt received:", {
        messageId: pdu.message_id,
        status: pdu.stat,
      });
    } catch (error) {
      console.error("❌ SMPP: Error handling delivery receipt:", error.message);
    }
  }

  getPriorityValue(priority) {
    const priorities = {
      high: 1,
      normal: 2,
      low: 3,
    };
    return priorities[priority] || 2;
  }

  getStatusMessage(statusCode) {
    const statusMessages = {
      0: "ESME_ROK - No Error",
      1: "ESME_RINVMSGLEN - Message Length is invalid",
      2: "ESME_RINVCMDLEN - Command Length is invalid",
      3: "ESME_RINVCMDID - Invalid Command ID",
      4: "ESME_RINVBNDSTS - Incorrect BIND Status for given command",
      5: "ESME_RALYBND - ESME Already in Bound State",
      8: "ESME_RSYSERR - System Error",
      13: "ESME_RBINDFAIL - Bind Failed (Invalid System ID or Password)",
      14: "ESME_RINVPASWD - Invalid Password",
      15: "ESME_RINVSYSID - Invalid System ID",
      88: "ESME_RTHROTTLED - Throttling error",
      255: "ESME_RUNKNOWNERR - Unknown Error",
    };

    return statusMessages[statusCode] || `Unknown Status Code: ${statusCode}`;
  }

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

  getStatus() {
    return {
      connected: this.connected,
      connecting: this.connecting,
      reconnectAttempts: this.reconnectAttempts,
      workerActive: this.worker?.isRunning() || false,
      config: {
        host: this.config.host,
        port: this.config.port,
        system_id: this.config.system_id,
        source_addr: this.config.source_addr,
      },
    };
  }

  async disconnect() {
    if (this.session) {
      console.log("👋 SMPP: Disconnecting...");
      this.session.unbind();
      this.session.close();
      this.connected = false;
      this.session = null;
    }
    
    if (this.worker) {
      console.log("👋 SMPP: Closing worker...");
      await this.worker.close();
      this.worker = null;
    }
  }
}

// Singleton instance
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

export const smsQueue = () => {
  const service = getSMPPService();
  return service.messageQueue;
};

export default getSMPPService;
