import dotenv from "dotenv";
import { getSMPPService } from "./libs/send-sms.js";

// Load environment variables
dotenv.config();

console.log("=".repeat(80));
console.log("📱 SMS TEST: Two Numbers");
console.log("=".repeat(80));
console.log("Testing SMS delivery to 2 phone numbers");
console.log("=".repeat(80));

// Test phone numbers
const phoneNumbers = [
  "+992557777509",
  "+992985343331"
];

// Generate random verification code
const verificationCode = Math.floor(100000 + Math.random() * 900000);

// Test message
const testMessage = `Тест SMS от Protocol. Ваш код: ${verificationCode}`;

async function runTest() {
  try {
    console.log("\n📋 Test Configuration:");
    console.log(`   Numbers: ${phoneNumbers.join(", ")}`);
    console.log(`   Message: "${testMessage}"`);
    console.log(`   Code: ${verificationCode}`);
    console.log("\n" + "=".repeat(80));
    
    // Get SMPP service instance
    console.log("\n🔌 Connecting to SMPP server...");
    const smppService = getSMPPService();
    
    // Wait for connection
    let connectionAttempts = 0;
    const maxAttempts = 30;
    
    while (!smppService.connected && connectionAttempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      connectionAttempts++;
      process.stdout.write(`\r⏳ Waiting for connection... ${connectionAttempts}/${maxAttempts}s`);
    }
    
    console.log("\n");
    
    if (!smppService.connected) {
      console.error("\n❌ FAILED TO CONNECT TO SMPP SERVER");
      console.error("\n🔍 Please check:");
      console.error("   1. SMPP server is accessible:");
      console.error("      telnet 10.241.60.10 2775");
      console.error("   2. Credentials in backend/.env:");
      console.error("      SMPP_SYSTEM_ID=Rushdie_Roh");
      console.error("      SMPP_PASSWORD=J7PCez");
      console.error("   3. PM2 logs:");
      console.error("      pm2 logs vazifa-backend | grep SMPP");
      console.error("\n");
      process.exit(1);
    }
    
    console.log("✅ SMPP Connected!\n");
    
    // Display connection status
    const status = smppService.getStatus();
    console.log("📊 Connection Status:");
    console.log(`   Host: ${status.config.host}:${status.config.port}`);
    console.log(`   System ID: ${status.config.system_id}`);
    console.log(`   Source: ${status.config.source_addr}`);
    console.log(`   Status: ${status.connected ? "✅ Connected" : "❌ Disconnected"}`);
    console.log("\n" + "=".repeat(80));
    
    // Send SMS to both numbers
    const results = [];
    
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i];
      
      console.log(`\n📤 Sending SMS ${i + 1}/2`);
      console.log(`   To: ${phoneNumber}`);
      console.log(`   Message: "${testMessage}"`);
      
      try {
        const result = await smppService.sendSMS(
          phoneNumber,
          testMessage,
          "high"
        );
        
        console.log(`   ✅ SUCCESS!`);
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Parts: ${result.parts}`);
        console.log(`   Queued: ${result.queued ? "Yes" : "No"}`);
        
        results.push({
          phoneNumber,
          success: true,
          messageId: result.messageId,
          parts: result.parts,
          queued: result.queued
        });
        
      } catch (error) {
        console.error(`   ❌ FAILED: ${error.message}`);
        
        results.push({
          phoneNumber,
          success: false,
          error: error.message
        });
      }
      
      // Wait 3 seconds between sends
      if (i < phoneNumbers.length - 1) {
        console.log("\n   ⏸️  Waiting 3 seconds before next SMS...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    
    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 TEST RESULTS SUMMARY");
    console.log("=".repeat(80));
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`\n✅ Successful: ${successCount}/${phoneNumbers.length}`);
    console.log(`❌ Failed: ${failCount}/${phoneNumbers.length}`);
    
    console.log("\n📋 Details:");
    results.forEach((result, index) => {
      console.log(`\n   ${index + 1}. ${result.phoneNumber}`);
      if (result.success) {
        console.log(`      Status: ✅ Sent`);
        console.log(`      Message ID: ${result.messageId}`);
        console.log(`      Parts: ${result.parts}`);
        if (result.queued) {
          console.log(`      Note: ⚠️ Queued (will be sent when SMPP reconnects)`);
        }
      } else {
        console.log(`      Status: ❌ Failed`);
        console.log(`      Error: ${result.error}`);
      }
    });
    
    console.log("\n" + "=".repeat(80));
    
    if (successCount > 0) {
      console.log("\n📱 CHECK YOUR PHONES!");
      console.log("   You should receive SMS with verification code:");
      console.log(`   Code: ${verificationCode}`);
      console.log("   Message: \"Тест SMS от Protocol. Ваш код: XXXXXX\"");
    }
    
    // Keep connection open for 20 seconds to receive delivery receipts
    console.log("\n⏰ Keeping connection open for 20 seconds...");
    console.log("   (Waiting for delivery receipts from SMPP server)");
    await new Promise((resolve) => setTimeout(resolve, 20000));
    
    // Disconnect
    console.log("\n👋 Disconnecting from SMPP server...");
    smppService.disconnect();
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ TEST COMPLETED");
    console.log("=".repeat(80));
    
    if (successCount === phoneNumbers.length) {
      console.log("\n🎉 All SMS sent successfully!");
    } else if (successCount > 0) {
      console.log(`\n⚠️  ${successCount} SMS sent, ${failCount} failed`);
    } else {
      console.log("\n❌ All SMS failed to send");
      console.log("\n🔍 Troubleshooting:");
      console.log("   1. Check SMPP connection in PM2 logs");
      console.log("   2. Verify SMPP credentials");
      console.log("   3. Check network connectivity to SMPP server");
    }
    
    console.log("\n");
    process.exit(successCount > 0 ? 0 : 1);
    
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ TEST FAILED WITH ERROR");
    console.error("=".repeat(80));
    console.error("\nError:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    console.error("\n");
    process.exit(1);
  }
}

// Run test
console.log("\n🚀 Starting SMS test...\n");
runTest();
