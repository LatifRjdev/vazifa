import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AdminChat = require('../models/admin-chat.cjs');
const Task = require('../models/tasks');
const User = require('../models/users');

// Получить все сообщения чата
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50, taskId, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { isDeleted: false };
    
    // Фильтр по задаче
    if (taskId) {
      query.taskId = taskId;
    }
    
    // Поиск по тексту сообщения
    if (search) {
      query.message = { $regex: search, $options: 'i' };
    }

    const messages = await AdminChat.find(query)
      .populate('sender', 'name email role avatar')
      .populate('taskInfo', 'title status priority')
      .populate('replyToMessage', 'message sender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminChat.countDocuments(query);

    res.json({
      messages: messages.reverse(), // Возвращаем в хронологическом порядке
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin chat messages:', error);
    res.status(500).json({ message: 'Ошибка при получении сообщений чата' });
  }
};

// Отправить сообщение
const sendMessage = async (req, res) => {
  try {
    const { message, taskId, messageType = 'text', fileUrl, fileName, replyTo } = req.body;
    const senderId = req.user.id;

    // Проверяем права доступа (только админы и супер админы)
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Валидация
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Сообщение не может быть пустым' });
    }

    // Проверяем существование задачи, если указана
    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Задача не найдена' });
      }
    }

    // Проверяем существование сообщения для ответа
    if (replyTo) {
      const originalMessage = await AdminChat.findById(replyTo);
      if (!originalMessage) {
        return res.status(404).json({ message: 'Исходное сообщение не найдено' });
      }
    }

    const newMessage = new AdminChat({
      message: message.trim(),
      sender: senderId,
      taskId: taskId || null,
      messageType,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      replyTo: replyTo || null
    });

    await newMessage.save();

    // Получаем полную информацию о сообщении
    const populatedMessage = await AdminChat.findById(newMessage._id)
      .populate('sender', 'name email role avatar')
      .populate('taskInfo', 'title status priority')
      .populate('replyToMessage', 'message sender');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending admin chat message:', error);
    res.status(500).json({ message: 'Ошибка при отправке сообщения' });
  }
};

// Редактировать сообщение
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Проверяем права доступа
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const chatMessage = await AdminChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Сообщение не найдено' });
    }

    // Проверяем, что пользователь может редактировать это сообщение
    if (chatMessage.sender.toString() !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Вы можете редактировать только свои сообщения' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Сообщение не может быть пустым' });
    }

    await chatMessage.edit(message.trim());

    const updatedMessage = await AdminChat.findById(messageId)
      .populate('sender', 'name email role avatar')
      .populate('taskInfo', 'title status priority')
      .populate('replyToMessage', 'message sender');

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error editing admin chat message:', error);
    res.status(500).json({ message: 'Ошибка при редактировании сообщения' });
  }
};

// Удалить сообщение
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Проверяем права доступа
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const chatMessage = await AdminChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Сообщение не найдено' });
    }

    // Проверяем, что пользователь может удалить это сообщение
    if (chatMessage.sender.toString() !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Вы можете удалять только свои сообщения' });
    }

    await chatMessage.softDelete();

    res.json({ message: 'Сообщение удалено' });
  } catch (error) {
    console.error('Error deleting admin chat message:', error);
    res.status(500).json({ message: 'Ошибка при удалении сообщения' });
  }
};

// Отметить сообщения как прочитанные
const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id;

    // Проверяем права доступа
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Необходимо указать ID сообщений' });
    }

    const messages = await AdminChat.find({ 
      _id: { $in: messageIds },
      isDeleted: false 
    });

    const updatePromises = messages.map(message => message.markAsRead(userId));
    await Promise.all(updatePromises);

    res.json({ message: 'Сообщения отмечены как прочитанные' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Ошибка при отметке сообщений как прочитанные' });
  }
};

// Получить количество непрочитанных сообщений
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Проверяем права доступа
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const unreadCount = await AdminChat.getUnreadCount(userId);

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Ошибка при получении количества непрочитанных сообщений' });
  }
};

// Получить список задач для фильтрации
const getTasksForFilter = async (req, res) => {
  try {
    // Проверяем права доступа
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Получаем уникальные задачи, которые упоминались в чате
    const tasksInChat = await AdminChat.aggregate([
      { $match: { taskId: { $ne: null }, isDeleted: false } },
      { $group: { _id: '$taskId', taskTitle: { $first: '$taskTitle' } } },
      { $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: '_id',
          as: 'taskDetails'
        }
      },
      { $unwind: '$taskDetails' },
      { $project: {
          _id: 1,
          title: '$taskDetails.title',
          status: '$taskDetails.status',
          priority: '$taskDetails.priority',
          messageCount: 1
        }
      },
      { $sort: { title: 1 } }
    ]);

    // Получаем количество сообщений для каждой задачи
    const taskCounts = await AdminChat.aggregate([
      { $match: { taskId: { $ne: null }, isDeleted: false } },
      { $group: { _id: '$taskId', count: { $sum: 1 } } }
    ]);

    const taskCountMap = {};
    taskCounts.forEach(item => {
      taskCountMap[item._id.toString()] = item.count;
    });

    const tasksWithCounts = tasksInChat.map(task => ({
      ...task,
      messageCount: taskCountMap[task._id.toString()] || 0
    }));

    res.json({ tasks: tasksWithCounts });
  } catch (error) {
    console.error('Error getting tasks for filter:', error);
    res.status(500).json({ message: 'Ошибка при получении списка задач' });
  }
};

// Поиск сообщений
const searchMessages = async (req, res) => {
  try {
    const { query, taskId, page = 1, limit = 20 } = req.query;

    // Проверяем права доступа
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Поисковый запрос должен содержать минимум 2 символа' });
    }

    const skip = (page - 1) * limit;
    const searchQuery = {
      isDeleted: false,
      $or: [
        { message: { $regex: query.trim(), $options: 'i' } },
        { taskTitle: { $regex: query.trim(), $options: 'i' } }
      ]
    };

    if (taskId) {
      searchQuery.taskId = taskId;
    }

    const messages = await AdminChat.find(searchQuery)
      .populate('sender', 'name email role avatar')
      .populate('taskInfo', 'title status priority')
      .populate('replyToMessage', 'message sender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminChat.countDocuments(searchQuery);

    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      searchQuery: query.trim()
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ message: 'Ошибка при поиске сообщений' });
  }
};

export {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  getUnreadCount,
  getTasksForFilter,
  searchMessages
};
