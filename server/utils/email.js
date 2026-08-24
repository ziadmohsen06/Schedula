const nodemailer = require('nodemailer');

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

// Shared "garden" theme shell, matching the password-reset email style.
const renderEmailShell = ({ heading, subheading, bodyHtml, footerText }) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body {
        font-family: 'Inter', Arial, sans-serif;
        background-color: #F4FAF3;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 500px;
        margin: 40px auto;
        background: #FCFFFC;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(63, 143, 90, 0.15);
      }
      .header {
        background: linear-gradient(135deg, #69C37D 0%, #3F8F5A 100%);
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
        color: #6C7A6D;
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
        background: #F4FAF3;
        border-left: 3px solid #69C37D;
        border-radius: 8px;
        padding: 10px 15px;
        margin: 8px 0;
        font-size: 14px;
        color: #2E4A34;
      }
      .task-list li.overdue {
        border-left-color: #E57373;
      }
      .section-title {
        color: #3F8F5A;
        font-size: 15px;
        font-weight: 700;
        margin: 25px 0 10px 0;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: #6C7A6D;
        font-size: 12px;
        border-top: 1px solid #E0E0E0;
      }
      .highlight {
        color: #3F8F5A;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <span class="leaf-icon">🌿</span>
        <h1>Schedula</h1>
        <p>${subheading || 'Your Productivity Garden'}</p>
      </div>
      <div class="content">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>${footerText || '🌱 Grow every day with Schedula'}</p>
        <p>© 2026 Schedula. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

module.exports = { transporter, sendEmail, renderEmailShell };
