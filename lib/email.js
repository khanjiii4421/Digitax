import fs from "fs/promises";
import path from "path";

/**
 * Send an email using a template from the database.
 * @param {string} templateKey - The template key from email_templates table
 * @param {object} variables - Key-value pairs for template variable replacement
 * @param {string} to - Recipient email
 */
export async function sendTemplateEmail(templateKey, variables = {}, to) {
  try {
    // Lazy import to avoid circular deps
    const { default: db } = await import("@/lib/db");
    const template = await db.get("SELECT * FROM email_templates WHERE `key` = ? AND enabled = 1", [templateKey]);

    if (template) {
      let subject = template.subject || "Notification from DIGITAX";
      let html = template.body_html || "";
      let text = template.body_text || "";
      for (const [key, val] of Object.entries(variables || {})) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        subject = subject.replace(regex, val || "");
        html = html.replace(regex, val || "");
        text = text.replace(regex, val || "");
      }
      return await sendEmail({ to, subject, text, html });
    }
  } catch (err) {
    // Fallback gracefully
  }
  return false;
}

/**
 * Build a responsive, officially branded HTML email for status updates & notifications.
 */
export function buildStatusNotificationEmail({
  recipientName = "Valued Client",
  title = "Application Status Update",
  subtitle = "DIGITAX Application Notification",
  status = "In Review",
  statusLabel = "In Review",
  statusType = "info", // 'approved' | 'rejected' | 'pending' | 'info'
  message = "",
  adminNotes = "",
  details = [],
  actionUrl = "https://digitax.pk/portal/applications",
  actionText = "View Application",
  siteSettings = {}
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://digitax.pk";
  const fullActionUrl = actionUrl.startsWith("http") ? actionUrl : `${baseUrl}${actionUrl.startsWith("/") ? "" : "/"}${actionUrl}`;

  let headerGradient = "linear-gradient(135deg, #0056A8 0%, #0077cc 100%)";
  let statusBadgeBg = "#eff6ff";
  let statusBadgeColor = "#1e40af";
  let ctaBg = "#0056A8";

  const lower = (status || "").toLowerCase();
  if (statusType === "approved" || lower.includes("complet") || lower.includes("approv") || lower.includes("verif")) {
    headerGradient = "linear-gradient(135deg, #0f766e 0%, #16a34a 100%)";
    statusBadgeBg = "#dcfce7";
    statusBadgeColor = "#15803d";
    ctaBg = "#16a34a";
  } else if (statusType === "rejected" || lower.includes("reject") || lower.includes("cancel")) {
    headerGradient = "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)";
    statusBadgeBg = "#fee2e2";
    statusBadgeColor = "#b91c1c";
    ctaBg = "#dc2626";
  } else if (lower.includes("progress") || lower.includes("review") || lower.includes("process") || lower.includes("pend")) {
    headerGradient = "linear-gradient(135deg, #003f7d 0%, #0056A8 100%)";
    statusBadgeBg = "#fef3c7";
    statusBadgeColor = "#b45309";
    ctaBg = "#0056A8";
  }

  const safeNotes = adminNotes ? String(adminNotes).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') : '';
  const rowsHtml = details.map(d => `
    <tr>
      <td style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:600;width:38%;">${d.label}</td>
      <td style="padding:10px 14px;background:#ffffff;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:${d.bold ? '700' : '500'};">${d.value}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background:${headerGradient};padding:36px 32px 30px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <div style="display:inline-block;background:#ffffff;border-radius:12px;padding:8px 20px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:middle;padding-right:8px;">
                            <div style="width:26px;height:26px;background:#0056A8;border-radius:50%;text-align:center;line-height:26px;color:#ffffff;font-size:14px;font-weight:900;">D</div>
                          </td>
                          <td style="vertical-align:middle;">
                            <span style="font-size:18px;font-weight:900;color:#0056A8;letter-spacing:-0.5px;">DIGITAX</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;">${title}</h1>
                    <p style="color:rgba(255,255,255,0.9);font-size:13px;margin:0;font-weight:500;">${subtitle}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 8px;">Dear ${recipientName},</p>
              <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">${message}</p>

              <!-- Status Badge Pill -->
              <div style="background:${statusBadgeBg};border:1px solid ${statusBadgeColor}33;border-radius:12px;padding:14px 18px;margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;">
                <div>
                  <span style="font-size:11px;color:${statusBadgeColor};text-transform:uppercase;font-weight:800;letter-spacing:0.8px;display:block;margin-bottom:2px;">Current Status</span>
                  <span style="font-size:15px;color:${statusBadgeColor};font-weight:800;">${statusLabel}</span>
                </div>
              </div>

              ${safeNotes ? `
              <!-- Consultant / Admin Notes -->
              <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:16px 18px;margin-bottom:22px;">
                <div style="font-size:11px;color:#92400e;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Important Remarks / Reason:</div>
                <div style="font-size:13px;color:#78350f;line-height:1.6;font-weight:500;">${safeNotes}</div>
              </div>
              ` : ''}

              ${rowsHtml ? `
              <!-- Details Table -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:26px;border-radius:10px;overflow:hidden;">
                ${rowsHtml}
              </table>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${fullActionUrl}" style="display:inline-block;background:${ctaBg};color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 36px;border-radius:12px;box-shadow:0 6px 18px rgba(0,86,168,0.28);letter-spacing:0.3px;">${actionText} &rarr;</a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;line-height:1.6;">
                Need assistance? Our tax advisors are available 24/7 on WhatsApp or via our online client portal.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="font-size:14px;font-weight:800;color:#ffffff;margin:0 0 4px;letter-spacing:0.5px;">DIGITAX (PVT) LIMITED</p>
              <p style="font-size:11px;color:#94a3b8;margin:0 0 10px;">Pakistan's Premier Corporate & Tax Advisory Portal</p>
              <p style="font-size:11px;color:#64748b;margin:0;">
                <a href="${baseUrl}" style="color:#38bdf8;text-decoration:none;font-weight:600;">Website</a> &nbsp;&bull;&nbsp;
                <a href="${baseUrl}/portal" style="color:#38bdf8;text-decoration:none;font-weight:600;">Client Portal</a> &nbsp;&bull;&nbsp;
                <a href="mailto:info@digitax.pk" style="color:#38bdf8;text-decoration:none;font-weight:600;">info@digitax.pk</a> &nbsp;&bull;&nbsp;
                <a href="tel:+923491887803" style="color:#38bdf8;text-decoration:none;font-weight:600;">+92 349 1887803</a>
              </p>
              <p style="font-size:10px;color:#475569;margin:12px 0 0;">&copy; 2018&ndash;2026 Digitax (Pvt) Limited. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendEmail({ to, subject, text, html }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || "info@digitax.pk";
  const isProduction = process.env.NODE_ENV === "production";

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
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
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
      console.error("[SMTP Error] Failed to send email via SMTP:", e.message);
    }
  } else if (isProduction) {
    console.warn("[SMTP Warning] Production email credentials not fully configured in .env");
  }

  // Development-only file logging fallback
  if (!isProduction) {
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
========================================
\n`;

    try {
      await fs.appendFile(logPath, logEntry, "utf8");
    } catch (err) {
      // Ignore dev log file write failure
    }
  }

  return true;
}
