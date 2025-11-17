const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,              // smtp.zoho.com
  port: Number(process.env.SMTP_PORT),      // 587
  secure: false,                            // MUST be false for Zoho on port 587
  auth: {
    user: process.env.SMTP_USER,            // your Zoho email
    pass: process.env.SMTP_PASS,            // Zoho App Password
  },
  requireTLS: true,                         // force STARTTLS
  tls: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: false               // required for Render (Zoho cert mismatch)
  }
});

/**
 * Sends an email using Zoho SMTP
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send error:", err);
    throw err;
  }
};
