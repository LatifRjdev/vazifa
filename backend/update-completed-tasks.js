import mongoose from 'mongoose';
import Task from './models/tasks.js';
import dotenv from 'dotenv';

dotenv.config();

const updateCompletedTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Подключено к MongoDB');

    // Найти все задачи со статусом "Done", но без completedAt
    const tasksToUpdate = await Task.find({
      status: "Done",
      completedAt: { $exists: false }
    });

    console.log(`Найдено ${tasksToUpdate.length} выполненных задач без completedAt`);

    // Обновить каждую задачу
    for (const task of tasksToUpdate) {
      task.completedAt = task.updatedAt || new Date();
      await task.save();
      console.log(`Обновлена задача: ${task.title}`);
    }

    console.log('Все выполненные задачи обновлены');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
};

updateCompletedTasks();
