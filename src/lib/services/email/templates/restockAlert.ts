export function restockAlertTemplate(
  name: string,
  productName: string,
  productSlug: string,
  productImageUrl?: string
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const productUrl = `${appUrl}/products/${productSlug}`
  const subject = `Back in Stock: ${productName} — Calnza`

  const text = `CALNZA — Back in Stock\n\nHi ${name},\n\nGreat news. "${productName}" is back in stock — and you were first on the list.\n\nShop now before it sells out again: ${productUrl}\n\nCalnza © 2026`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Back in Stock — Calnza</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D0D;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;padding:40px 48px;">
              <p style="margin:0 0 36px;font-size:10px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="background:#E8D5B0;padding:10px 16px;">
                  <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0A0A0A;">&#10003; &nbsp;Back in Stock</p>
                </td></tr>
              </table>
              <h1 style="margin:0 0 8px;font-size:30px;font-weight:800;color:#FFFFFF;letter-spacing:-0.01em;line-height:1.15;">It's back,<br/><span style="color:#E8D5B0;">${name}.</span></h1>
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.7;">You asked us to notify you. We delivered. The item below is available again — but stock is limited.</p>
            </td>
          </tr>

          <!-- Product Card -->
          <tr>
            <td style="background:#111111;border:1px solid #1E1E1E;border-top:none;padding:32px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #2A2A2A;">
                <tr>
                  ${productImageUrl ? `
                  <td style="width:120px;vertical-align:top;">
                    <img src="${productImageUrl}" width="120" height="150" style="display:block;object-fit:cover;" alt="${productName}" />
                  </td>` : ''}
                  <td style="padding:24px;vertical-align:middle;">
                    <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#E8D5B0;">Now Available</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:800;color:#FFFFFF;line-height:1.3;">${productName}</p>
                    <a href="${productUrl}" style="display:inline-block;background:#E8D5B0;color:#0A0A0A;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:12px 28px;">Shop Now</a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:11px;color:#444444;text-align:center;line-height:1.6;">Stock is limited. We can't guarantee it'll be available if you wait.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;border-top:none;padding:28px 48px;">
              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
              <p style="margin:6px 0 0;font-size:9px;color:#333333;">© 2026 · You received this because you subscribed to restock notifications. <a href="${appUrl}/unsubscribe" style="color:#444444;text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()

  return { subject, html, text }
}
