import express from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  getUnreadCount,
  getTasksForFilter,
  searchMessages
} = require('../controllers/admin-chat-controller.js');

const router = express.Router();

// Простой middleware для проверки аутентификации и роли
router.use((req, res, next) => {
  // Проверяем наличие пользователя (должен быть установлен в authMiddleware)
  if (!req.user) {
    return res.status(401).json({ message: 'Требуется аутентификация' });
  }
  
  // Проверяем роль пользователя
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }
  
  next();
});

// GET /api-v1/admin-chat/messages - Получить сообщения чата
router.get('/messages', getMessages);

// POST /api-v1/admin-chat/messages - Отправить сообщение
router.post('/messages', sendMessage);

// PUT /api-v1/admin-chat/messages/:messageId - Редактировать сообщение
router.put('/messages/:messageId', editMessage);

// DELETE /api-v1/admin-chat/messages/:messageId - Удалить сообщение
router.delete('/messages/:messageId', deleteMessage);

// POST /api-v1/admin-chat/mark-read - Отметить сообщения как прочитанные
router.post('/mark-read', markAsRead);

// GET /api-v1/admin-chat/unread-count - Получить количество непрочитанных сообщений
router.get('/unread-count', getUnreadCount);

// GET /api-v1/admin-chat/tasks - Получить список задач для фильтрации
router.get('/tasks', getTasksForFilter);

// GET /api-v1/admin-chat/search - Поиск сообщений
router.get('/search', searchMessages);

export default router;
