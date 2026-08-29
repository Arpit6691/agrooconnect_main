const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter configured from environment variables.
 * Supports SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 * with fallback to SMTP_EMAIL, SMTP_PASSWORD for backward compatibility.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  const isBrevo = host && (host.includes('brevo') || host.includes('sendinblue'));

  // Diagnostic — visible in Render logs
  console.log('[EMAIL SERVICE] SMTP config check:', {
    SMTP_HOST: host || '(NOT SET)',
    SMTP_PORT: port,
    SMTP_USER: user ? user.substring(0, 5) + '***' : '(NOT SET)',
    SMTP_PASS: pass ? '***set***' : '(NOT SET)',
    provider: isBrevo ? 'Brevo' : (host || 'unknown')
  });

  if (!host || !user || !pass || user === 'test_user' || pass === 'test_password') {
    console.warn('[EMAIL SERVICE] SMTP credentials incomplete — emails will NOT be sent.');
    console.warn('[EMAIL SERVICE] Tip: Render free tier blocks Gmail SMTP. Use Brevo (smtp-relay.brevo.com) instead.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    family: 4,              // Force IPv4
    connectionTimeout: 10000, // 10s — fail fast instead of hanging 2 min
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false  // Handles some Render TLS quirks
    }
  });
};

/**
 * Returns formatted sender string
 */
const getFromAddress = () => {
  const fromName = process.env.FROM_NAME || 'AgroConnect';
  const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || process.env.SMTP_EMAIL || 'noreply@agroconnect.com';
  return `"${fromName}" <${fromEmail}>`;
};

/**
 * Generate AgroConnect branded HTML email template for Deal Confirmation
 */
