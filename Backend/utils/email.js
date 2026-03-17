require('dotenv').config();
const https = require('https');

async function sendBrevoEmail({ to, subject, html }) {
  const data = JSON.stringify({
    sender: { name: 'Lockify', email: 'fflashh99@gmail.com' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Email sent successfully');
          resolve(body);
        } else {
          console.error('❌ Email failed:', body);
          reject(new Error(body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendOtpEmail(toEmail, otp, type = 'verify') {
  const subjects = {
    verify: 'Verify your Lockify account',
    login: 'Your Lockify login code',
    reset: 'Reset your Lockify password',
  };

  const labels = {
    verify: 'confirm your account',
    login: 'sign in to your account',
    reset: 'reset your password',
  };

  await sendBrevoEmail({
    to: toEmail,
    subject: subjects[type] || subjects.verify,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
        <div style="margin-bottom:24px;">
          <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
        </div>
        <h2 style="color:#ffffff;margin-bottom:8px;">Your verification code</h2>
        <p style="color:#8892b0;margin-bottom:24px;">Use this code to ${labels[type] || labels.verify}:</p>
        <div style="background:#1a1f3a;border:1px solid #2a3050;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:2.5rem;font-weight:700;letter-spacing:12px;color:#5e81f4;font-family:monospace;">${otp}</span>
        </div>
        <p style="color:#4a5270;font-size:0.85rem;">This code expires in <strong style="color:#8892b0;">10 minutes</strong>. Never share it with anyone.</p>
        <hr style="border:none;border-top:1px solid #1a1f3a;margin:24px 0;" />
        <p style="color:#4a5270;font-size:0.75rem;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

async function sendSecurityAlertEmail(toEmail, userName, alertType, details = {}) {
  const alerts = {
    new_login: { subject: 'New Login to Your Lockify Account', icon: '🔐', title: 'New Login Detected', message: 'We detected a new login to your account' },
    failed_attempt: { subject: 'Failed Login Attempt - Lockify', icon: '⚠️', title: 'Failed Login Attempt', message: 'There was a failed attempt to login' },
    password_changed: { subject: 'Password Changed - Lockify', icon: '🔑', title: 'Password Successfully Changed', message: 'Your account password was recently changed' },
    account_deleted: { subject: 'Account Deleted - Lockify', icon: '🗑️', title: 'Account Deleted', message: 'Your account has been permanently deleted' },
  };

  const alert = alerts[alertType] || alerts.new_login;

  await sendBrevoEmail({
    to: toEmail,
    subject: alert.subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
        <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
        <div style="text-align:center;margin:24px 0;">
          <div style="font-size:3rem;">${alert.icon}</div>
          <h2 style="color:#ffffff;">${alert.title}</h2>
          <p style="color:#8892b0;">${alert.message}</p>
        </div>
        <p style="color:#4a5270;font-size:0.75rem;">Time: ${new Date().toLocaleString()}</p>
      </div>
    `,
  });
}

async function sendWeakPasswordAlertEmail(toEmail, userName, weakPasswords = []) {
  await sendBrevoEmail({
    to: toEmail,
    subject: 'Weak Passwords Detected - Lockify Security Alert',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
        <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
        <h2 style="color:#ffffff;margin-top:24px;">Weak Passwords Detected</h2>
        <p style="color:#8892b0;">We found ${weakPasswords.length} password(s) that need your attention.</p>
      </div>
    `,
  });
}

async function sendPasswordExpiryEmail(toEmail, userName, expiredPasswords = []) {
  await sendBrevoEmail({
    to: toEmail,
    subject: 'Password Update Reminder - Lockify',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
        <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
        <h2 style="color:#ffffff;margin-top:24px;">Password Update Reminder</h2>
        <p style="color:#8892b0;">You have ${expiredPasswords.length} password(s) older than 90 days.</p>
      </div>
    `,
  });
}

async function sendAccountDeletedEmail(toEmail, userName) {
  await sendBrevoEmail({
    to: toEmail,
    subject: 'Account Deleted - Lockify',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
        <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
        <h2 style="color:#ffffff;margin-top:24px;">Account Deleted</h2>
        <p style="color:#8892b0;">Hi ${userName}, your account has been permanently deleted.</p>
      </div>
    `,
  });
}

module.exports = {
  sendOtpEmail,
  sendSecurityAlertEmail,
  sendWeakPasswordAlertEmail,
  sendPasswordExpiryEmail,
  sendAccountDeletedEmail,
};
