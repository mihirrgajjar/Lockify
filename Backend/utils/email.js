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

/* ── Shared email wrapper ── */
function emailWrapper(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0a0a0a;border-radius:16px;border:1px solid #222222;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="padding:28px 32px;border-bottom:1px solid #222222;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color:#000000;border-radius:8px;padding:8px;border:1px solid #333333;">
                              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="32" height="32" rx="8" fill="#000000"/>
                                <rect x="7" y="14" width="18" height="12" rx="2" fill="white"/>
                                <path d="M10 14V10a6 6 0 0 1 12 0v4" stroke="white" stroke-width="2.5" fill="none"/>
                                <circle cx="16" cy="20" r="1.5" fill="#000000"/>
                              </svg>
                            </td>
                            <td style="padding-left:10px;">
                              <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Lockify</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:32px;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px;border-top:1px solid #222222;background-color:#050505;">
                  <p style="margin:0;font-size:12px;color:#555555;text-align:center;">
                    © 2024 Lockify · Your passwords, your control
                  </p>
                  <p style="margin:6px 0 0;font-size:11px;color:#444444;text-align:center;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
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

/* ── OTP Email ── */
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

  const icons = {
    verify: '✉️',
    login: '🔐',
    reset: '🔑',
  };

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#888888;letter-spacing:1px;text-transform:uppercase;">
      ${icons[type]} ${type === 'verify' ? 'Email Verification' : type === 'login' ? 'Two-Factor Auth' : 'Password Reset'}
    </p>
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      Your verification code
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.6;">
      Use this code to ${labels[type] || labels.verify}:
    </p>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #333333;border-radius:12px;padding:28px;text-align:center;">
          <span style="font-size:42px;font-weight:700;letter-spacing:16px;color:#ffffff;font-family:'Courier New',monospace;">
            ${otp}
          </span>
        </td>
      </tr>
    </table>

    <!-- Timer notice -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #222222;border-radius:8px;padding:14px 16px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:18px;padding-right:10px;">⏱️</td>
              <td style="font-size:13px;color:#888888;">
                This code expires in <strong style="color:#ffffff;">10 minutes</strong>. Never share it with anyone.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Security tip -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#0d0d0d;border:1px solid #1a1a1a;border-radius:8px;padding:14px 16px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:18px;padding-right:10px;">🛡️</td>
              <td style="font-size:13px;color:#666666;">
                Lockify will <strong style="color:#888888;">never</strong> ask for your master password via email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  await sendBrevoEmail({
    to: toEmail,
    subject: subjects[type] || subjects.verify,
    html: emailWrapper(content),
  });
}

/* ── Security Alert Email ── */
async function sendSecurityAlertEmail(toEmail, userName, alertType, details = {}) {
  const alerts = {
    new_login: { subject: 'New Login to Your Lockify Account', icon: '🔐', title: 'New Login Detected', message: 'We detected a new login to your Lockify account.' },
    failed_attempt: { subject: 'Failed Login Attempt - Lockify', icon: '⚠️', title: 'Failed Login Attempt', message: 'There was a failed attempt to login to your account.' },
    password_changed: { subject: 'Password Changed - Lockify', icon: '🔑', title: 'Password Successfully Changed', message: 'Your Lockify master password was recently changed.' },
    account_deleted: { subject: 'Account Deleted - Lockify', icon: '🗑️', title: 'Account Deleted', message: 'Your Lockify account has been permanently deleted.' },
  };

  const alert = alerts[alertType] || alerts.new_login;

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#888888;letter-spacing:1px;text-transform:uppercase;">
      Security Alert
    </p>
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      ${alert.icon} ${alert.title}
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.6;">
      ${alert.message}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #333333;border-radius:12px;padding:20px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#666666;letter-spacing:1px;text-transform:uppercase;">Details</p>
          <p style="margin:0;font-size:14px;color:#aaaaaa;line-height:1.8;">
            Time: <strong style="color:#ffffff;">${new Date().toLocaleString()}</strong><br/>
            Device: <strong style="color:#ffffff;">${details.device || 'Unknown'}</strong>
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#1a0a0a;border:1px solid #3d1515;border-radius:8px;padding:14px 16px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:18px;padding-right:10px;">⚠️</td>
              <td style="font-size:13px;color:#888888;">
                If this wasn't you, please <strong style="color:#ef4444;">secure your account immediately</strong>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  await sendBrevoEmail({
    to: toEmail,
    subject: alert.subject,
    html: emailWrapper(content),
  });
}

