require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const FROM_EMAIL = 'Lockify <noreply@lockify.app>';

/**
 * Send OTP email
 */
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

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
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
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw error;
  }
}

/**
 * Send Security Alert Email
 */
async function sendSecurityAlertEmail(toEmail, userName, alertType, details = {}) {
  const alerts = {
    new_login: {
      subject: 'New Login to Your Lockify Account',
      title: 'New Login Detected',
      icon: '🔐',
      message: 'We detected a new login to your account',
      details: `Device: ${details.device || 'Unknown'}<br>Location: ${details.location || 'Unknown'}<br>Time: ${new Date().toLocaleString()}`
    },
    failed_attempt: {
      subject: 'Failed Login Attempt - Lockify',
      title: 'Failed Login Attempt',
      icon: '⚠️',
      message: 'There was a failed attempt to login to your account',
      details: `Device: ${details.device || 'Unknown'}<br>Location: ${details.location || 'Unknown'}<br>Time: ${new Date().toLocaleString()}<br>IP Address: ${details.ip || 'Unknown'}`
    },
    password_changed: {
      subject: 'Password Changed - Lockify',
      title: 'Password Successfully Changed',
      icon: '🔑',
      message: 'Your account password was recently changed',
      details: `Time: ${new Date().toLocaleString()}<br>Device: ${details.device || 'Unknown'}`
    },
    account_deleted: {
      subject: 'Account Deleted - Lockify',
      title: 'Account Successfully Deleted',
      icon: '🗑️',
      message: 'Your Lockify account and all associated data have been permanently deleted.',
      details: `Time: ${new Date().toLocaleString()}<br>If you did not request this, please contact support immediately.`
    }
  };

  const alert = alerts[alertType] || alerts.new_login;

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: alert.subject,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
          <div style="margin-bottom:24px;">
            <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:3rem;margin-bottom:8px;">${alert.icon}</div>
            <h2 style="color:#ffffff;margin-bottom:8px;">${alert.title}</h2>
            <p style="color:#8892b0;">${alert.message}</p>
          </div>
          <div style="background:#1a1f3a;border:1px solid #2a3050;border-radius:12px;padding:20px;margin-bottom:24px;">
            <h3 style="color:#5e81f4;margin-bottom:12px;font-size:0.9rem;">Details:</h3>
            <p style="color:#e2e8f0;line-height:1.6;">${alert.details}</p>
          </div>
          <div style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#f87171;font-size:0.85rem;margin:0;">
              <strong>Security Tip:</strong> If this wasn't you, please secure your account immediately.
            </p>
          </div>
          <hr style="border:none;border-top:1px solid #1a1f3a;margin:24px 0;" />
          <p style="color:#4a5270;font-size:0.75rem;">If you didn't request this, please contact support immediately.</p>
        </div>
      `,
    });
    return info;
  } catch (error) {
    console.error('Failed to send security alert email:', error.message);
    throw error;
  }
}

/**
 * Send Weak Password Alert Email
 */
async function sendWeakPasswordAlertEmail(toEmail, userName, weakPasswords = []) {
  try {
    const passwordList = weakPasswords.map(pwd =>
      `<div style="background:#1a1f3a;border-radius:6px;padding:12px;margin-bottom:8px;">
        <div style="color:#e2e8f0;font-weight:600;margin-bottom:4px;">${pwd.name || 'Unknown'}</div>
        <div style="color:#f87171;font-size:0.85rem;">Strength: ${pwd.strength || 'Weak'}</div>
      </div>`
    ).join('');

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Weak Passwords Detected - Lockify Security Alert',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
          <div style="margin-bottom:24px;">
            <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:3rem;margin-bottom:8px;">🔓</div>
            <h2 style="color:#ffffff;margin-bottom:8px;">Weak Passwords Detected</h2>
            <p style="color:#8892b0;">We found ${weakPasswords.length} password(s) that need your attention</p>
          </div>
          <div style="background:#1a1f3a;border:1px solid #2a3050;border-radius:12px;padding:20px;margin-bottom:24px;">
            <h3 style="color:#f87171;margin-bottom:16px;font-size:0.9rem;">Weak Passwords:</h3>
            ${passwordList}
          </div>
          <hr style="border:none;border-top:1px solid #1a1f3a;margin:24px 0;" />
          <p style="color:#4a5270;font-size:0.75rem;">Log in to your Lockify account to update these passwords.</p>
        </div>
      `,
    });
    return info;
  } catch (error) {
    console.error('Failed to send weak password alert email:', error.message);
    throw error;
  }
}

/**
 * Send Password Expiry Reminder Email
 */
async function sendPasswordExpiryEmail(toEmail, userName, expiredPasswords = []) {
  try {
    const passwordList = expiredPasswords.map(pwd =>
      `<div style="background:#1a1f3a;border-radius:6px;padding:12px;margin-bottom:8px;">
        <div style="color:#e2e8f0;font-weight:600;margin-bottom:4px;">${pwd.name || 'Unknown'}</div>
        <div style="color:#fbbf24;font-size:0.85rem;">Age: ${pwd.age || '90+ days'}</div>
      </div>`
    ).join('');

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Password Update Reminder - Lockify',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
          <div style="margin-bottom:24px;">
            <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:3rem;margin-bottom:8px;">⏰</div>
            <h2 style="color:#ffffff;margin-bottom:8px;">Password Update Reminder</h2>
            <p style="color:#8892b0;">You have ${expiredPasswords.length} password(s) older than 90 days</p>
          </div>
          <div style="background:#1a1f3a;border:1px solid #2a3050;border-radius:12px;padding:20px;margin-bottom:24px;">
            <h3 style="color:#fbbf24;margin-bottom:16px;font-size:0.9rem;">Passwords to Update:</h3>
            ${passwordList}
          </div>
          <hr style="border:none;border-top:1px solid #1a1f3a;margin:24px 0;" />
          <p style="color:#4a5270;font-size:0.75rem;">Log in to your Lockify account to update these passwords.</p>
        </div>
      `,
    });
    return info;
  } catch (error) {
    console.error('Failed to send password expiry email:', error.message);
    throw error;
  }
}

/**
 * Send Account Deletion Email
 */
async function sendAccountDeletedEmail(toEmail, userName) {
  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Account Deleted - Lockify',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1224;border-radius:16px;color:#e2e8f0;">
          <div style="margin-bottom:24px;">
            <span style="font-size:1.2rem;font-weight:700;color:#e8edff;">🔒 Lockify</span>
          </div>
          <h2 style="color:#ffffff;margin-bottom:8px;">Account Deleted</h2>
          <p style="color:#8892b0;margin-bottom:24px;">Hi ${userName},</p>
          <p style="color:#8892b0;margin-bottom:24px;">Your Lockify account and all associated data have been permanently deleted as requested.</p>
          <div style="background:#1a1f3a;border:1px solid #2a3050;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:1.5rem;font-weight:700;color:#f87171;">Account Permanently Closed</span>
          </div>
          <p style="color:#4a5270;font-size:0.85rem;">This action cannot be undone. All your saved passwords and personal data have been wiped from our systems.</p>
          <hr style="border:none;border-top:1px solid #1a1f3a;margin:24px 0;" />
          <p style="color:#4a5270;font-size:0.75rem;">If you did not request this, please contact support immediately.</p>
        </div>
      `,
    });
    console.log(`✅ Deletion email sent to ${toEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send account deletion email:', error.message);
    throw error;
  }
}

module.exports = {
  sendOtpEmail,
  sendSecurityAlertEmail,
  sendWeakPasswordAlertEmail,
  sendPasswordExpiryEmail,
  sendAccountDeletedEmail
};
