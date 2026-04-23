export function welcomeTemplate(name: string): { subject: string; html: string; text: string } {
  const subject = "Welcome to Calnza — You're In"

  const text = `
Welcome to Calnza, ${name}.

Your account is verified and ready. Start exploring our luxury collections and earn loyalty points on every purchase.

Shop Styles: 1000+ Styles available
Earn Points: Loyalty program active
Exclusive: Members-only offers

Start Shopping: ${process.env.NEXT_PUBLIC_APP_URL || 'https://calnza.com'}

CALNZA LUXURY E-COMMERCE © 2026
`.trim()

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
                Welcome, ${name}.
              </h1>
              <p style="color:#737373;font-size:14px;margin:0 0 32px;">
                Your account is verified and ready.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td align="center" style="width:33.33%;padding:0 4px;">
                    <p style="color:#000000;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Shop 1000+</p>
                    <p style="color:#737373;font-size:9px;margin:4px 0 0;">Styles</p>
                  </td>
                  <td align="center" style="width:33.33%;padding:0 4px;border-left:1px solid #E5E5E5;border-right:1px solid #E5E5E5;">
                    <p style="color:#000000;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Earn Loyalty</p>
                    <p style="color:#737373;font-size:9px;margin:4px 0 0;">Points</p>
                  </td>
                  <td align="center" style="width:33.33%;padding:0 4px;">
                    <p style="color:#000000;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;margin:0;">Exclusive</p>
                    <p style="color:#737373;font-size:9px;margin:4px 0 0;">Offers</p>
                  </td>
                </tr>
              </table>

              <div style="margin:0 0 32px;text-align:center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}" style="background:#000000;color:#FFFFFF;display:inline-block;padding:18px 32px;text-decoration:none;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.2em;border-radius:4px;">
                  Start Shopping
                </a>
              </div>

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
