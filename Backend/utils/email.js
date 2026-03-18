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
                <td style="padding:24px 32px;border-bottom:1px solid #222222;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#111111;border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;border:1px solid #333333;">
                        <span style="font-size:18px;line-height:36px;">🔒</span>
                      </td>
                      <td style="padding-left:10px;">
                        <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Lockify</span>
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

  const badges = {
    verify: 'Email Verification',
    login: 'Two-Factor Auth',
    reset: 'Password Reset',
  };

  const content = `
    <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#555555;letter-spacing:1.5px;text-transform:uppercase;">
      ${badges[type] || badges.verify}
    </p>
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      Your verification code
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#777777;line-height:1.6;">
      Use this code to ${labels[type] || labels.verify}:
    </p>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:32px;text-align:center;">
          <span style="font-size:44px;font-weight:700;letter-spacing:20px;color:#ffffff;font-family:'Courier New',monospace;">
            ${otp}
          </span>
        </td>
      </tr>
    </table>

    <!-- Timer -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #1e1e1e;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#666666;">
            ⏱ Expires in <strong style="color:#ffffff;">10 minutes</strong> · Never share this code with anyone
          </p>
        </td>
      </tr>
    </table>

    <!-- Security tip -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#0d0d0d;border:1px solid #1a1a1a;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#555555;">
            🛡 Lockify will <strong style="color:#777777;">never</strong> ask for your master password via email.
          </p>
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
    <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#555555;letter-spacing:1.5px;text-transform:uppercase;">
      Security Alert
    </p>
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      ${alert.icon} ${alert.title}
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#777777;line-height:1.6;">
      ${alert.message}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:20px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:600;color:#555555;letter-spacing:1px;text-transform:uppercase;">Details</p>
          <p style="margin:0;font-size:14px;color:#888888;line-height:1.8;">
            Time: <strong style="color:#ffffff;">${new Date().toLocaleString()}</strong><br/>
            Device: <strong style="color:#ffffff;">${details.device || 'Unknown'}</strong>
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#150a0a;border:1px solid #2d1515;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#666666;">
            ⚠️ If this wasn't you, please <strong style="color:#ef4444;">secure your account immediately</strong>.
          </p>
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

/* ── Account Deleted Email ── */
async function sendAccountDeletedEmail(toEmail, userName) {
  const content = `
    <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#555555;letter-spacing:1.5px;text-transform:uppercase;">
      Account Notice
    </p>
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      Account Deleted
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#777777;line-height:1.6;">
      Hi <strong style="color:#ffffff;">${userName}</strong>, your Lockify account has been permanently deleted as requested.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:24px;text-align:center;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#ef4444;">Account Permanently Closed</p>
          <p style="margin:8px 0 0;font-size:13px;color:#555555;">All your data has been wiped from our systems.</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#150a0a;border:1px solid #2d1515;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#666666;">
            ⚠️ If you did not request this, please contact support <strong style="color:#ef4444;">immediately</strong>.
          </p>
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
  sendAccountDeletedEmail,
};
