const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Mock transporter for development if no real SMTP details are provided
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || 'test_user',
      pass: process.env.SMTP_PASSWORD || 'test_password'
    }
  });

  const message = {
    from: `${process.env.FROM_NAME || 'AgroConnect'} <${process.env.FROM_EMAIL || 'noreply@agroconnect.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    // Do not throw error here to allow the app to continue functioning in dev mode
  }
};

module.exports = sendEmail;
