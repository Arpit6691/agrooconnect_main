const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  // If no real SMTP credentials are configured, skip email sending.
  // The OTP is already printed to the backend terminal for development use.
  if (!smtpHost || !smtpEmail || !smtpPassword ||
      smtpEmail === 'test_user' || smtpPassword === 'test_password') {
    console.log(`\n[DEV] Email skipped - no SMTP configured. OTP already shown in console above.\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: smtpEmail,
      pass: smtpPassword
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'AgroConnect'} <${process.env.FROM_EMAIL || smtpEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Email sending failed (non-fatal):', error.message);
    // Non-fatal: OTP is still shown in console
  }
};

module.exports = sendEmail;
