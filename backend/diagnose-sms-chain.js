/**
 * SMS Chain Diagnostic Script
 * Проверяет всю цепочку отправки SMS от начала до конца
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("\n" + "=".repeat(80));
console.log("🔍 ДИАГНОСТИКА ЦЕПОЧКИ SMS УВЕДОМЛЕНИЙ");
console.log("=".repeat(80));
console.log(`⏰ Время: ${new Date().toISOString()}\n`);

async function diagnose() {
  const results = {
    mongodb: false,
    redis: false,
    smpp: false,
    user: null,
    smsLogs: [],
    directSMS: false,
  };

  try {
    // 1. Проверка MongoDB
    console.log("📦 1. ПРОВЕРКА MONGODB");
    console.log("-".repeat(40));
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`✅ MongoDB подключен: ${process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      results.mongodb = true;
    } catch (err) {
      console.log(`❌ MongoDB ошибка: ${err.message}`);
      return results;
    }

    // 2. Проверка Redis
    console.log("\n📦 2. ПРОВЕРКА REDIS");
    console.log("-".repeat(40));
    try {
      const { createClient } = await import("redis");
      const redisHost = process.env.REDIS_HOST || "127.0.0.1";
      const redisPort = process.env.REDIS_PORT || 6379;
      const redisPassword = process.env.REDIS_PASSWORD;

      console.log(`🔧 Redis конфигурация: ${redisHost}:${redisPort}`);

      const client = createClient({
        socket: { host: redisHost, port: redisPort },
        password: redisPassword || undefined,
      });

      client.on("error", (err) => console.log(`❌ Redis ошибка: ${err.message}`));

      await client.connect();
      const pong = await client.ping();
      console.log(`✅ Redis отвечает: ${pong}`);

      // Проверяем очередь SMS
      const queueKeys = await client.keys("bull:sms-queue:*");
      console.log(`📬 Ключи очереди SMS: ${queueKeys.length}`);

      if (queueKeys.length > 0) {
        for (const key of queueKeys.slice(0, 5)) {
          console.log(`   - ${key}`);
        }
      }

      await client.disconnect();
      results.redis = true;
    } catch (err) {
      console.log(`❌ Redis недоступен: ${err.message}`);
      console.log("   SMS будут теряться если SMPP не подключен!");
    }

    // 3. Проверка SMPP
    console.log("\n📦 3. ПРОВЕРКА SMPP СЕРВИСА");
    console.log("-".repeat(40));
    try {
      const { getSMPPService } = await import("./libs/send-sms-bullmq.js");
      const smppService = getSMPPService();
      const status = smppService.getStatus();

      console.log(`🔌 Подключен: ${status.connected ? "✅ ДА" : "❌ НЕТ"}`);
      console.log(`🔄 Подключается: ${status.connecting ? "ДА" : "НЕТ"}`);
      console.log(`📊 Попыток переподключения: ${status.reconnectAttempts}`);
      console.log(`⚙️ Конфигурация:`);
      console.log(`   Host: ${status.config.host}:${status.config.port}`);
      console.log(`   System ID: ${status.config.system_id}`);
      console.log(`   Source: ${status.config.source_addr}`);

      results.smpp = status.connected;

      // Подождём подключения если в процессе
      if (!status.connected && status.connecting) {
        console.log("\n⏳ Ожидание подключения SMPP (15 секунд)...");
        let waited = 0;
        while (!smppService.connected && waited < 15000) {
          await new Promise(r => setTimeout(r, 1000));
          waited += 1000;
          process.stdout.write(`\r   Прошло: ${waited/1000}s`);
        }
        console.log();

        if (smppService.connected) {
          console.log("✅ SMPP подключился!");
          results.smpp = true;
        } else {
          console.log("❌ SMPP не подключился за 15 секунд");
        }
      }
    } catch (err) {
      console.log(`❌ SMPP ошибка: ${err.message}`);
    }

    // 4. Проверка пользователя с телефоном
    console.log("\n📦 4. ПРОВЕРКА ПОЛЬЗОВАТЕЛЕЙ С ТЕЛЕФОНАМИ");
    console.log("-".repeat(40));
    try {
      const User = (await import("./models/users.js")).default;

      const usersWithPhone = await User.find({
        phoneNumber: { $exists: true, $ne: null, $ne: "" }
      }).limit(5);

      console.log(`👥 Найдено пользователей с телефоном: ${usersWithPhone.length}`);

      for (const user of usersWithPhone) {
        console.log(`\n   📱 ${user.name}`);
        console.log(`      Телефон: ${user.phoneNumber}`);
        console.log(`      Роль: ${user.role}`);
        console.log(`      SMS настройки: ${JSON.stringify(user.settings?.smsNotifications)}`);
        console.log(`      canReceiveSMS(): ${user.canReceiveSMS ? user.canReceiveSMS() : 'метод отсутствует'}`);

        if (!results.user) {
          results.user = user;
        }
      }
    } catch (err) {
      console.log(`❌ Ошибка поиска пользователей: ${err.message}`);
    }

    // 5. Проверка SMS логов
    console.log("\n📦 5. ПОСЛЕДНИЕ SMS ЛОГИ");
    console.log("-".repeat(40));
    try {
      const SMSLog = (await import("./models/sms-logs.js")).default;

      const recentLogs = await SMSLog.find({})
        .sort({ createdAt: -1 })
        .limit(10);

      console.log(`📝 Найдено логов: ${recentLogs.length}`);

      for (const log of recentLogs) {
        console.log(`\n   📱 ${log.phoneNumber}`);
        console.log(`      Статус: ${log.status === 'sent' ? '✅' : '❌'} ${log.status}`);
        console.log(`      Тип: ${log.type}`);
        console.log(`      Время: ${log.createdAt}`);
        if (log.errorMessage) {
          console.log(`      Ошибка: ${log.errorMessage}`);
        }
        if (log.messageId) {
          console.log(`      Message ID: ${log.messageId}`);
        }
      }

      results.smsLogs = recentLogs;
    } catch (err) {
      console.log(`❌ Ошибка чтения SMS логов: ${err.message}`);
    }

    // 6. Тестовая отправка SMS (только если SMPP подключен)
    console.log("\n📦 6. ТЕСТОВАЯ ОТПРАВКА SMS");
    console.log("-".repeat(40));

    if (results.smpp && results.user) {
      try {
        const { sendSMS } = await import("./libs/send-sms-bullmq.js");

        const testPhone = results.user.phoneNumber;
        const testMessage = `🧪 Тест диагностики\nВремя: ${new Date().toLocaleString('ru-RU')}`;

        console.log(`📤 Отправка тестового SMS на ${testPhone}...`);

        const smsResult = await sendSMS(testPhone, testMessage, "high");

        console.log(`\n📊 Результат:`);
        console.log(JSON.stringify(smsResult, null, 2));

        results.directSMS = smsResult.success;

        if (smsResult.queued) {
          console.log("\n⚠️ SMS добавлено в очередь (SMPP был отключен в момент отправки)");
        } else if (smsResult.success) {
          console.log("\n✅ SMS отправлено напрямую через SMPP!");
        }
      } catch (err) {
        console.log(`❌ Ошибка отправки: ${err.message}`);
      }
    } else {
      if (!results.smpp) {
        console.log("⏭️ Пропущено: SMPP не подключен");
      }
      if (!results.user) {
        console.log("⏭️ Пропущено: Нет пользователей с телефоном");
      }
    }

    // Итоги
    console.log("\n" + "=".repeat(80));
    console.log("📊 ИТОГИ ДИАГНОСТИКИ");
    console.log("=".repeat(80));
    console.log(`MongoDB:     ${results.mongodb ? "✅ OK" : "❌ ПРОБЛЕМА"}`);
    console.log(`Redis:       ${results.redis ? "✅ OK" : "❌ ПРОБЛЕМА (очередь не работает)"}`);
    console.log(`SMPP:        ${results.smpp ? "✅ OK" : "❌ ПРОБЛЕМА (нет подключения к Megafon)"}`);
    console.log(`Тест SMS:    ${results.directSMS ? "✅ ОТПРАВЛЕНО" : "❌ НЕ ОТПРАВЛЕНО"}`);

    if (!results.smpp) {
      console.log("\n🔧 РЕКОМЕНДАЦИИ:");
      console.log("   1. Проверьте SMPP_PASSWORD в .env файле");
      console.log("   2. Проверьте доступность SMPP сервера (10.241.60.10:2775)");
      console.log("   3. Проверьте логи SMPP подключения при запуске сервера");
      console.log("   4. Возможно нужен VPN или внутренняя сеть для доступа к SMPP");
    }

    if (!results.redis && !results.smpp) {
      console.log("\n⚠️ КРИТИЧНО: И Redis и SMPP недоступны!");
      console.log("   SMS не могут быть отправлены ни напрямую, ни через очередь!");
    }

  } catch (err) {
    console.error("\n❌ Критическая ошибка:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Отключено от MongoDB\n");
    process.exit(0);
  }
}

diagnose();
