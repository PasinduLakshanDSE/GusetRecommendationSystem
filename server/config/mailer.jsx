const nodemailer = require("nodemailer");

function createMailer() {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return null;
}

async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const transporter = createMailer();
  if (!transporter)
    throw new Error(
      "Email service is not configured. Add Gmail or SMTP credentials to Server/.env.",
    );
  await transporter.sendMail({
    from:
      process.env.MAIL_FROM ||
      `GuestAI Staff Portal <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
    to,
    subject: "Reset your GuestAI staff portal password",
    text: `Hello ${fullName},\n\nReset your GuestAI password within 15 minutes:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Hello ${fullName},</p><p>We received a request to reset your <b>GuestAI Staff Portal</b> password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#007d6e;color:#fff;text-decoration:none;font-weight:700">Reset password</a></p><p>This link expires in <b>15 minutes</b>. If you did not request it, ignore this email.</p>`,
  });
}
module.exports = { sendPasswordResetEmail };
