const mongoose = require('mongoose');

const adminChatSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  taskTitle: {
    type: String,
    default: null
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  isRead: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminChat',
    default: null
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
adminChatSchema.index({ createdAt: -1 });
adminChatSchema.index({ taskId: 1, createdAt: -1 });
adminChatSchema.index({ sender: 1, createdAt: -1 });
adminChatSchema.index({ isDeleted: 1, createdAt: -1 });

// Виртуальные поля
adminChatSchema.virtual('senderInfo', {
  ref: 'User',
  localField: 'sender',
  foreignField: '_id',
  justOne: true
});

adminChatSchema.virtual('taskInfo', {
  ref: 'Task',
  localField: 'taskId',
  foreignField: '_id',
  justOne: true
});

adminChatSchema.virtual('replyToMessage', {
  ref: 'AdminChat',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true
});

// Методы экземпляра
adminChatSchema.methods.markAsRead = function(userId) {
  const existingRead = this.isRead.find(read => read.userId.toString() === userId.toString());
  if (!existingRead) {
    this.isRead.push({ userId, readAt: new Date() });
  }
  return this.save();
};

adminChatSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

adminChatSchema.methods.edit = function(newMessage) {
  this.message = newMessage;
  this.editedAt = new Date();
  return this.save();
};

// Статические методы
adminChatSchema.statics.getRecentMessages = function(limit = 50, taskId = null) {
  const query = { isDeleted: false };
  if (taskId) {
    query.taskId = taskId;
  }
  
  return this.find(query)
    .populate('sender', 'name email role avatar')
    .populate('taskInfo', 'title status priority')
    .populate('replyToMessage', 'message sender')
    .sort({ createdAt: -1 })
    .limit(limit);
};

adminChatSchema.statics.getMessagesByTask = function(taskId, limit = 100) {
  return this.find({ taskId, isDeleted: false })
    .populate('sender', 'name email role avatar')
    .populate('replyToMessage', 'message sender')
    .sort({ createdAt: -1 })
    .limit(limit);
};

adminChatSchema.statics.searchMessages = function(searchTerm, taskId = null) {
  const query = {
    isDeleted: false,
    message: { $regex: searchTerm, $options: 'i' }
  };
  
  if (taskId) {
    query.taskId = taskId;
  }
  
  return this.find(query)
    .populate('sender', 'name email role avatar')
    .populate('taskInfo', 'title status priority')
    .sort({ createdAt: -1 })
    .limit(50);
};

adminChatSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    isDeleted: false,
    'isRead.userId': { $ne: userId }
  });
};

// Middleware для автоматического заполнения taskTitle
adminChatSchema.pre('save', async function(next) {
  if (this.taskId && !this.taskTitle) {
    try {
      const Task = mongoose.model('Task');
      const task = await Task.findById(this.taskId).select('title');
      if (task) {
        this.taskTitle = task.title;
      }
    } catch (error) {
      console.error('Error fetching task title:', error);
    }
  }
  next();
});

// Middleware для удаления связанных данных при удалении сообщения
adminChatSchema.pre('remove', function(next) {
  // Удаляем все ответы на это сообщение
  this.constructor.updateMany(
    { replyTo: this._id },
    { $unset: { replyTo: 1 } }
  ).exec();
  next();
});

const AdminChat = mongoose.model('AdminChat', adminChatSchema);

module.exports = AdminChat;
