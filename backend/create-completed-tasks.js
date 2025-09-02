import mongoose from 'mongoose';
import Task from './models/tasks.js';
import User from './models/users.js';
import dotenv from 'dotenv';

dotenv.config();

const createCompletedTasks = async () => {
  try {
    // Подключение к MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Подключено к MongoDB');

    // Найти админа
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      console.log('Админ не найден');
      return;
    }

    // Найти всех пользователей
    const users = await User.find();
    console.log(`Найдено пользователей: ${users.length}`);

    // Создать несколько выполненных задач
    const completedTasks = [
      {
        title: 'Разработка API для аутентификации',
        description: 'Создать REST API для системы аутентификации пользователей',
        status: 'Done',
        priority: 'High',
        assignees: [users[0]._id],
        createdBy: admin._id,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 дня назад
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 день назад
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 дней назад
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 дня назад
      },
      {
        title: 'Настройка базы данных',
        description: 'Настроить MongoDB и создать необходимые коллекции',
        status: 'Done',
        priority: 'Medium',
        assignees: users.length > 1 ? [users[1]._id] : [users[0]._id],
        createdBy: admin._id,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 день назад
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // завтра (выполнено раньше срока)
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 дней назад
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 день назад
      },
      {
        title: 'Создание пользовательского интерфейса',
        description: 'Разработать основные компоненты UI для веб-приложения',
        status: 'Done',
        priority: 'High',
        assignees: [users[0]._id],
        createdBy: admin._id,
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 часа назад
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 дня назад
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 часа назад
      },
      {
        title: 'Тестирование функциональности',
        description: 'Провести полное тестирование всех функций системы',
        status: 'Done',
        priority: 'Low',
        assignees: users.length > 2 ? [users[2]._id] : [users[0]._id],
        createdBy: admin._id,
        completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 часов назад
        dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 часов назад (просрочено)
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 дня назад
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 часов назад
      },
      {
        title: 'Документация проекта',
        description: 'Написать техническую документацию для проекта',
        status: 'Done',
        priority: 'Medium',
        assignees: [admin._id],
        createdBy: admin._id,
        completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 минут назад
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 дня назад
        updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 минут назад
      }
    ];

    // Удалить существующие выполненные задачи
    await Task.deleteMany({ status: 'Done' });
    console.log('Удалены существующие выполненные задачи');

    // Создать новые выполненные задачи
    const createdTasks = await Task.insertMany(completedTasks);
    console.log(`Создано ${createdTasks.length} выполненных задач`);

    // Показать созданные задачи
    createdTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title} - ${task.status} (${task.priority})`);
    });

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Отключено от MongoDB');
  }
};

createCompletedTasks();
