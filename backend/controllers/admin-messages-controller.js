import AdminMessage from "../models/admin-messages.js";
import User from "../models/users.js";

// Send a message (admin/super admin only)
const sendMessage = async (req, res) => {
  try {
    const { recipient, message, messageType = "direct", attachments = [], priority = "normal", language = "ru" } = req.body;

    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы могут отправлять сообщения." });
    }

    // Validate recipient for direct messages
    if (messageType === "direct" && !recipient) {
      return res.status(400).json({ message: "Получатель обязателен для прямых сообщений." });
    }

    // Validate recipient exists and is admin/super admin
    if (recipient) {
      const recipientUser = await User.findById(recipient);
      if (!recipientUser) {
        return res.status(404).json({ message: "Получатель не найден." });
      }
      if (!["admin", "super_admin"].includes(recipientUser.role)) {
        return res.status(400).json({ message: "Сообщения можно отправлять только админам и супер админам." });
      }
    }

    const newMessage = await AdminMessage.create({
      sender: req.user._id,
      recipient: messageType === "broadcast" ? null : recipient,
      message,
      messageType,
      attachments,
      priority,
      language,
    });

    // Populate sender details
    await newMessage.populate("sender", "name profilePicture role");
    if (newMessage.recipient) {
      await newMessage.populate("recipient", "name profilePicture role");
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Get messages for current user
const getMessages = async (req, res) => {
  try {
    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен. Только админы могут просматривать сообщения." });
    }

    const { page = 1, limit = 50, messageType, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      $or: [
        { recipient: req.user._id }, // Direct messages to user
        { messageType: "broadcast" }, // Broadcast messages
        { sender: req.user._id }, // Messages sent by user
      ],
      isDeleted: false,
    };

    if (messageType) {
      filter.messageType = messageType;
    }

    if (unreadOnly === "true") {
      filter.isRead = false;
      filter.recipient = req.user._id; // Only unread messages for current user
    }

    const messages = await AdminMessage.find(filter)
      .populate("sender", "name profilePicture role")
      .populate("recipient", "name profilePicture role")
      .populate("replyTo", "message sender")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminMessage.countDocuments(filter);

    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    const message = await AdminMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Сообщение не найдено." });
    }

    // Only recipient can mark message as read
    if (message.recipient && message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: "Сообщение отмечено как прочитанное." });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: newMessage } = req.body;

    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    const message = await AdminMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Сообщение не найдено." });
    }

    // Only sender can edit message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Можно редактировать только свои сообщения." });
    }

    // Store original message if not already stored
    if (!message.originalMessage) {
      message.originalMessage = message.message;
    }

    message.message = newMessage;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate("sender", "name profilePicture role");
    if (message.recipient) {
      await message.populate("recipient", "name profilePicture role");
    }

    res.json(message);
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    const message = await AdminMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Сообщение не найдено." });
    }

    // Only sender or super admin can delete message
    const canDelete = message.sender.toString() === req.user._id.toString() || req.user.role === "super_admin";
    if (!canDelete) {
      return res.status(403).json({ message: "Недостаточно прав для удаления сообщения." });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: "Сообщение удалено." });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Reply to message
const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message, attachments = [], priority = "normal", language = "ru" } = req.body;

    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    const originalMessage = await AdminMessage.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: "Исходное сообщение не найдено." });
    }

    // Determine recipient for reply
    let recipient;
    if (originalMessage.sender.toString() === req.user._id.toString()) {
      // If replying to own message, send to original recipient
      recipient = originalMessage.recipient;
    } else {
      // If replying to someone else's message, send to original sender
      recipient = originalMessage.sender;
    }

    const reply = await AdminMessage.create({
      sender: req.user._id,
      recipient,
      message,
      messageType: "direct",
      attachments,
      priority,
      language,
      replyTo: messageId,
    });

    await reply.populate("sender", "name profilePicture role");
    if (reply.recipient) {
      await reply.populate("recipient", "name profilePicture role");
    }
    await reply.populate("replyTo", "message sender");

    res.status(201).json(reply);
  } catch (error) {
    console.error("Error replying to message:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Add reaction to message
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    const message = await AdminMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Сообщение не найдено." });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      (reaction) => reaction.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Remove reaction if same emoji
        message.reactions = message.reactions.filter(
          (reaction) => reaction.user.toString() !== req.user._id.toString()
        );
      } else {
        // Update reaction
        existingReaction.emoji = emoji;
        existingReaction.createdAt = new Date();
      }
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        emoji,
      });
    }

    await message.save();
    await message.populate("reactions.user", "name profilePicture");

    res.json(message);
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    const unreadCount = await AdminMessage.countDocuments({
      $or: [
        { recipient: req.user._id, isRead: false },
        { messageType: "broadcast", isRead: false },
      ],
      isDeleted: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// Get online admin users
const getOnlineAdmins = async (req, res) => {
  try {
    // Check if user has admin permissions
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещен." });
    }

    // Get all admin users (we'll implement online status later with WebSocket)
    const admins = await User.find(
      { role: { $in: ["admin", "super_admin"] } },
      "name profilePicture role lastLogin"
    ).sort({ name: 1 });

    // For now, consider users online if they logged in within last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const onlineAdmins = admins.map(admin => ({
      ...admin.toObject(),
      isOnline: admin.lastLogin && admin.lastLogin > fifteenMinutesAgo
    }));

    res.json({ admins: onlineAdmins });
  } catch (error) {
    console.error("Error getting online admins:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export {
  sendMessage,
  getMessages,
  markAsRead,
  editMessage,
  deleteMessage,
  replyToMessage,
  addReaction,
  getUnreadCount,
  getOnlineAdmins,
};
