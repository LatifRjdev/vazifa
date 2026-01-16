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
    if (shouldSendEmail && recipient.emailNotifications !== false && recipient.email) {
      try {
        const emailSubject = emailData?.subject || title;
        const emailBody = emailData?.html || message;
        
        // Generate task link if taskId is available
        const taskLink = relatedData.taskId 
          ? `${process.env.FRONTEND_URL || 'https://protocol.oci.tj'}/dashboard/task/${relatedData.taskId}`
          : `${process.env.FRONTEND_URL || 'https://protocol.oci.tj'}/dashboard`;
        
        const buttonText = emailData?.buttonText || 'Открыть задачу';

        await sendEmail(
          recipient.email,        // to
          emailSubject,           // subject
          recipient.name,         // name
          emailBody,              // message
          buttonText,             // buttonText
          taskLink                // buttonLink
        );
        results.email = true;
        console.log(`✅ Email sent to ${recipient.email}`);
      } catch (emailError) {
        console.error(`❌ Email failed for ${recipient.email}:`, emailError.message);
      }
    }

    // Send SMS if enabled and user has phone number (NO SETTINGS CHECK)
    if (shouldSendSMS && recipient.phoneNumber) {
      const smsNotificationType = mapNotificationTypeToSMS(type);
      
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
    awaiting_status_change: "task_notification",
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
  // Keep SMS short (max 70 chars for Cyrillic) - no emojis, no links
  // Extract just the task title from the message
  let taskTitle = "";
  const titleMatch = message.match(/задачу[:\s]+["«]?([^"»]+)["»]?$/i) ||
                     message.match(/задачи[:\s]+["«]?([^"»]+)["»]?$/i);
  if (titleMatch) {
    taskTitle = titleMatch[1].trim();
  }

  // Truncate task title if too long
  if (taskTitle.length > 30) {
    taskTitle = taskTitle.substring(0, 27) + "...";
  }

  let smsText = "";

  switch (type) {
    case "task_assigned":
      smsText = taskTitle
        ? `Протокол: Новая задача "${taskTitle}"`
        : `Протокол: Вам назначена задача`;
      break;

    case "task_assigned_as_manager":
      smsText = taskTitle
        ? `Протокол: Вы менеджер "${taskTitle}"`
        : `Протокол: Вы назначены менеджером`;
      break;

    case "task_completed":
      smsText = taskTitle
        ? `Протокол: Задача "${taskTitle}" завершена`
        : `Протокол: Задача завершена`;
      break;

    case "task_marked_important":
      smsText = taskTitle
        ? `Протокол: Важная задача "${taskTitle}"`
        : `Протокол: Задача отмечена важной`;
      break;

    case "comment_added":
      smsText = `Протокол: Новый комментарий к задаче`;
      break;

    case "mentioned":
      smsText = `Протокол: Вас упомянули в комментарии`;
      break;

    case "response_added":
      smsText = `Протокол: Новый ответ на задачу`;
      break;

    case "comment_reply":
      smsText = `Протокол: Ответ на ваш комментарий`;
      break;

    case "due_date_approaching":
      smsText = taskTitle
        ? `Протокол: Срок "${taskTitle}" скоро`
        : `Протокол: Срок задачи приближается`;
      break;

    case "workspace_invite":
      smsText = `Протокол: Приглашение в workspace`;
      break;

    case "workspace_ownership_transferred":
      smsText = `Протокол: Передача прав workspace`;
      break;

    case "task_message":
      smsText = `Протокол: Новое сообщение по задаче`;
      break;

    case "awaiting_status_change":
      smsText = taskTitle
        ? `Протокол: Запрос статуса "${taskTitle}"`
        : `Протокол: Запрос на изменение статуса`;
      break;

    default:
      smsText = `Протокол: Новое уведомление`;
  }

  // Ensure max 70 characters for reliable delivery
  if (smsText.length > 70) {
    smsText = smsText.substring(0, 67) + "...";
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
