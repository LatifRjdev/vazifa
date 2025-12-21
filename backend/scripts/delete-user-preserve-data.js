/**
 * Скрипт для безопасного удаления пользователя без потери данных
 *
 * Использование:
 * node scripts/delete-user-preserve-data.js <userId или email или телефон>
 *
 * Примеры:
 * node scripts/delete-user-preserve-data.js user@example.com
 * node scripts/delete-user-preserve-data.js +992901234567
 * node scripts/delete-user-preserve-data.js 68d654b192707ef294c8bc9b
 *
 * Что делает скрипт:
 * 1. Находит пользователя по ID, email или телефону
 * 2. Создаёт системного пользователя "[Удалённый пользователь]" если его нет
 * 3. Переносит все созданные задачи на системного пользователя
 * 4. Удаляет пользователя из assignees (задачи остаются)
 * 5. Переносит комментарии и ответы на системного пользователя
 * 6. Сохраняет имя удалённого пользователя в деталях для истории
 * 7. Удаляет пользователя из системы
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загрузить .env из корня backend
dotenv.config({ path: join(__dirname, '..', '.env') });

// Импортировать модели
import User from "../models/users.js";
import Task from "../models/tasks.js";
import Comment from "../models/comments.js";
import Response from "../models/responses.js";
import ActivityLog from "../models/activity-logs.js";
import Workspace from "../models/workspace.js";

const DELETED_USER_NAME = "[Удалённый пользователь]";
const DELETED_USER_EMAIL = "deleted@system.local";

/**
 * Получить или создать системного пользователя для удалённых данных
 */
async function getOrCreateDeletedUser() {
  let deletedUser = await User.findOne({ email: DELETED_USER_EMAIL });

  if (!deletedUser) {
    deletedUser = await User.create({
      email: DELETED_USER_EMAIL,
      name: DELETED_USER_NAME,
      role: 'member',
      disabled: true,
      disabledReason: 'Системный пользователь для хранения данных удалённых пользователей',
      authProvider: 'local',
    });
    console.log('✅ Создан системный пользователь для удалённых данных');
  }

  return deletedUser;
}

/**
 * Основная функция удаления пользователя с сохранением данных
 */
