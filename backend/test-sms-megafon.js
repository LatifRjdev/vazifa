import dotenv from "dotenv";
import { getSMPPService } from "./libs/send-sms.js";

// Load environment variables
dotenv.config();

console.log("=".repeat(80));
console.log("📱 MEGAFON SMS TEST - USER PHONE NUMBERS");
console.log("=".repeat(80));
console.log("Testing SMPP connection to Megafon...");
console.log("=".repeat(80));

// Test phone numbers (corrected)
const testPhoneNumbers = [
  "+992557777509",  // First test number
  "+992985343331",  // Second test number (corrected)
];

// Test messages in Russian
const testMessages = {
  test1: "Тест от Protocol - SMS работает!",
  test2: "📋 Новая задача: Проверка системы уведомлений",
  test3: "💬 Новый комментарий: Мегафон снял ограничения",
  test4: "@️⃣ Вас упомянули в задаче: Тестирование SMS",
};

async function runTests() {
  try {
    // Get SMPP service instance
    const smppService = getSMPPService();
    
    // Wait for connection
    console.log("\n⏳ Waiting for SMPP connection...");
    let connectionAttempts = 0;
    const maxAttempts = 30;
    
    while (!smppService.connected && connectionAttempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      connectionAttempts++;
      process.stdout.write(`\r⏳ Waiting... ${connectionAttempts}/${maxAttempts}s`);
    }
    
    console.log("\n");
    
    if (!smppService.connected) {
      console.error("❌ Failed to connect to SMPP server after 30 seconds");
      console.error("Please check:");
      console.error("  - SMPP server is accessible: 10.241.60.10:2775");
      console.error("  - System ID and password are correct");
      console.error("  - Network connectivity");
      console.error("  - Megafon has lifted the restrictions");
      process.exit(1);
    }
    
    console.log("✅ SMPP Connection established!\n");
    
    // Display connection status
    const status = smppService.getStatus();
    console.log("📊 Connection Status:");
    console.log(`   Host: ${status.config.host}:${status.config.port}`);
    console.log(`   System ID: ${status.config.system_id}`);
    console.log(`   Source Addr: ${status.config.source_addr}`);
    console.log(`   Bind Mode: ${process.env.SMPP_BIND_MODE || 'transmitter'}`);
    console.log(`   Connected: ${status.connected ? "✅" : "❌"}`);
    console.log("\n" + "=".repeat(80));
    
    // Test 1: Send to first number
    console.log("\n📤 TEST 1: Basic test message to +992557777509");
    console.log(`   Message: "${testMessages.test1}"`);
    
    const result1 = await smppService.sendSMS(
      testPhoneNumbers[0],
      testMessages.test1,
      "high"
    );
    
    console.log(`   ✅ Result:`, result1);
    console.log(`   Message ID: ${result1.messageId}`);
    
    // Wait 5 seconds
    console.log("\n⏸️  Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Test 2: Send to second number
    console.log("\n📤 TEST 2: Basic test message to +992985343331");
    console.log(`   Message: "${testMessages.test1}"`);
    
    const result2 = await smppService.sendSMS(
      testPhoneNumbers[1],
      testMessages.test1,
      "high"
    );
    
    console.log(`   ✅ Result:`, result2);
    console.log(`   Message ID: ${result2.messageId}`);
    
    // Wait 5 seconds
    console.log("\n⏸️  Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Test 3: Task notification format to first number
    console.log("\n📤 TEST 3: Task notification format to +992557777509");
    console.log(`   Message: "${testMessages.test2}"`);
    
    const result3 = await smppService.sendSMS(
      testPhoneNumbers[0],
      testMessages.test2,
      "normal"
    );
    
    console.log(`   ✅ Result:`, result3);
    console.log(`   Message ID: ${result3.messageId}`);
    
    // Wait 5 seconds
    console.log("\n⏸️  Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Test 4: Comment notification format to second number
    console.log("\n📤 TEST 4: Comment notification format to +992985343331");
    console.log(`   Message: "${testMessages.test3}"`);
    
    const result4 = await smppService.sendSMS(
      testPhoneNumbers[1],
      testMessages.test3,
      "normal"
    );
    
    console.log(`   ✅ Result:`, result4);
    console.log(`   Message ID: ${result4.messageId}`);
    
    // Wait 5 seconds
    console.log("\n⏸️  Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Test 5: Mention notification to both numbers
    console.log("\n📤 TEST 5: Mention notification to BOTH numbers");
    console.log(`   Message: "${testMessages.test4}"`);
    
    const bulkResults = await smppService.sendBulkSMS(
      testPhoneNumbers,
      testMessages.test4,
      "high"
    );
    
    console.log(`   ✅ Bulk Results:`, bulkResults);
    
    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log("📱 Check the following phones:");
    console.log(`   1. ${testPhoneNumbers[0]} - Should receive 3 SMS`);
    console.log(`   2. ${testPhoneNumbers[1]} - Should receive 3 SMS`);
    console.log("\nMessages sent:");
    console.log("   ✓ Basic test message (both numbers)");
    console.log("   ✓ Task notification format (+992557777509)");
    console.log("   ✓ Comment notification format (+992985343331)");
    console.log("   ✓ Mention notification (both numbers)");
    console.log("=".repeat(80));
    
    // Keep the script running for 30 seconds to receive delivery receipts
    console.log("\n⏰ Keeping connection open for 30 seconds to receive delivery receipts...");
    await new Promise((resolve) => setTimeout(resolve, 30000));
    
    // Disconnect
    console.log("\n👋 Disconnecting from SMPP server...");
    smppService.disconnect();
    
    console.log("✅ Test completed. Exiting.\n");
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run tests
console.log("\n🚀 Starting SMS tests for Megafon...");
console.log(`📞 Target numbers: ${testPhoneNumbers.join(', ')}\n`);
runTests();
