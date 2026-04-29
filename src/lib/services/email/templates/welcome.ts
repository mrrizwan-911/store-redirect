export function welcomeTemplate(name: string): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const subject = `Welcome to Calnza, ${name} — Your Style Journey Begins`

  const text = `
CALNZA

Welcome, ${name}.

Your account is verified. You're now part of a curated fashion experience built for those who know exactly what they want.

→ Explore Collections: ${appUrl}
→ Your Account: ${appUrl}/account
→ New Arrivals: ${appUrl}/products?sort=createdAt_desc

You earn loyalty points on every purchase. Bronze → Silver → Gold → Platinum.

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
  <!--[if mso]><style>td{font-family:Arial,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Email Container -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;">

          <!-- Top accent bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#0A0A0A 0%,#2A2A2A 50%,#E8D5B0 100%);height:3px;font-size:0;line-height:0;">&nbsp;</td>
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
                    <p style="margin:0 0 48px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">EST. 2026</p>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 style="margin:0 0 16px;font-size:40px;font-weight:800;line-height:1.1;letter-spacing:-0.02em;color:#FFFFFF;">Welcome,<br/><span style="color:#E8D5B0;">${name}.</span></h1>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#999999;font-weight:400;max-width:360px;">Your account is verified. You now have access to a curated fashion experience built for those who refuse to compromise on style.</p>

              <!-- Decorative line -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;">
                <tr>
                  <td style="border-top:1px solid #222222;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stats Strip -->
          <tr>
            <td style="background:#111111;padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 16px;border-right:1px solid #222222;">
                    <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">1000+</p>
                    <p style="margin:0;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Styles</p>
                  </td>
                  <td align="center" style="padding:24px 16px;border-right:1px solid #222222;">
                    <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#E8D5B0;letter-spacing:-0.02em;">4×</p>
                    <p style="margin:0;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Loyalty Tiers</p>
                  </td>
                  <td align="center" style="padding:24px 16px;">
                    <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">PKK</p>
                    <p style="margin:0;font-size:9px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Free Shipping</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="background:#FFFFFF;padding:48px;">

              <!-- Loyalty Tier Visual -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0 0 16px;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#0A0A0A;">Your Loyalty Journey</p>
                    <!-- Tier Track -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:0 4px;">
                          <div style="background:#CD7F32;width:100%;height:4px;border-radius:2px;font-size:0;">&nbsp;</div>
                          <p style="margin:8px 0 0;font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#CD7F32;">Bronze</p>
                        </td>
                        <td align="center" style="padding:0 4px;">
                          <div style="background:#C0C0C0;width:100%;height:4px;border-radius:2px;font-size:0;">&nbsp;</div>
                          <p style="margin:8px 0 0;font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#999999;">Silver</p>
                        </td>
                        <td align="center" style="padding:0 4px;">
                          <div style="background:#FFD700;width:100%;height:4px;border-radius:2px;font-size:0;">&nbsp;</div>
                          <p style="margin:8px 0 0;font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#999999;">Gold</p>
                        </td>
                        <td align="center" style="padding:0 4px;">
                          <div style="background:#E8D5B0;width:100%;height:4px;border-radius:2px;font-size:0;">&nbsp;</div>
                          <p style="margin:8px 0 0;font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#999999;">Platinum</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0;font-size:12px;color:#737373;line-height:1.6;">Earn points on every purchase and unlock exclusive member benefits, early access, and priority support as you climb the tiers.</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
                <tr><td style="border-top:1px solid #F0F0F0;"></td></tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display:inline-block;background:#0A0A0A;color:#FFFFFF;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:18px 48px;">
                      Explore Collections
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px;">
                    <a href="${appUrl}/products?sort=createdAt_desc" style="display:inline-block;border:1.5px solid #0A0A0A;color:#0A0A0A;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:16px 46px;">
                      New Arrivals
                    </a>
                  </td>
                </tr>
              </table>

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
                    <p style="margin:16px 0 0;font-size:9px;color:#333333;line-height:1.6;">You're receiving this because you created an account at Calnza. &nbsp;<a href="${appUrl}/unsubscribe" style="color:#555555;text-decoration:underline;">Unsubscribe</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom accent bar -->
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
