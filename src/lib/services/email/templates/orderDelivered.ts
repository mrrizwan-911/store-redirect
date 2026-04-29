function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Calnza</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D0D;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function darkFooter(appUrl: string, whatsappNumber: string = ''): string {
  return `
  <tr>
    <td style="background:#0A0A0A;border:1px solid #1E1E1E;border-top:none;padding:28px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
            <p style="margin:6px 0 0;font-size:9px;color:#333333;line-height:1.6;">© 2026 · <a href="${appUrl}" style="color:#555555;text-decoration:none;">calnza.com</a>${whatsappNumber ? ` &nbsp;·&nbsp; <a href="https://wa.me/${whatsappNumber}" style="color:#555555;text-decoration:none;">WhatsApp</a>` : ''}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

export function orderDeliveredTemplate(
  name: string,
  orderNumber: string,
  pointsEarned: number
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const subject = `Delivered! Your Calnza Order #${orderNumber} Has Arrived`

  const pointsText = pointsEarned > 0 ? `\nYou earned ${pointsEarned} loyalty points on this order!\n` : ''
  const text = `CALNZA — Delivered\n\nHi ${name},\n\nYour order #${orderNumber} has been delivered. We hope you love everything!\n${pointsText}\nWrite a review: ${appUrl}/account\nShop again: ${appUrl}\n\nCalnza © 2026`

  const pointsBlock = pointsEarned > 0
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1A1A1A;border:1px solid #2A2A2A;margin:0 0 24px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#E8D5B0;">Loyalty Points Earned</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#FFFFFF;">+${pointsEarned} <span style="font-size:14px;font-weight:400;color:#E8D5B0;">pts</span></p>
          <p style="margin:4px 0 0;font-size:11px;color:#555555;">Keep shopping to unlock your next loyalty tier.</p>
        </td></tr>
      </table>` : ''

  const content = `
  <tr>
    <td style="background:#0A0A0A;border:1px solid #1E1E1E;padding:40px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td><p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p></td>
          <td align="right"><p style="margin:0;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#333333;">#${orderNumber}</p></td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
        <tr><td style="background:#E8D5B0;padding:10px 16px;">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0A0A0A;">&#10003; &nbsp;Delivered</p>
        </td></tr>
      </table>
      <h1 style="margin:0 0 8px;font-size:30px;font-weight:800;color:#FFFFFF;letter-spacing:-0.01em;line-height:1.15;">Your order<br/><span style="color:#E8D5B0;">has arrived.</span></h1>
      <p style="margin:0;font-size:13px;color:#666666;line-height:1.7;">Hi ${name}, your order #${orderNumber} has been delivered. We hope you absolutely love your new pieces.</p>
    </td>
  </tr>
  <tr>
    <td style="background:#111111;border:1px solid #1E1E1E;border-top:none;padding:32px 48px;">
      ${pointsBlock}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:8px;" width="50%">
            <a href="${appUrl}/account" style="display:block;background:#E8D5B0;color:#0A0A0A;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:16px 24px;text-align:center;">Write a Review</a>
          </td>
          <td style="padding-left:8px;" width="50%">
            <a href="${appUrl}" style="display:block;border:1.5px solid #E8D5B0;color:#E8D5B0;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:15px 24px;text-align:center;">Shop Again</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${darkFooter(appUrl)}`

  return { subject, html: emailShell(content), text }
}
