import Notification from "../models/notifications.js";

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("relatedData.actorId", "name email profilePicture")
      .sort({ createdAt: -1 });
    // .limit(50);

    const unreadCount = notifications.filter((notif) => !notif.isRead).length;

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUnreadNotificationsCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json(unreadCount);
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
};
