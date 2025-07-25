import ActivityLog from "../models/activity-logs.js";
import Notification from "../models/notifications.js";

// Helper function to record activity
const recordActivity = async (
  userId,
  action,
  resourceType,
  resourceId,
  details = {}
) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to record activity:", error);
  }
};

// Helper function to create a notification
const createNotification = async (
  recipientId,
  type,
  title,
  message,
  relatedData = {}
) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      isRead: false,
      relatedData,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

export { recordActivity, createNotification };
