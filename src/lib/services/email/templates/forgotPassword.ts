export function forgotPasswordTemplate(name: string, resetUrl: string): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const subject = `Reset Your Calnza Password, ${name}`

  const text = `
CALNZA

Password Reset Request

Hi ${name},

We received a request to reset the password for your Calnza account. Click the link below to set a new password:

${resetUrl}

This link expires in 1 hour. After that, you'll need to request a new reset link.

If you did NOT request this, your account is safe — simply ignore this email. No changes have been made.

CALNZA © 2026
`.trim()

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password — Calnza</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;">

          <!-- Top accent -->
          <tr>
            <td style="background:#0A0A0A;height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background:#0A0A0A;padding:40px 48px 40px;">
              <p style="margin:0 0 36px;font-size:10px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>

              <!-- Lock icon constructed with unicode + inline styling -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#1A1A1A;border:1px solid #2A2A2A;padding:14px 18px;">
                    <p style="margin:0;font-size:20px;line-height:1;">&#128274;</p>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 12px;font-size:32px;font-weight:800;line-height:1.15;letter-spacing:-0.02em;color:#FFFFFF;">Reset your<br/><span style="color:#E8D5B0;">password.</span></h1>
              <p style="margin:0;font-size:13px;color:#777777;line-height:1.7;max-width:340px;">Hi ${name}, no worries — it happens to everyone. Click the button below to choose a new password for your Calnza account.</p>
            </td>
          </tr>

          <!-- Expiry Banner -->
          <tr>
            <td style="background:#1A1A1A;padding:14px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:10px;color:#666666;letter-spacing:0.1em;text-transform:uppercase;">Link expires in</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:10px;font-weight:700;color:#E8D5B0;letter-spacing:0.2em;text-transform:uppercase;">1 Hour</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="background:#FFFFFF;padding:48px;">

              <!-- Primary CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background:#0A0A0A;color:#FFFFFF;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:20px 56px;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider with text -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #F0F0F0;width:40%;"></td>
                  <td align="center" style="padding:0 16px;white-space:nowrap;">
                    <p style="margin:0;font-size:10px;color:#CCCCCC;letter-spacing:0.15em;text-transform:uppercase;">or copy link</p>
                  </td>
                  <td style="border-top:1px solid #F0F0F0;width:40%;"></td>
                </tr>
              </table>

              <!-- Link fallback -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8F8;border:1px solid #EEEEEE;margin-bottom:32px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:10px;color:#999999;word-break:break-all;line-height:1.5;">${resetUrl}</p>
                  </td>
                </tr>
              </table>

              <!-- Security warning -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FDF8F0;border-left:3px solid #E8D5B0;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#0A0A0A;letter-spacing:0.05em;">Didn't request this?</p>
                    <p style="margin:0;font-size:12px;color:#737373;line-height:1.6;">Your account is safe. Simply ignore this email — no changes have been made to your password.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A0A0A;padding:28px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
                    <p style="margin:6px 0 0;font-size:9px;color:#333333;">© 2026 · <a href="${appUrl}" style="color:#555555;text-decoration:none;">calnza.com</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#E8D5B0;height:3px;font-size:0;line-height:0;">&nbsp;</td>
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
