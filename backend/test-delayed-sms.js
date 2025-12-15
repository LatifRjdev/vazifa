import dotenv from "dotenv";
import { getSMPPService } from "./libs/send-sms.js";

// Load environment variables
dotenv.config();

console.log("=".repeat(80));
console.log("📱 ЗАДЕРЖАННЫЙ SMS ТЕСТ");
console.log("=".repeat(80));
console.log("Отправка SMS на 2 номера с задержкой 30 секунд");
console.log("=".repeat(80));

// Phone numbers from task
const phoneNumber1 = "+992557777509";
const phoneNumber2 = "+992985343331";

// Test message
const testMessage = "Тест";

async function runDelayedTest() {
  try {
    console.log("\n📋 Конфигурация теста:");
    console.log(`   Номер 1: ${phoneNumber1}`);
    console.log(`   Номер 2: ${phoneNumber2}`);
    console.log(`   Сообщение: "${testMessage}"`);
    console.log(`   Задержка: 30 секунд`);
    console.log("\n" + "=".repeat(80));
    
    // Get SMPP service instance
    console.log("\n🔌 Подключение к SMPP серверу...");
    const smppService = getSMPPService();
    
    // Wait for connection
    let connectionAttempts = 0;
    const maxAttempts = 30;
    
    while (!smppService.connected && connectionAttempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      connectionAttempts++;
      process.stdout.write(`\r⏳ Ожидание подключения... ${connectionAttempts}/${maxAttempts}с`);
    }
    
    console.log("\n");
    
    if (!smppService.connected) {
      console.error("\n❌ НЕ УДАЛОСЬ ПОДКЛЮЧИТЬСЯ К SMPP СЕРВЕРУ");
      console.error("\n🔍 Проверьте:");
      console.error("   1. SMPP сервер доступен:");
      console.error("      telnet 10.241.60.10 2775");
      console.error("   2. Учетные данные в backend/.env:");
      console.error("      SMPP_SYSTEM_ID=Rushdie_Roh");
      console.error("      SMPP_PASSWORD=J7PCez");
      console.error("   3. PM2 логи:");
      console.error("      pm2 logs vazifa-backend | grep SMPP");
      console.error("\n");
      process.exit(1);
    }
    
    console.log("✅ SMPP подключен!\n");
    
    // Display connection status
    const status = smppService.getStatus();
    console.log("📊 Статус подключения:");
    console.log(`   Хост: ${status.config.host}:${status.config.port}`);
    console.log(`   System ID: ${status.config.system_id}`);
    console.log(`   Отправитель: ${status.config.source_addr}`);
    console.log(`   Статус: ${status.connected ? "✅ Подключен" : "❌ Отключен"}`);
    console.log("\n" + "=".repeat(80));
    
    // ==================== FIRST SMS ====================
    console.log("\n📤 ОТПРАВКА ПЕРВОГО SMS");
    console.log("=".repeat(80));
    console.log(`   На номер: ${phoneNumber1}`);
    console.log(`   Сообщение: "${testMessage}"`);
    console.log(`   Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}`);
    
    let result1;
    try {
      result1 = await smppService.sendSMS(phoneNumber1, testMessage, "high");
      
      console.log(`\n   ✅ ПЕРВОЕ SMS ОТПРАВЛЕНО УСПЕШНО!`);
      console.log(`   Message ID: ${result1.messageId}`);
      console.log(`   Частей: ${result1.parts}`);
      console.log(`   В очереди: ${result1.queued ? "Да" : "Нет"}`);
      
    } catch (error) {
      console.error(`\n   ❌ ОШИБКА ПРИ ОТПРАВКЕ ПЕРВОГО SMS: ${error.message}`);
      result1 = { success: false, error: error.message };
    }
    
    // ==================== WAIT 30 SECONDS ====================
    console.log("\n" + "=".repeat(80));
    console.log("⏰ ОЖИДАНИЕ 30 СЕКУНД...");
    console.log("=".repeat(80));
    
    for (let i = 30; i > 0; i--) {
      process.stdout.write(`\r⏳ Осталось секунд: ${i.toString().padStart(2, '0')} `);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("\r✅ Задержка завершена!                ");
    
    // ==================== SECOND SMS ====================
    console.log("\n" + "=".repeat(80));
    console.log("📤 ОТПРАВКА ВТОРОГО SMS");
    console.log("=".repeat(80));
    console.log(`   На номер: ${phoneNumber2}`);
    console.log(`   Сообщение: "${testMessage}"`);
    console.log(`   Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' })}`);
    
    let result2;
    try {
      result2 = await smppService.sendSMS(phoneNumber2, testMessage, "high");
      
      console.log(`\n   ✅ ВТОРОЕ SMS ОТПРАВЛЕНО УСПЕШНО!`);
      console.log(`   Message ID: ${result2.messageId}`);
      console.log(`   Частей: ${result2.parts}`);
      console.log(`   В очереди: ${result2.queued ? "Да" : "Нет"}`);
      
    } catch (error) {
      console.error(`\n   ❌ ОШИБКА ПРИ ОТПРАВКЕ ВТОРОГО SMS: ${error.message}`);
      result2 = { success: false, error: error.message };
    }
    
    // ==================== SUMMARY ====================
    console.log("\n" + "=".repeat(80));
    console.log("📊 ИТОГОВЫЕ РЕЗУЛЬТАТЫ");
    console.log("=".repeat(80));
    
    console.log(`\n1️⃣  Первое SMS (${phoneNumber1}):`);
    if (result1 && result1.success !== false) {
      console.log(`    ✅ Статус: Отправлено`);
      console.log(`    📝 Message ID: ${result1.messageId}`);
      if (result1.queued) {
        console.log(`    ⚠️  Примечание: В очереди (будет отправлено при переподключении SMPP)`);
      }
    } else {
      console.log(`    ❌ Статус: Ошибка`);
      console.log(`    📝 Ошибка: ${result1.error}`);
    }
    
    console.log(`\n2️⃣  Второе SMS (${phoneNumber2}):`);
    if (result2 && result2.success !== false) {
      console.log(`    ✅ Статус: Отправлено`);
      console.log(`    📝 Message ID: ${result2.messageId}`);
      if (result2.queued) {
        console.log(`    ⚠️  Примечание: В очереди (будет отправлено при переподключении SMPP)`);
      }
    } else {
      console.log(`    ❌ Статус: Ошибка`);
      console.log(`    📝 Ошибка: ${result2.error}`);
    }
    
    const successCount = [result1, result2].filter(r => r && r.success !== false).length;
    
    console.log("\n" + "=".repeat(80));
    console.log(`📈 Отправлено успешно: ${successCount}/2`);
    console.log("=".repeat(80));
    
    if (successCount > 0) {
      console.log("\n📱 ПРОВЕРЬТЕ ВАШИ ТЕЛЕФОНЫ!");
      console.log(`   Сообщение: "${testMessage}"`);
      console.log(`   ${successCount === 2 ? 'Оба SMS должны прийти' : 'Одно SMS должно прийти'}`);
    }
    
    // Keep connection open for 15 seconds to receive delivery receipts
    console.log("\n⏰ Соединение открыто еще 15 секунд для получения отчетов о доставке...");
    await new Promise((resolve) => setTimeout(resolve, 15000));
    
    // Disconnect
    console.log("\n👋 Отключение от SMPP сервера...");
    smppService.disconnect();
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ ТЕСТ ЗАВЕРШЕН");
    console.log("=".repeat(80));
    console.log("\n");
    
    process.exit(successCount > 0 ? 0 : 1);
    
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ ТЕСТ ЗАВЕРШЕН С ОШИБКОЙ");
    console.error("=".repeat(80));
    console.error("\nОшибка:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    console.error("\n");
    process.exit(1);
  }
}

// Run test
console.log("\n🚀 Запуск задержанного SMS теста...\n");
runDelayedTest();
