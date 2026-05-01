export function newsletterWelcomeTemplate(code: string): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const subject = "Welcome to the Inner Circle | Your 10% Off Inside"

  const text = `
CALNZA

Welcome to the Inner Circle.

Thank you for joining our community of style enthusiasts. You are now part of a curated fashion experience built for those who value surgical precision and ethical craftsmanship.

YOUR WELCOME GIFT:
${code}

Apply this code at checkout for 10% off your first order.

→ Explore Collections: ${appUrl}
→ New Arrivals: ${appUrl}/products?sort=createdAt_desc

CALNZA © 2026 · Unsubscribe: ${appUrl}/unsubscribe
`.trim()

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Welcome to Calnza</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Email Container -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;">

          <!-- Top accent bar -->
          <tr>
            <td style="background:#0A0A0A;height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="background:#0A0A0A;padding:56px 48px 48px;">
              <!-- Brand mark -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 48px;font-size:10px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
                  </td>
                  <td align="right">
                    <p style="margin:0 0 48px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">INNER CIRCLE</p>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 style="margin:0 0 16px;font-size:32px;font-weight:800;line-height:1.1;letter-spacing:-0.02em;color:#FFFFFF;text-transform:uppercase;">Welcome to the<br/><span style="color:#E8D5B0;">Inner Circle.</span></h1>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#999999;font-weight:400;max-width:360px;">Thank you for joining our community. You're now part of a curated fashion experience built for those who value precision and craftsmanship.</p>
            </td>
          </tr>

          <!-- Incentive Section -->
          <tr>
            <td style="background:#FFFFFF;padding:48px;text-align:center;">
              <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#0A0A0A;">Your Welcome Gift</p>
              <div style="border: 1px dashed #0A0A0A; padding: 24px; display: inline-block; min-width: 240px;">
                <h2 style="margin:0;font-size:32px;font-weight:800;letter-spacing:0.1em;color:#0A0A0A;">${code}</h2>
              </div>
              <p style="margin:16px 0 0;font-size:12px;color:#737373;line-height:1.6;">Apply this code at checkout to receive 10% off your first order.</p>

              <div style="margin-top:40px;">
                <a href="${appUrl}" style="display:inline-block;background:#0A0A0A;color:#FFFFFF;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:18px 48px;">
                  Shop the Collection
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A0A0A;padding:32px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
                    <p style="margin:0;font-size:10px;color:#444444;line-height:1.6;">Clothes · Shoes · Apparel · Accessories</p>
                  </td>
                  <td align="right" valign="top">
                    <p style="margin:0;font-size:9px;color:#333333;letter-spacing:0.1em;">© 2026</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:20px;border-top:1px solid #1A1A1A;margin-top:20px;">
                    <p style="margin:16px 0 0;font-size:9px;color:#333333;line-height:1.6;">You're receiving this because you subscribed to the CALNZA newsletter. &nbsp;<a href="${appUrl}/unsubscribe" style="color:#555555;text-decoration:underline;">Unsubscribe</a></p>
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
`.trim()

  return { subject, html, text }
}
