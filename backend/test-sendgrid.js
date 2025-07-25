import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const testSendGrid = async () => {
  console.log("🔧 Testing SendGrid Configuration...");
  
  // Check if API key is set
  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ SENDGRID_API_KEY is not set in .env file");
    return;
  }
  
  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error("❌ SENDGRID_FROM_EMAIL is not set in .env file");
    return;
  }
  
  console.log("✅ Environment variables found:");
  console.log(`   API Key: ${process.env.SENDGRID_API_KEY.substring(0, 10)}...`);
  console.log(`   From Email: ${process.env.SENDGRID_FROM_EMAIL}`);
  
  // Set API key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // Test email
  const msg = {
    to: process.env.SENDGRID_FROM_EMAIL, // Send to yourself for testing
    from: `Vazifa Test <${process.env.SENDGRID_FROM_EMAIL}>`,
    subject: 'SendGrid Test Email',
    text: 'This is a test email to verify SendGrid configuration.',
    html: '<p>This is a <strong>test email</strong> to verify SendGrid configuration.</p>',
  };
  
  try {
    console.log("📧 Sending test email...");
    await sgMail.send(msg);
    console.log("✅ Test email sent successfully!");
    console.log("📬 Check your inbox for the test email.");
  } catch (error) {
    console.error("❌ Error sending test email:");
    
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Body:", JSON.stringify(error.response.body, null, 2));
      
      if (error.response.status === 401) {
        console.error("\n🔑 API Key Issue:");
        console.error("   - Your SendGrid API key may be invalid or expired");
        console.error("   - Please generate a new API key from SendGrid dashboard");
      } else if (error.response.status === 403) {
        console.error("\n📧 Email Issue:");
        console.error("   - The from email may not be verified in SendGrid");
        console.error("   - Please verify your sender email in SendGrid dashboard");
      }
    } else {
      console.error("   Error:", error.message);
    }
  }
};

console.log("🚀 SendGrid Configuration Test");
console.log("================================");
testSendGrid().then(() => {
  console.log("\n📋 Next Steps:");
  console.log("1. If the test failed, update your SendGrid API key");
  console.log("2. Verify your sender email in SendGrid dashboard");
  console.log("3. Make sure your SendGrid account is active");
  process.exit(0);
}).catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
});
