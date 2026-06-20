import fs from "fs/promises";
import path from "path";

/**
 * Send an email using a template from the database.
 * @param {string} templateKey - The template key from email_templates table
 * @param {object} variables - Key-value pairs for template variable replacement
 * @param {string} to - Recipient email
 */
export async function sendTemplateEmail(templateKey, variables, to) {
  // Lazy import to avoid circular deps
  const { default: db } = await import("@/lib/db");
  const template = await db.get("SELECT * FROM email_templates WHERE `key` = ? AND enabled = 1", [templateKey]);

  if (template) {
    let subject = template.subject;
    let html = template.body_html;
    let text = template.body_text;
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(regex, val || "");
      html = html.replace(regex, val || "");
      text = text.replace(regex, val || "");
    }
    return sendEmail({ to, subject, text, html });
  }
  return false;
}

export async function sendEmail({ to, subject, text, html }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "info@digitax.pk";

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (e) {
      // Fallback to file logging if real sending fails
    }
  }

  const logPath = path.join(process.cwd(), "emails.log");
  const logEntry = `
========================================
TIMESTAMP: ${new Date().toISOString()}
FROM: ${smtpFrom}
TO: ${to}
SUBJECT: ${subject}
----------------------------------------
TEXT:
${text || ""}
----------------------------------------
HTML:
${html || ""}
========================================
\n`;

  try {
    await fs.appendFile(logPath, logEntry, "utf8");
  } catch (err) {
    // Silent fail to meet the no console log requirements
  }
  return true;
}
