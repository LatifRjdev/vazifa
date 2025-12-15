import User from "../models/users.js";
import Notification from "../models/notifications.js";
import { sendEmail } from "./send-emails.js";
import { sendSMS } from "./send-sms-bullmq.js";
import SMSLog from "../models/sms-logs.js";

/**
 * Send notification to user via database, email, and SMS
 * @param {Object} params - Notification parameters
 * @param {String} params.recipientId - User ID to receive notification
 * @param {String} params.type - Notification type
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} params.relatedData - Related data (taskId, projectId, etc.)
 * @param {Object} params.emailData - Email-specific data (subject, html)
 * @param {String} params.smsMessage - Custom SMS message (if different from notification message)
 * @param {Boolean} params.sendEmail - Whether to send email (default: true)
 * @param {Boolean} params.sendSMS - Whether to send SMS (default: true)
 */
export async function sendNotification({
  recipientId,
  type,
  title,
  message,
  relatedData = {},
  emailData = null,
  smsMessage = null,
  sendEmail: shouldSendEmail = true,
  sendSMS: shouldSendSMS = true,
}) {
  try {
    // Get recipient user
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      console.error(`❌ Notification: Recipient not found: ${recipientId}`);
      return { success: false, error: "Recipient not found" };
    }

    // Create in-app notification
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedData,
    });

    console.log(`✅ Notification created for ${recipient.name} (${type})`);

    const results = {
      notification: true,
      email: false,
      sms: false,
    };

    // Send Email if enabled
    if (shouldSendEmail && recipient.settings.emailNotifications && recipient.email) {
      try {
        const emailSubject = emailData?.subject || title;
        const emailBody = emailData?.html || message;

        await sendEmail(recipient.email, emailSubject, emailBody);
        results.email = true;
        console.log(`✅ Email sent to ${recipient.email}`);
      } catch (emailError) {
        console.error(`❌ Email failed for ${recipient.email}:`, emailError.message);
      }
    }

    // Send SMS if enabled and user has phone number
    if (shouldSendSMS && recipient.canReceiveSMS()) {
      // Check if this notification type is enabled for SMS
      const smsNotificationType = mapNotificationTypeToSMS(type);
      
      if (recipient.isSMSNotificationEnabled(smsNotificationType)) {
        try {
          const smsText = smsMessage || formatSMSMessage(type, message, relatedData);
          
          const smsResult = await sendSMS(recipient.phoneNumber, smsText, "normal");
          
          // Log SMS
          await SMSLog.logSMS({
            phoneNumber: recipient.phoneNumber,
            message: smsText,
            type: smsNotificationType,
            status: smsResult.success ? "sent" : "failed",
            messageId: smsResult.messageId,
            metadata: {
              notificationId: notification._id,
              notificationType: type,
            },
          });

          results.sms = true;
          console.log(`✅ SMS sent to ${recipient.phoneNumber}`);
        } catch (smsError) {
          console.error(`❌ SMS failed for ${recipient.phoneNumber}:`, smsError.message);
          
          // Log failed SMS
          await SMSLog.logSMS({
            phoneNumber: recipient.phoneNumber,
            message: smsMessage || message,
            type: smsNotificationType,
            status: "failed",
            errorMessage: smsError.message,
            metadata: {
              notificationId: notification._id,
              notificationType: type,
            },
          });
        }
      } else {
        console.log(`⏭️  SMS notification type '${smsNotificationType}' disabled for ${recipient.name}`);
      }
    }

    return {
      success: true,
      notification,
      results,
    };
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotification(recipients, notificationData) {
  const results = [];
  
  for (const recipientId of recipients) {
    const result = await sendNotification({
      recipientId,
      ...notificationData,
    });
    results.push({ recipientId, ...result });
  }
  
  return results;
}

/**
 * Map notification type to SMS notification type
 */
function mapNotificationTypeToSMS(notificationType) {
  const mapping = {
    task_assigned: "task_notification",
    task_assigned_as_manager: "task_notification",
    task_completed: "task_notification",
    task_marked_important: "task_notification",
    comment_added: "task_notification",
    mentioned: "task_notification",
    response_added: "task_notification",
    comment_reply: "task_notification",
    due_date_approaching: "task_notification",
    workspace_invite: "workspace_invite",
    workspace_ownership_transferred: "workspace_invite",
    task_message: "general_notification",
  };

  return mapping[notificationType] || "general_notification";
}

/**
 * Format SMS message based on notification type
 * Detailed Russian format with task links
 */
function formatSMSMessage(type, message, relatedData) {
  const baseUrl = process.env.FRONTEND_URL || "https://protocol.oci.tj";
  let smsText = "";
  let taskLink = "";

  // Generate task link if taskId exists
  if (relatedData.taskId) {
    taskLink = `\n\nОткрыть задачу:\n${baseUrl}/task/${relatedData.taskId}`;
  }

  switch (type) {
    case "task_assigned":
      smsText = `📋 Новая задача: ${message}${taskLink}`;
      break;
    
    case "task_assigned_as_manager":
      smsText = `👔 Вы назначены менеджером: ${message}${taskLink}`;
      break;
    
    case "task_completed":
      smsText = `✅ Задача завершена: ${message}${taskLink}`;
      break;
    
    case "task_marked_important":
      smsText = `⭐ Важная задача: ${message}${taskLink}`;
      break;
    
    case "comment_added":
      smsText = `💬 Новый комментарий: ${message}${taskLink}`;
      break;
    
    case "mentioned":
      smsText = `@️⃣ Вас упомянули: ${message}${taskLink}`;
      break;
    
    case "response_added":
      smsText = `📝 Новый ответ: ${message}${taskLink}`;
      break;
    
    case "comment_reply":
      smsText = `↩️ Ответ на комментарий: ${message}${taskLink}`;
      break;
    
    case "due_date_approaching":
      smsText = `⏰ Приближается срок: ${message}${taskLink}`;
      break;
    
    case "workspace_invite":
      smsText = `🏢 Приглашение в workspace: ${message}`;
      // No task link for workspace invites
      break;
    
    case "workspace_ownership_transferred":
      smsText = `👑 Передача прав: ${message}`;
      // No task link for ownership transfer
      break;
    
    case "task_message":
      smsText = `📨 Сообщение: ${message}${taskLink}`;
      break;
    
    default:
      smsText = `🔔 Уведомление: ${message}`;
      if (taskLink) {
        smsText += taskLink;
      }
  }

  return smsText;
}

/**
 * Helper function to create notification (for backwards compatibility)
 */
export async function createNotification(recipientId, type, title, message, relatedData = {}) {
  return sendNotification({
    recipientId,
    type,
    title,
    message,
    relatedData,
    sendEmail: true,
    sendSMS: true,
  });
}
