import dotenv from "dotenv";
import { getSMPPService } from "./libs/send-sms.js";

// Load environment variables
dotenv.config();

// Set SMPP credentials if not in .env
process.env.SMPP_HOST = process.env.SMPP_HOST || "10.241.60.10";
process.env.SMPP_PORT = process.env.SMPP_PORT || "2775";
process.env.SMPP_SYSTEM_ID = process.env.SMPP_SYSTEM_ID || "Rushdie_Roh";
process.env.SMPP_PASSWORD = process.env.SMPP_PASSWORD || "J7PCez";
process.env.SMPP_SYSTEM_TYPE = process.env.SMPP_SYSTEM_TYPE || "smpp";
process.env.SMPP_SOURCE_ADDR = process.env.SMPP_SOURCE_ADDR || "Protocol";

console.log("=".repeat(80));
console.log("📱 SMS TEST SCRIPT");
console.log("=".repeat(80));
console.log("Testing SMPP connection to Megafon...");
console.log("=".repeat(80));

// Test phone numbers
const testPhoneNumbers = [
  "+992905504866",
  "+992557777509",
  "+992918365836",
  "+992907620101",
  "+992904631818",
];

// Primary test number (changed to user's phone)
const testPhoneNumber = "+992905504866";

// Test messages
const testMessages = {
  short: "Тест SMS от Protocol. Привет! 👋",
  long: "Это длинное тестовое сообщение для проверки разделения SMS на несколько частей. Текст содержит более 70 символов для UCS2 кодировки.",
  russian: "Добрый день! Это тестовое SMS сообщение от системы Protocol. Спасибо!",
  tajik: "Салом! Ин паёми тестии SMS аз системаи Protocol аст. Раҳмат!",
};

async function runTests() {
  try {
    // Get SMPP service instance
    const smppService = getSMPPService();
    
    // Wait for connection
    console.log("\n⏳ Waiting for SMPP connection...");
    let connectionAttempts = 0;
    const maxAttempts = 20;
    
    while (!smppService.connected && connectionAttempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      connectionAttempts++;
      process.stdout.write(`\r⏳ Waiting... ${connectionAttempts}/${maxAttempts}s`);
    }
    
    console.log("\n");
    
    if (!smppService.connected) {
      console.error("❌ Failed to connect to SMPP server after 20 seconds");
      console.error("Please check:");
      console.error("  - SMPP server is accessible: 10.241.60.10:2775");
      console.error("  - System ID and password are correct");
      console.error("  - Network connectivity");
      process.exit(1);
    }
    
    console.log("✅ SMPP Connection established!\n");
    
    // Display connection status
    const status = smppService.getStatus();
    console.log("📊 Connection Status:");
    console.log(`   Host: ${status.config.host}:${status.config.port}`);
    console.log(`   System ID: ${status.config.system_id}`);
    console.log(`   Source Addr: ${status.config.source_addr}`);
    console.log(`   Connected: ${status.connected ? "✅" : "❌"}`);
    console.log("\n" + "=".repeat(80));
    
    // Test 1: Short message
    console.log("\n📤 TEST 1: Short message (Russian)");
    console.log(`   Message: "${testMessages.short}"`);
    console.log(`   Length: ${testMessages.short.length} characters`);
    
    const result1 = await smppService.sendSMS(
      testPhoneNumber,
      testMessages.short,
      "high"
    );
    
    console.log(`   ✅ Result:`, result1);
    console.log(`   Message ID: ${result1.messageId}`);
    console.log(`   Parts: ${result1.parts}`);
    
    // Wait 5 seconds before next test
    console.log("\n⏸️  Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Test 2: Russian message
    console.log("\n📤 TEST 2: Russian message");
    console.log(`   Message: "${testMessages.russian}"`);
    console.log(`   Length: ${testMessages.russian.length} characters`);
    
    const result2 = await smppService.sendSMS(
      testPhoneNumber,
      testMessages.russian,
      "normal"
    );
    
    console.log(`   ✅ Result:`, result2);
    console.log(`   Message ID: ${result2.messageId}`);
    console.log(`   Parts: ${result2.parts}`);
    
    // Wait 5 seconds before next test
    console.log("\n⏸️  Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Test 3: Tajik message
    console.log("\n📤 TEST 3: Tajik message");
    console.log(`   Message: "${testMessages.tajik}"`);
    console.log(`   Length: ${testMessages.tajik.length} characters`);
    
    const result3 = await smppService.sendSMS(
      testPhoneNumber,
      testMessages.tajik,
      "normal"
    );
    
    console.log(`   ✅ Result:`, result3);
    console.log(`   Message ID: ${result3.messageId}`);
    console.log(`   Parts: ${result3.parts}`);
    
    // Wait 5 seconds before next test
    console.log("\n⏸️  Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // Test 4: Long message (multi-part)
    console.log("\n📤 TEST 4: Long message (multi-part)");
    console.log(`   Message: "${testMessages.long}"`);
    console.log(`   Length: ${testMessages.long.length} characters`);
    console.log(`   Expected parts: ${Math.ceil(testMessages.long.length / 70)}`);
    
    const result4 = await smppService.sendSMS(
      testPhoneNumber,
      testMessages.long,
      "low"
    );
    
    console.log(`   ✅ Result:`, result4);
    console.log(`   Message ID: ${result4.messageId}`);
    console.log(`   Parts: ${result4.parts}`);
    
    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log("📱 Check your phone:", testPhoneNumber);
    console.log("   You should receive 4 SMS messages:");
    console.log("   1. Short message with emoji");
    console.log("   2. Russian message");
    console.log("   3. Tajik message");
    console.log("   4. Long message (multiple parts)");
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
runTests();
