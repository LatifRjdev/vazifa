import mongoose from 'mongoose';

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
  taskInfo: {
    title: String,
    status: String,
    priority: String
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminChatMessage',
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
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
  }
}, {
  timestamps: true
});

// Instance methods
adminChatSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId });
  }
  this.isRead = true;
  return this.save();
};

adminChatSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

adminChatSchema.methods.edit = function(newMessage) {
  this.message = newMessage;
  this.editedAt = new Date();
  return this.save();
};

// Static methods
adminChatSchema.statics.getRecentMessages = function(limit = 50, taskId = null) {
  const query = { isDeleted: false };
  if (taskId) {
    query.taskId = taskId;
  }
  
  return this.find(query)
    .populate('sender', 'name email role')
    .populate('taskId', 'title status priority')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit);
};

adminChatSchema.statics.getMessagesByTask = function(taskId) {
  return this.find({ taskId, isDeleted: false })
    .populate('sender', 'name email role')
    .populate('taskId', 'title status priority')
    .populate('replyTo')
    .sort({ createdAt: 1 });
};

adminChatSchema.statics.searchMessages = function(searchQuery, taskId = null) {
  const query = {
    isDeleted: false,
    message: { $regex: searchQuery, $options: 'i' }
  };
  
  if (taskId) {
    query.taskId = taskId;
  }
  
  return this.find(query)
    .populate('sender', 'name email role')
    .populate('taskId', 'title status priority')
    .populate('replyTo')
    .sort({ createdAt: -1 });
};

// Index for better performance
adminChatSchema.index({ createdAt: -1 });
adminChatSchema.index({ taskId: 1, createdAt: -1 });
adminChatSchema.index({ sender: 1, createdAt: -1 });
adminChatSchema.index({ message: 'text' });

const AdminChatMessage = mongoose.model('AdminChatMessage', adminChatSchema);

export default AdminChatMessage;
