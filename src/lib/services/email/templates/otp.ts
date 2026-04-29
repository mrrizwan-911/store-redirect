export function otpEmailTemplate(name: string, code: string): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const subject = `${code} — Your Calnza Verification Code`

  const text = `
CALNZA

Verify Your Email, ${name}.

Your one-time verification code:

  ${code}

Expires in 10 minutes. Do not share this code with anyone.

If you didn't create an account at Calnza, ignore this email safely.

CALNZA © 2026
`.trim()

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Verify Your Email — Calnza</title>
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
            <td style="background:#0A0A0A;padding:40px 48px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#444444;">Email Verification</p>
                  </td>
                </tr>
              </table>
              <h1 style="margin:32px 0 8px;font-size:34px;font-weight:800;line-height:1.1;letter-spacing:-0.02em;color:#FFFFFF;">One code.<br/><span style="color:#E8D5B0;">That's all it takes.</span></h1>
              <p style="margin:0;font-size:13px;color:#777777;line-height:1.6;">Hi ${name}, enter the code below to verify your Calnza account and start shopping.</p>
            </td>
          </tr>

          <!-- Code Block -->
          <tr>
            <td style="background:#111111;padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:48px 48px;">

                    <!-- Code display -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #2A2A2A;">
                      <tr>
                        <td style="padding:4px 8px;border-right:1px solid #2A2A2A;">
                          <p style="margin:0;font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#555555;">CODE</p>
                        </td>
                        <td style="padding:4px 8px;">
                          <p style="margin:0;font-size:9px;color:#333333;letter-spacing:0.1em;">Expires 10 min</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:20px 0 4px;font-size:52px;font-weight:900;letter-spacing:0.18em;color:#FFFFFF;font-family:'Courier New',Courier,monospace;">${code}</p>
                    <p style="margin:0;font-size:10px;color:#444444;letter-spacing:0.15em;text-transform:uppercase;">Your One-Time Code</p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info Section -->
          <tr>
            <td style="background:#FFFFFF;padding:40px 48px;">

              <!-- Security note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F0;border-left:3px solid #E8D5B0;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0A0A0A;">Security Notice</p>
                    <p style="margin:0;font-size:12px;color:#737373;line-height:1.6;">Never share this code with anyone. Calnza staff will never ask for your verification code. This code expires in <strong style="color:#0A0A0A;">10 minutes</strong>.</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;text-align:center;">Didn't create a Calnza account? You can safely ignore this email — no action is needed.</p>

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

          <!-- Bottom accent -->
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
