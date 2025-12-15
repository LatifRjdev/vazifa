import { getSMPPService } from "./libs/send-sms.js";

console.log("=".repeat(80));
console.log("📱 SMS TEST: Three Numbers");
console.log("=".repeat(80));
console.log("Testing SMS delivery to 3 phone numbers");
console.log("=".repeat(80));
console.log();

const numbers = ["+992557777509", "+992985343331", "+992905504866", "+992999090090"];
const message = "Привет Тест СМС2";

console.log("🚀 Starting SMS test...");
console.log();
console.log();
console.log("📋 Test Configuration:");
console.log(`   Numbers: ${numbers.join(", ")}`);
console.log(`   Message: "${message}"`);
console.log();
console.log("=".repeat(80));
console.log();

// Wait for SMPP initialization
console.log("⏳ Waiting for SMPP initialization...");
await new Promise((resolve) => setTimeout(resolve, 3000));

const smppService = getSMPPService();

try {
  console.log("🔌 Connecting to SMPP server...");
  
  // Send SMS to all three numbers
  const results = await smppService.sendBulkSMS(numbers, message, "high");
  
  console.log();
  console.log("=".repeat(80));
  console.log("📊 RESULTS:");
  console.log("=".repeat(80));
  
  results.forEach((result, index) => {
    console.log();
    console.log(`📱 Number ${index + 1}: ${result.phoneNumber}`);
    if (result.success) {
      if (result.queued) {
        console.log(`   ✅ SMS queued successfully!`);
        console.log(`   Job ID: ${result.jobId}`);
        console.log(`   ⚠️  Will be sent when SMPP connects`);
      } else {
        console.log(`   ✅ SMS sent successfully!`);
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Parts: ${result.parts || 1}`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  });
  
  console.log();
  console.log("=".repeat(80));
  
  const allSuccess = results.every((r) => r.success);
  if (allSuccess) {
    console.log();
    console.log("🎉 All SMS processed successfully!");
    console.log();
  } else {
    console.log();
    console.log("⚠️  Some SMS failed. Check details above.");
    console.log();
  }
} catch (error) {
  console.error();
  console.error("❌ TEST FAILED");
  console.error();
  console.error("Error:", error.message);
  console.error();
  process.exit(1);
}

// Keep process alive for a bit to see connection logs
setTimeout(() => {
  process.exit(0);
}, 2000);