/* ── Weak Password Alert ── */
async function sendWeakPasswordAlertEmail(toEmail, userName, weakPasswords = []) {
  const passwordList = weakPasswords.map(pwd => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
        <span style="font-size:14px;color:#ffffff;font-weight:600;">${pwd.name || 'Unknown'}</span>
        <span style="font-size:12px;color:#ef4444;margin-left:10px;">● Weak</span>
      </td>
    </tr>
  `).join('');

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#888888;letter-spacing:1px;text-transform:uppercase;">
      Security Warning
    </p>
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      🔓 Weak Passwords Detected
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.6;">
      We found <strong style="color:#ffffff;">${weakPasswords.length} password(s)</strong> that need your attention.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #333333;border-radius:12px;padding:20px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#666666;letter-spacing:1px;text-transform:uppercase;">Weak Passwords</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${passwordList}
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#1a1200;border:1px solid #3d2e00;border-radius:8px;padding:14px 16px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:18px;padding-right:10px;">💡</td>
              <td style="font-size:13px;color:#888888;">
                Update these passwords to <strong style="color:#ffffff;">stronger ones</strong> to protect your accounts.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  await sendBrevoEmail({
    to: toEmail,
    subject: 'Weak Passwords Detected - Lockify Security Alert',
    html: emailWrapper(content),
  });
}

/* ── Password Expiry Reminder ── */
async function sendPasswordExpiryEmail(toEmail, userName, expiredPasswords = []) {
  const passwordList = expiredPasswords.map(pwd => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
        <span style="font-size:14px;color:#ffffff;font-weight:600;">${pwd.name || 'Unknown'}</span>
        <span style="font-size:12px;color:#f59e0b;margin-left:10px;">● ${pwd.age || '90+ days old'}</span>
      </td>
    </tr>
  `).join('');

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#888888;letter-spacing:1px;text-transform:uppercase;">
      Reminder
    </p>
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      ⏰ Password Update Reminder
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.6;">
      You have <strong style="color:#ffffff;">${expiredPasswords.length} password(s)</strong> older than 90 days.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #333333;border-radius:12px;padding:20px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#666666;letter-spacing:1px;text-transform:uppercase;">Passwords to Update</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${passwordList}
          </table>
        </td>
      </tr>
    </table>
  `;

  await sendBrevoEmail({
    to: toEmail,
    subject: 'Password Update Reminder - Lockify',
    html: emailWrapper(content),
  });
}

/* ── Account Deleted Email ── */
async function sendAccountDeletedEmail(toEmail, userName) {
  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#888888;letter-spacing:1px;text-transform:uppercase;">
      Account Notice
    </p>
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      Account Deleted
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.6;">
      Hi <strong style="color:#ffffff;">${userName}</strong>, your Lockify account has been permanently deleted as requested.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #333333;border-radius:12px;padding:24px;text-align:center;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#ef4444;">Account Permanently Closed</p>
          <p style="margin:8px 0 0;font-size:13px;color:#666666;">All your data has been wiped from our systems.</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#1a0a0a;border:1px solid #3d1515;border-radius:8px;padding:14px 16px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:18px;padding-right:10px;">⚠️</td>
              <td style="font-size:13px;color:#888888;">
                If you did not request this, please contact support <strong style="color:#ef4444;">immediately</strong>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  await sendBrevoEmail({
    to: toEmail,
    subject: 'Account Deleted - Lockify',
    html: emailWrapper(content),
  });
  console.log(`✅ Deletion email sent to ${toEmail}`);
}

module.exports = {
  sendOtpEmail,
  sendSecurityAlertEmail,
  sendWeakPasswordAlertEmail,
  sendPasswordExpiryEmail,
  sendAccountDeletedEmail,
};