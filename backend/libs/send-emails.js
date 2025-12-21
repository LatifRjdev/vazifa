import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import fs from "fs";
import EmailLog from "../models/email-logs.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SMTP transporter
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 25,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Connection timeout
    connectionTimeout: 60000,
    // Socket timeout
    socketTimeout: 60000,
    // Pool configuration for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  };

  // Add TLS configuration for better compatibility
  if (!config.secure) {
    config.tls = {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
    };
  }

  return nodemailer.createTransport(config);
};

let transporter = createTransporter();

// Verify SMTP connection on startup
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP server connection verified successfully");
    return true;
  } catch (error) {
    console.error("❌ SMTP server connection failed:", error.message);
    
    // Try with port 465 and SSL if 587 fails
    if (process.env.SMTP_PORT === '587') {
      console.log("🔄 Retrying with port 465 and SSL...");
      try {
        const fallbackConfig = {
          host: process.env.SMTP_HOST,
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          connectionTimeout: 60000,
          socketTimeout: 60000,
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
        };
        
        transporter = nodemailer.createTransport(fallbackConfig);
        await transporter.verify();
        console.log("✅ SMTP server connection verified with port 465");
        return true;
      } catch (fallbackError) {
        console.error("❌ SMTP fallback connection also failed:", fallbackError.message);
        return false;
      }
    }
    return false;
  }
};

// Initialize connection verification (non-blocking)
verifyConnection().catch(error => {
  console.warn("⚠️ SMTP connection verification failed during startup, but continuing...");
  console.warn("Email functionality may be limited until SMTP is properly configured.");
});

export const sendEmail = async (
  to,
  subject,
  name,
  message,
  buttonText,
  buttonLink,
  options = {} // { type, recipientId, relatedEntity }
) => {
  let emailLog = null;

  try {
    // Read and process HTML template
    const filePath = join(__dirname, "../template/email-template.html");
    let html = fs.readFileSync(filePath, "utf8");

    html = html
      .replace("{{name}}", name)
      .replace("{{message}}", message)
      .replace("{{buttonText}}", buttonText)
      .replace("{{buttonLink}}", buttonLink)
      .replace("{{year}}", new Date().getFullYear());

    // Create email log entry
    try {
      emailLog = await EmailLog.logEmail({
        recipient: options.recipientId,
        email: to,
        subject: subject,
        body: `${message}\n\nClick here: ${buttonLink}`,
        htmlBody: html,
        type: options.type || "general",
        status: "queued",
        relatedEntity: options.relatedEntity,
        metadata: { name, buttonText },
      });
    } catch (logError) {
      console.warn("⚠️ Failed to create email log:", logError.message);
    }

    // Email configuration
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: html,
      // Add text version for better compatibility
      text: `${message}\n\nClick here: ${buttonLink}`,
    };

    // Update log status to sending
    if (emailLog) {
      try {
        emailLog.status = "sending";
        await emailLog.save();
      } catch (e) { /* ignore */ }
    }

    // Send email with retry logic
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${to}`);
        console.log(`📧 Message ID: ${info.messageId}`);

        // Update log with success
        if (emailLog) {
          try {
            await emailLog.updateStatus("sent", {
              messageId: info.messageId,
              smtpResponse: info.response,
            });
          } catch (e) { /* ignore */ }
        }

        return true;
      } catch (error) {
        lastError = error;
        console.error(`❌ Email send attempt ${attempt} failed:`, error.message);

        // Update attempt count
        if (emailLog) {
          try {
            emailLog.attempts = attempt;
            await emailLog.save();
          } catch (e) { /* ignore */ }
        }

        if (attempt < maxRetries) {
          console.log(`🔄 Retrying in ${attempt * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));

          // Recreate transporter on connection errors
          if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            transporter = createTransporter();
          }
        }
      }
    }

    // All retries failed - update log with failure
    if (emailLog) {
      try {
        await emailLog.updateStatus("failed", {
          errorMessage: lastError.message,
        });
      } catch (e) { /* ignore */ }
    }

    console.error(`❌ Failed to send email to ${to} after ${maxRetries} attempts:`, lastError.message);
    return false;

  } catch (error) {
    console.error("❌ Error in sendEmail function:", error);

    // Update log with failure
    if (emailLog) {
      try {
        await emailLog.updateStatus("failed", {
          errorMessage: error.message,
        });
      } catch (e) { /* ignore */ }
    }

    return false;
  }
};

// Export transporter for testing purposes
export { transporter };
