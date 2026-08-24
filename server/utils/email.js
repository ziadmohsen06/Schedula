const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const nodemailer = require('nodemailer');
const { getEmailTheme } = require('./emailTheme');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"Schedula Garden" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

// Themed HTML shell — matches whichever of the four in-app themes the
// recipient has selected (via `themeName`), defaulting to garden.
const renderEmailShell = ({ heading, subheading, bodyHtml, footerText, themeName }) => {
  const t = getEmailTheme(themeName);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body {
        font-family: 'Inter', Arial, sans-serif;
        background-color: ${t.pageBg};
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 500px;
        margin: 40px auto;
        background: ${t.panelBg};
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      }
      .header {
        background: linear-gradient(135deg, ${t.primary} 0%, ${t.dark} 100%);
        padding: 40px 30px;
        text-align: center;
      }
      .header h1 {
        color: white;
        margin: 10px 0 0 0;
        font-size: 28px;
        font-weight: 700;
      }
      .header p {
        color: rgba(255, 255, 255, 0.9);
        margin: 5px 0 0 0;
        font-size: 14px;
      }
      .leaf-icon {
        font-size: 50px;
        display: block;
      }
      .content {
        padding: 40px 30px;
      }
      .info-text {
        color: ${t.textSecondary};
        font-size: 14px;
        line-height: 1.6;
        margin: 15px 0;
      }
      .task-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .task-list li {
        background: ${t.pageBg};
        border-left: 3px solid ${t.primary};
        border-radius: 8px;
        padding: 10px 15px;
        margin: 8px 0;
        font-size: 14px;
        color: ${t.textStrong};
      }
      .task-list li.overdue {
        border-left-color: #E57373;
      }
      .otp-box {
        background: linear-gradient(135deg, ${t.pageBg} 0%, ${t.panelBg} 100%);
        border: 2px dashed ${t.primary};
        border-radius: 15px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
      }
      .otp-code {
        font-size: 36px;
        font-weight: 700;
        color: ${t.dark};
        letter-spacing: 8px;
        margin: 0;
      }
      .section-title {
        color: ${t.dark};
        font-size: 15px;
        font-weight: 700;
        margin: 25px 0 10px 0;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: ${t.textSecondary};
        font-size: 12px;
        border-top: 1px solid #E0E0E0;
      }
      .highlight {
        color: ${t.dark};
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <span class="leaf-icon">${t.logoEmoji}</span>
        <h1>Schedula</h1>
        <p>${subheading || t.tagline}</p>
      </div>
      <div class="content">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>${footerText || t.footerTagline}</p>
        <p>© 2026 Schedula. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;
};

module.exports = { transporter, sendEmail, renderEmailShell };