async function deleteUserPreserveData(userIdentifier) {
  try {
    // Подключение к MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI не установлен в .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Подключено к MongoDB');

    // Найти пользователя
    const query = {
      $or: [
        { email: userIdentifier },
        { phoneNumber: userIdentifier },
      ]
    };

    // Если это валидный ObjectId, добавить поиск по _id
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      query.$or.push({ _id: userIdentifier });
    }

    const user = await User.findOne(query);

    if (!user) {
      console.log('❌ Пользователь не найден:', userIdentifier);
      console.log('   Попробуйте использовать точный email, телефон или ID пользователя');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Проверить что это не системный пользователь
    if (user.email === DELETED_USER_EMAIL) {
      console.log('❌ Нельзя удалить системного пользователя');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`\n📋 Найден пользователь:`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Имя: ${user.name}`);
    console.log(`   Email: ${user.email || 'нет'}`);
    console.log(`   Телефон: ${user.phoneNumber || 'нет'}`);
    console.log(`   Роль: ${user.role}`);
    console.log(`   Дата регистрации: ${user.createdAt}`);

    // Получить или создать системного пользователя
    const deletedSystemUser = await getOrCreateDeletedUser();
    const originalName = user.name;
    const originalEmail = user.email;
    const originalPhone = user.phoneNumber;

    // Статистика переносимых данных
    const stats = {
      tasksCreated: 0,
      tasksAssigned: 0,
      comments: 0,
      responses: 0,
      activities: 0,
      managerTasks: 0,
      workspaces: 0,
    };

    console.log('\n🔄 Начинаю перенос данных...\n');

    // 1. Обновить задачи где пользователь - создатель
    const createdTasksResult = await Task.updateMany(
      { createdBy: user._id },
      {
        $set: {
          createdBy: deletedSystemUser._id,
          originalCreatorName: originalName,
          originalCreatorEmail: originalEmail,
        }
      }
    );
    stats.tasksCreated = createdTasksResult.modifiedCount;
    console.log(`   📝 Перенесено созданных задач: ${stats.tasksCreated}`);

    // 2. Удалить пользователя из assignees (задачи остаются)
    const assignedTasksResult = await Task.updateMany(
      { assignees: user._id },
      { $pull: { assignees: user._id } }
    );
    stats.tasksAssigned = assignedTasksResult.modifiedCount;
    console.log(`   👥 Удалён из назначенных задач: ${stats.tasksAssigned}`);

    // 3. Обновить задачи где пользователь - ответственный менеджер
    const managerTasksResult = await Task.updateMany(
      { responsibleManager: user._id },
      { $unset: { responsibleManager: "" } }
    );
    stats.managerTasks = managerTasksResult.modifiedCount;
    console.log(`   👔 Удалён как ответственный менеджер: ${stats.managerTasks}`);

    // 4. Удалить пользователя из watchers
    await Task.updateMany(
      { watchers: user._id },
      { $pull: { watchers: user._id } }
    );
    console.log(`   👁️ Удалён из наблюдателей задач`);

    // 5. Обновить комментарии
    const commentsResult = await Comment.updateMany(
      { author: user._id },
      {
        $set: {
          author: deletedSystemUser._id,
          originalAuthorName: originalName,
        }
      }
    );
    stats.comments = commentsResult.modifiedCount;
    console.log(`   💬 Перенесено комментариев: ${stats.comments}`);

    // 6. Обновить ответы
    const responsesResult = await Response.updateMany(
      { author: user._id },
      {
        $set: {
          author: deletedSystemUser._id,
          originalAuthorName: originalName,
        }
      }
    );
    stats.responses = responsesResult.modifiedCount;
    console.log(`   📨 Перенесено ответов: ${stats.responses}`);

    // 7. Обновить логи активности (сохраняем для истории)
    const activitiesResult = await ActivityLog.updateMany(
      { user: user._id },
      {
        $set: {
          user: deletedSystemUser._id,
          'details.originalUserName': originalName,
          'details.originalUserEmail': originalEmail,
        }
      }
    );
    stats.activities = activitiesResult.modifiedCount;
    console.log(`   📊 Перенесено записей активности: ${stats.activities}`);

    // 8. Удалить пользователя из всех workspace
    const workspacesResult = await Workspace.updateMany(
      { 'members.user': user._id },
      { $pull: { members: { user: user._id } } }
    );
    stats.workspaces = workspacesResult.modifiedCount;
    console.log(`   🏢 Удалён из рабочих пространств: ${stats.workspaces}`);

    // 9. Проверить, не является ли пользователь владельцем workspace
    const ownedWorkspaces = await Workspace.find({ owner: user._id });
    if (ownedWorkspaces.length > 0) {
      console.log(`\n⚠️ ВНИМАНИЕ: Пользователь является владельцем ${ownedWorkspaces.length} рабочих пространств:`);
      for (const ws of ownedWorkspaces) {
        console.log(`   - ${ws.name} (ID: ${ws._id})`);
      }
      console.log(`   Передайте владение другим пользователям перед удалением или эти пространства станут без владельца.`);
    }

    // 10. Удалить пользователя
    await User.deleteOne({ _id: user._id });

    console.log(`\n✅ Пользователь "${originalName}" успешно удалён`);
    console.log(`\n📊 Итоговая статистика:`);
    console.log(`   Созданных задач перенесено: ${stats.tasksCreated}`);
    console.log(`   Удалён из назначенных задач: ${stats.tasksAssigned}`);
    console.log(`   Задач как менеджер: ${stats.managerTasks}`);
    console.log(`   Комментариев перенесено: ${stats.comments}`);
    console.log(`   Ответов перенесено: ${stats.responses}`);
    console.log(`   Записей активности: ${stats.activities}`);
    console.log(`   Рабочих пространств: ${stats.workspaces}`);

    console.log(`\n📝 Информация об удалённом пользователе сохранена в полях:`);
    console.log(`   - originalCreatorName: "${originalName}"`);
    console.log(`   - originalAuthorName: "${originalName}"`);
    console.log(`   - details.originalUserName: "${originalName}"`);

    await mongoose.disconnect();
    console.log('\n✅ Операция завершена успешно!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Проверить аргументы командной строки
const userIdentifier = process.argv[2];

if (!userIdentifier) {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║           СКРИПТ УДАЛЕНИЯ ПОЛЬЗОВАТЕЛЯ БЕЗ ПОТЕРИ ДАННЫХ                 ║
╚════════════════════════════════════════════════════════════════════════════╝

Использование:
  node scripts/delete-user-preserve-data.js <userId или email или телефон>

Примеры:
  node scripts/delete-user-preserve-data.js user@example.com
  node scripts/delete-user-preserve-data.js +992901234567
  node scripts/delete-user-preserve-data.js 68d654b192707ef294c8bc9b

Что делает скрипт:
  1. Находит пользователя по ID, email или телефону
  2. Переносит все созданные задачи на системного пользователя
  3. Удаляет пользователя из списка назначенных (assignees)
  4. Переносит комментарии и ответы с сохранением имени автора
  5. Обновляет логи активности
  6. Удаляет пользователя из всех рабочих пространств
  7. Удаляет пользователя из системы

Данные сохраняются:
  - Все задачи остаются в системе
  - Комментарии и ответы остаются
  - История активности сохраняется
  - Имя удалённого пользователя сохраняется в специальных полях
`);
  process.exit(1);
}

// Запуск
deleteUserPreserveData(userIdentifier);
