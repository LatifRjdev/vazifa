import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import fs from "fs";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const fromEmail = process.env.SENDGRID_FROM_EMAIL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sendEmail = async (
  to,
  subject,
  name,
  message,
  buttonText,
  buttonLink
) => {
  const filePath = join(__dirname, "../template/email-template.html");
  let html = fs.readFileSync(filePath, "utf8");

  html = html
    .replace("{{name}}", name)
    .replace("{{message}}", message)
    .replace("{{buttonText}}", buttonText)
    .replace("{{buttonLink}}", buttonLink)
    .replace("{{year}}", new Date().getFullYear());

  const msg = {
    to,
    from: `Vazifa <${fromEmail}>`,
    subject,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent successfully");

    return true;
  } catch (error) {
    console.error("Error sending email:", error);

    return false;
  }
};
