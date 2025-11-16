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
console.log("📱 SMS BULK TEST SCRIPT");
console.log("=".repeat(80));
console.log("Testing SMPP bulk sending to multiple numbers...");
console.log("=".repeat(80));

// All test phone numbers
const testPhoneNumbers = [
  "+992905504866",
  "+992557777509",
  "+992918365836",
  "+992907620101",
  "+992904631818",
];

console.log("\n📋 Test Numbers:");
testPhoneNumbers.forEach((num, idx) => {
  console.log(`   ${idx + 1}. ${num}`);
});
console.log("\n" + "=".repeat(80));

// Test message
const testMessage = "Тестовое SMS сообщение от Protocol. Система работает! ✅";

async function runBulkTest() {
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
    
    // Send bulk SMS
    console.log("\n📤 SENDING BULK SMS");
    console.log(`   Message: "${testMessage}"`);
    console.log(`   Length: ${testMessage.length} characters`);
    console.log(`   Recipients: ${testPhoneNumbers.length}`);
    console.log("\n" + "-".repeat(80));
    
    const results = await smppService.sendBulkSMS(
      testPhoneNumbers,
      testMessage,
      "normal"
    );
    
    // Display results for each recipient
    console.log("\n📊 RESULTS:\n");
    let successCount = 0;
    let failCount = 0;
    
    results.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.phoneNumber}`);
      if (result.success) {
        console.log(`   ✅ Success`);
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Parts: ${result.parts}`);
        successCount++;
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        failCount++;
      }
      console.log("");
    });
    
    // Summary
    console.log("=".repeat(80));
    console.log("📊 BULK SEND SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Successful: ${successCount}/${testPhoneNumbers.length}`);
    console.log(`❌ Failed: ${failCount}/${testPhoneNumbers.length}`);
    console.log(`📱 Total Recipients: ${testPhoneNumbers.length}`);
    console.log("=".repeat(80));
    
    if (successCount > 0) {
      console.log("\n📱 Check these phones for SMS:");
      results.forEach((result) => {
        if (result.success) {
          console.log(`   - ${result.phoneNumber}`);
        }
      });
    }
    
    // Keep the script running for 30 seconds to receive delivery receipts
    console.log("\n⏰ Keeping connection open for 30 seconds to receive delivery receipts...");
    await new Promise((resolve) => setTimeout(resolve, 30000));
    
    // Disconnect
    console.log("\n👋 Disconnecting from SMPP server...");
    smppService.disconnect();
    
    console.log("✅ Bulk test completed. Exiting.\n");
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ BULK TEST FAILED:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run bulk test
runBulkTest();
