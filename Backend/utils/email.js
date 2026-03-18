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
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

              <!-- Header -->
              <tr>
                <td style="padding:0 0 24px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Lockify</span>
                      </td>
                      <td align="right">
                        <span style="font-size:11px;color:#444444;letter-spacing:1px;text-transform:uppercase;">Password Manager</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding:0 0 24px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#ffffff;height:1px;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Card -->
              <tr>
                <td style="background-color:#0a0a0a;border-radius:16px;border:1px solid #1a1a1a;overflow:hidden;">

                  <!-- Card Content -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:36px 36px 28px;">
                        ${content}
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:24px 0 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:0 0 12px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color:#222222;height:1px;font-size:0;line-height:0;">&nbsp;</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="margin:0;font-size:11px;color:#333333;text-align:center;line-height:1.8;">
                          © 2024 Lockify · Your passwords, your control<br/>
                          <span style="color:#222222;">If you didn't request this email, you can safely ignore it.</span>
                        </p>
                      </td>
                    </tr>
                  </table>
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
    login: 'Two-Factor Authentication',
    reset: 'Password Reset',
  };

  const content = `
    <!-- Badge -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#ffffff;border-radius:4px;padding:4px 10px;">
          <span style="font-size:10px;font-weight:700;color:#000000;letter-spacing:1.5px;text-transform:uppercase;">
            ${badges[type] || badges.verify}
          </span>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
      Your verification<br/>code
    </h1>
    <p style="margin:0 0 32px;font-size:14px;color:#555555;line-height:1.6;">
      Use this code to ${labels[type] || labels.verify}.
    </p>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#ffffff;border-radius:12px;padding:32px;text-align:center;">
          <span style="font-size:48px;font-weight:700;letter-spacing:18px;color:#000000;font-family:'Courier New',monospace;">
            ${otp}
          </span>
        </td>
      </tr>
    </table>

    <!-- Info rows -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background-color:#111111;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#888888;">
            Expires in <strong style="color:#ffffff;">10 minutes</strong>
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#111111;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#555555;">
            Never share this code with anyone. Lockify will <strong style="color:#666666;">never</strong> ask for your master password.
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
    new_login: { subject: 'New Login to Your Lockify Account', title: 'New Login Detected', message: 'We detected a new login to your Lockify account.' },
    failed_attempt: { subject: 'Failed Login Attempt - Lockify', title: 'Failed Login Attempt', message: 'There was a failed attempt to login to your account.' },
    password_changed: { subject: 'Password Changed - Lockify', title: 'Password Successfully Changed', message: 'Your Lockify master password was recently changed.' },
    account_deleted: { subject: 'Account Deleted - Lockify', title: 'Account Deleted', message: 'Your Lockify account has been permanently deleted.' },
  };

  const alert = alerts[alertType] || alerts.new_login;

  const content = `
    <!-- Badge -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#ffffff;border-radius:4px;padding:4px 10px;">
          <span style="font-size:10px;font-weight:700;color:#000000;letter-spacing:1.5px;text-transform:uppercase;">
            Security Alert
          </span>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
      ${alert.title}
    </h1>
    <p style="margin:0 0 32px;font-size:14px;color:#555555;line-height:1.6;">
      ${alert.message}
    </p>

    <!-- Details box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background-color:#111111;border-radius:8px;padding:20px;">
          <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#444444;letter-spacing:1.5px;text-transform:uppercase;">Details</p>
          <p style="margin:0;font-size:14px;color:#888888;line-height:1.8;">
            Time &nbsp;&nbsp;&nbsp;
            <strong style="color:#ffffff;">${new Date().toLocaleString()}</strong><br/>
            Device &nbsp;
            <strong style="color:#ffffff;">${details.device || 'Unknown'}</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- Warning -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border:1px solid #333333;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#555555;">
            If this wasn't you, please secure your account immediately by changing your master password.
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
    <!-- Badge -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#ffffff;border-radius:4px;padding:4px 10px;">
          <span style="font-size:10px;font-weight:700;color:#000000;letter-spacing:1.5px;text-transform:uppercase;">
            Account Notice
          </span>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
      Account Deleted
    </h1>
    <p style="margin:0 0 32px;font-size:14px;color:#555555;line-height:1.6;">
      Hi <strong style="color:#ffffff;">${userName}</strong>, your Lockify account has been permanently deleted as requested.
    </p>

    <!-- Confirmation box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background-color:#ffffff;border-radius:8px;padding:24px;text-align:center;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#000000;">Account Permanently Closed</p>
          <p style="margin:8px 0 0;font-size:13px;color:#555555;">All your data has been wiped from our systems.</p>
        </td>
      </tr>
    </table>

    <!-- Warning -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border:1px solid #333333;border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#555555;">
            If you did not request this deletion, please contact support immediately.
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
