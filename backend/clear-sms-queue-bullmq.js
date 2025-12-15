import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

async function clearSMSQueue() {
  let queue = null;
  
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧹 ОЧИСТКА SMS ОЧЕРЕДИ (BullMQ)");
    console.log("=".repeat(80));
    console.log(`📡 Redis: ${redisConfig.host}:${redisConfig.port}`);
    console.log("");

    // Создать подключение к очереди
    queue = new Queue("sms-queue", {
      connection: redisConfig,
    });

    // Получить статистику ДО очистки
    console.log("📊 СТАТИСТИКА ДО ОЧИСТКИ:");
    const statsBefore = {
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
      delayed: await queue.getDelayedCount(),
    };

    console.log(`   Waiting: ${statsBefore.waiting}`);
    console.log(`   Active: ${statsBefore.active}`);
    console.log(`   Completed: ${statsBefore.completed}`);
    console.log(`   Failed: ${statsBefore.failed}`);
    console.log(`   Delayed: ${statsBefore.delayed}`);
    console.log(`   TOTAL: ${Object.values(statsBefore).reduce((a, b) => a + b, 0)}`);
    
    const total = Object.values(statsBefore).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
      console.log("\n✅ Очередь уже пуста! Ничего не требуется.");
      return;
    }

    console.log("\n🗑️  НАЧИНАЮ ОЧИСТКУ...");
    
    // Очистить completed jobs
    if (statsBefore.completed > 0) {
      console.log(`\n🧹 Очистка completed jobs (${statsBefore.completed})...`);
      const completedJobs = await queue.clean(0, 1000, 'completed');
      console.log(`   ✅ Удалено: ${completedJobs.length} completed jobs`);
    }
    
    // Очистить failed jobs
    if (statsBefore.failed > 0) {
      console.log(`\n🧹 Очистка failed jobs (${statsBefore.failed})...`);
      const failedJobs = await queue.clean(0, 1000, 'failed');
      console.log(`   ✅ Удалено: ${failedJobs.length} failed jobs`);
    }
    
    // Очистить waiting jobs
    if (statsBefore.waiting > 0) {
      console.log(`\n🧹 Очистка waiting jobs (${statsBefore.waiting})...`);
      await queue.drain();
      console.log(`   ✅ Удалено: ${statsBefore.waiting} waiting jobs`);
    }
    
    // Очистить delayed jobs
    if (statsBefore.delayed > 0) {
      console.log(`\n🧹 Очистка delayed jobs (${statsBefore.delayed})...`);
      const delayedJobs = await queue.clean(0, 1000, 'delayed');
      console.log(`   ✅ Удалено: ${delayedJobs.length} delayed jobs`);
    }

    // Полная очистка (obliterate)
    console.log("\n💥 Выполняю полную очистку (obliterate)...");
    await queue.obliterate({ force: true });
    console.log("   ✅ Очередь полностью очищена!");
    
    // Ждем немного
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Получить статистику ПОСЛЕ очистки
    console.log("\n📊 СТАТИСТИКА ПОСЛЕ ОЧИСТКИ:");
    const statsAfter = {
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
      delayed: await queue.getDelayedCount(),
    };

    console.log(`   Waiting: ${statsAfter.waiting}`);
    console.log(`   Active: ${statsAfter.active}`);
    console.log(`   Completed: ${statsAfter.completed}`);
    console.log(`   Failed: ${statsAfter.failed}`);
    console.log(`   Delayed: ${statsAfter.delayed}`);
    console.log(`   TOTAL: ${Object.values(statsAfter).reduce((a, b) => a + b, 0)}`);

    console.log("\n" + "=".repeat(80));
    console.log("✅ ОЧИСТКА ЗАВЕРШЕНА!");
    console.log("=".repeat(80));
    console.log(`\n📊 РЕЗУЛЬТАТ:`);
    console.log(`   Было: ${total} jobs`);
    console.log(`   Осталось: ${Object.values(statsAfter).reduce((a, b) => a + b, 0)} jobs`);
    console.log(`   Удалено: ${total - Object.values(statsAfter).reduce((a, b) => a + b, 0)} jobs`);
    console.log("\n" + "=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Ошибка при очистке очереди:", error);
    console.error("   Детали:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error("\n⚠️  Redis не доступен!");
      console.error("   Проверьте что Redis запущен:");
      console.error("   - redis-cli ping");
      console.error(`   - redis-cli -h ${redisConfig.host} -p ${redisConfig.port} ping`);
    }
  } finally {
    // Закрыть подключение
    if (queue) {
      await queue.close();
      console.log("👋 Подключение к очереди закрыто");
    }
    
    // Принудительный выход
    process.exit(0);
  }
}

// Запустить
clearSMSQueue();
