export function forgotPasswordTemplate(name: string, resetUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Reset Your Password — Calnza'

  const text = `Hi ${name},

We received a request to reset your password.

Reset your password here: ${resetUrl}

This link expires in 1 hour.
If you didn't request a password reset, ignore this email.

CALNZA LUXURY E-COMMERCE © 2026`.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border:1px solid #E5E5E5;max-width:480px;width:100%;">
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#000000;font-size:24px;margin:0 0 8px;font-weight:600;">
                Reset Your Password
              </h1>
              <p style="color:#737373;font-size:14px;margin:0 0 32px;">
                Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.
              </p>

              <div style="margin:0 0 32px;text-align:center;">
                <a href="${resetUrl}" style="background:#000000;color:#FFFFFF;display:inline-block;padding:18px 32px;text-decoration:none;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.2em;border-radius:4px;">
                  Reset Password
                </a>
              </div>

              <p style="color:#737373;font-size:12px;margin:0 0 24px;">
                This link expires in <strong style="color:#000000;">1 hour</strong>.<br/>
                If you didn't request a password reset, please ignore this email.
              </p>

              <div style="border-top:1px solid #E5E5E5;padding-top:24px;">
                <p style="color:#A3A3A3;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;font-weight:bold;margin:0;">
                  CALNZA LUXURY E-COMMERCE © 2026
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  return { subject, html, text }
}