const generateDealEmailHtml = ({
  recipientRole, // 'Farmer' or 'Trader'
  recipientName,
  counterpartyRole,
  counterpartyName,
  cropName,
  quantity,
  unit,
  agreedPrice,
  totalAmount,
  dealId,
  dealDate
}) => {
  const formattedDate = dealDate ? new Date(dealDate).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const formattedTotal = totalAmount ? Number(totalAmount).toLocaleString('en-IN') : (agreedPrice * quantity).toLocaleString('en-IN');
  const formattedPrice = Number(agreedPrice).toLocaleString('en-IN');

  const headline = recipientRole === 'Farmer'
    ? 'Congratulations! Your Deal is Confirmed'
    : 'Congratulations! Your Purchase Deal is Confirmed';

  const subline = recipientRole === 'Farmer'
    ? `You have agreed to sell your crop listing to ${counterpartyName}.`
    : `Your offer for ${cropName} from ${counterpartyName} has been accepted.`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deal Confirmation - AgroConnect</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      color: #1e293b;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .summary-card {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      border: 1px solid #e2e8f0;
    }
    .summary-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 16px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .summary-row:last-child {
      border-bottom: none;
    }
    .summary-label {
      color: #64748b;
    }
    .summary-value {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .highlight-row {
      background: #dcfce7;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 12px;
    }
    .highlight-row .summary-label {
      color: #166534;
      font-weight: 600;
    }
    .highlight-row .summary-value {
      color: #166534;
      font-size: 18px;
      font-weight: 700;
    }
    .parties-grid {
      display: table;
      width: 100%;
      margin: 20px 0;
    }
    .party-cell {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .party-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #16a34a;
      margin-bottom: 4px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🌱 AgroConnect</h1>
      <p>${headline}</p>
      <div class="badge">Status: Confirmed</div>
    </div>
    <div class="content">
      <p class="greeting">Hello <strong>${recipientName}</strong>,</p>
      <p>${subline}</p>
      
      <div class="summary-card">
        <div class="summary-title">Deal Summary #${dealId ? dealId.toString().slice(-6).toUpperCase() : 'N/A'}</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Product / Crop:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a; font-size: 14px;">${cropName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Quantity:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a; font-size: 14px;">${quantity} ${unit || 'kg'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Agreed Price per Unit:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a; font-size: 14px;">₹${formattedPrice} / ${unit || 'kg'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Confirmation Date:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a; font-size: 14px;">${formattedDate}</td>
          </tr>
          <tr style="border-top: 2px dashed #cbd5e1;">
            <td style="padding: 12px 0 0; color: #166534; font-weight: 700; font-size: 15px;">Total Deal Amount:</td>
            <td style="padding: 12px 0 0; font-weight: 800; text-align: right; color: #166534; font-size: 18px;">₹${formattedTotal}</td>
          </tr>
        </table>
      </div>

      <table style="width: 100%; margin-top: 16px; border-collapse: separate; border-spacing: 8px 0;">
        <tr>
          <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; width: 50%;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #16a34a; margin-bottom: 4px;">Farmer</div>
            <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${recipientRole === 'Farmer' ? recipientName : counterpartyName}</div>
          </td>
          <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; width: 50%;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #16a34a; margin-bottom: 4px;">Trader</div>
            <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${recipientRole === 'Trader' ? recipientName : counterpartyName}</div>
          </td>
        </tr>
      </table>

      <p style="margin-top: 24px; font-size: 14px; color: #475569; line-height: 1.6;">
        You can track delivery, update logistics, and complete payments anytime by logging into your AgroConnect Dashboard.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">This is an automated notification from AgroConnect Marketplace.</p>
      <p style="margin: 4px 0 0;">Empowering sustainable agriculture & direct trade.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate plain-text fallback for Deal Confirmation
 */
const generateDealEmailText = ({
  recipientRole,
  recipientName,
  counterpartyRole,
  counterpartyName,
  cropName,
  quantity,
  unit,
  agreedPrice,
  totalAmount,
  dealId,
  dealDate
}) => {
  const formattedDate = dealDate ? new Date(dealDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const formattedTotal = totalAmount || (agreedPrice * quantity);

  return `
AGROCONNECT - DEAL CONFIRMATION NOTICE
========================================

Hello ${recipientName},

Your deal has been successfully confirmed on AgroConnect!

DEAL DETAILS:
-------------
- Deal ID: ${dealId || 'N/A'}
- Crop: ${cropName}
- Quantity: ${quantity} ${unit || 'kg'}
- Agreed Price: ₹${agreedPrice} per ${unit || 'kg'}
- Total Amount: ₹${formattedTotal}
- Date: ${formattedDate}
- Status: Confirmed / Accepted

PARTIES INVOLVED:
-----------------
- Farmer: ${recipientRole === 'Farmer' ? recipientName : counterpartyName}
- Trader: ${recipientRole === 'Trader' ? recipientName : counterpartyName}

You can track transportation, handover, and payment anytime via your AgroConnect dashboard.

Thank you for choosing AgroConnect!
`.trim();
};

/**
 * Send deal confirmation emails to both Farmer and Trader.
 * Robust, non-blocking, and logs diagnostics.
 *
 * @param {Object} params
 * @param {Object} params.deal - Deal document or object
 * @param {Object} params.crop - Crop object (with cropName, unit)
 * @param {Object} params.farmer - Farmer user object (name, email)
 * @param {Object} params.trader - Trader user object (name, email)
 * @returns {Promise<{ farmerSent: boolean, traderSent: boolean }>}
 */
const sendDealConfirmationEmails = async ({ deal, crop, farmer, trader }) => {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      console.log(`\n[EMAIL SERVICE - DEV] SMTP credentials not configured. Skipped sending deal confirmation email for Deal #${deal?._id}.`);
      console.log(`[EMAIL SERVICE - DEV] Details: Crop: ${crop?.cropName}, Farmer: ${farmer?.email}, Trader: ${trader?.email}, Total: ₹${deal?.finalPrice * deal?.quantity}\n`);
      return { farmerSent: false, traderSent: false, reason: 'SMTP not configured' };
    }

    const cropName = crop?.cropName || 'Crop';
    const quantity = deal?.quantity || crop?.quantity || 1;
    const unit = crop?.unit || 'kg';
    const agreedPrice = deal?.finalPrice || 0;
    const totalAmount = deal?.totalAmount || (agreedPrice * quantity);
    const dealId = deal?._id;
    const dealDate = deal?.createdAt || new Date();

    const fromAddress = getFromAddress();

    if (!farmer?.email) {
      console.warn(`[EMAIL SERVICE] Farmer email is missing — skipping farmer email. Farmer ID: ${farmer?._id}`);
    }
    if (!trader?.email) {
      console.warn(`[EMAIL SERVICE] Trader email is missing — skipping trader email. Trader ID: ${trader?._id}`);
    }

    const sendFarmerPromise = farmer?.email ? transporter.sendMail({
      from: fromAddress,
      to: farmer.email,
      subject: `🌱 Deal Confirmed: ${cropName} - AgroConnect`,
      text: generateDealEmailText({
        recipientRole: 'Farmer',
        recipientName: farmer.name || 'Farmer',
        counterpartyRole: 'Trader',
        counterpartyName: trader?.name || 'Trader',
        cropName,
        quantity,
        unit,
        agreedPrice,
        totalAmount,
        dealId,
        dealDate
      }),
      html: generateDealEmailHtml({
        recipientRole: 'Farmer',
        recipientName: farmer.name || 'Farmer',
        counterpartyRole: 'Trader',
        counterpartyName: trader?.name || 'Trader',
        cropName,
        quantity,
        unit,
        agreedPrice,
        totalAmount,
        dealId,
        dealDate
      })
    }) : Promise.resolve(null);

    const sendTraderPromise = trader?.email ? transporter.sendMail({
      from: fromAddress,
      to: trader.email,
      subject: `🛒 Deal Confirmed: Purchase of ${cropName} - AgroConnect`,
      text: generateDealEmailText({
        recipientRole: 'Trader',
        recipientName: trader.name || 'Trader',
        counterpartyRole: 'Farmer',
        counterpartyName: farmer?.name || 'Farmer',
        cropName,
        quantity,
        unit,
        agreedPrice,
        totalAmount,
        dealId,
        dealDate
      }),
      html: generateDealEmailHtml({
        recipientRole: 'Trader',
        recipientName: trader.name || 'Trader',
        counterpartyRole: 'Farmer',
        counterpartyName: farmer?.name || 'Farmer',
        cropName,
        quantity,
        unit,
        agreedPrice,
        totalAmount,
        dealId,
        dealDate
      })
    }) : Promise.resolve(null);

    const results = await Promise.allSettled([sendFarmerPromise, sendTraderPromise]);

    const farmerResult = results[0];
    const traderResult = results[1];

    if (farmerResult.status === 'fulfilled' && farmerResult.value) {
      console.log(`[EMAIL SERVICE] Deal confirmation email sent to Farmer (${farmer.email}): MessageId ${farmerResult.value.messageId}`);
    } else if (farmerResult.status === 'rejected') {
      console.error(`[EMAIL SERVICE] Failed to send email to Farmer (${farmer?.email}):`, farmerResult.reason?.message || farmerResult.reason);
    }

    if (traderResult.status === 'fulfilled' && traderResult.value) {
      console.log(`[EMAIL SERVICE] Deal confirmation email sent to Trader (${trader.email}): MessageId ${traderResult.value.messageId}`);
    } else if (traderResult.status === 'rejected') {
      console.error(`[EMAIL SERVICE] Failed to send email to Trader (${trader?.email}):`, traderResult.reason?.message || traderResult.reason);
    }

    return {
      farmerSent: farmerResult.status === 'fulfilled',
      traderSent: traderResult.status === 'fulfilled'
    };
  } catch (error) {
    console.error('[EMAIL SERVICE] Unexpected error in sendDealConfirmationEmails:', error.message);
    return { farmerSent: false, traderSent: false, error: error.message };
  }
};

module.exports = {
  sendDealConfirmationEmails,
  generateDealEmailHtml,
  generateDealEmailText
};
