export function priceDropAlertTemplate(
  name: string,
  productName: string,
  productSlug: string,
  oldPrice: number,
  newPrice: number,
  productImageUrl?: string
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const productUrl = `${appUrl}/products/${productSlug}`
  const savings = oldPrice - newPrice
  const savingsPct = Math.round((savings / oldPrice) * 100)
  const subject = `Price Drop: ${productName} is now PKR ${newPrice.toLocaleString('en-PK')} — Calnza`

  const text = `CALNZA — Price Drop Alert\n\nHi ${name},\n\nAn item on your wishlist just dropped in price.\n\n${productName}\nWas: PKR ${oldPrice.toLocaleString('en-PK')}\nNow: PKR ${newPrice.toLocaleString('en-PK')}\nYou save: PKR ${savings.toLocaleString('en-PK')} (${savingsPct}%)\n\nShop now: ${productUrl}\n\nCalnza © 2026 · Unsubscribe: ${appUrl}/unsubscribe`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Price Drop — Calnza</title>
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

              <!-- Savings badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="background:#E8D5B0;padding:10px 16px;">
                  <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#0A0A0A;">&#8595; ${savingsPct}% OFF — Price Drop</p>
                </td></tr>
              </table>

              <h1 style="margin:0 0 8px;font-size:30px;font-weight:800;color:#FFFFFF;letter-spacing:-0.01em;line-height:1.15;">Your wishlist<br/><span style="color:#E8D5B0;">just got cheaper.</span></h1>
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.7;">Hi ${name}, an item you saved dropped in price. Here's your chance to grab it.</p>
            </td>
          </tr>

          <!-- Product Card -->
          <tr>
            <td style="background:#111111;border:1px solid #1E1E1E;border-top:none;padding:32px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #2A2A2A;margin-bottom:24px;">
                <tr>
                  ${productImageUrl ? `
                  <td style="width:120px;vertical-align:top;">
                    <img src="${productImageUrl}" width="120" height="150" style="display:block;object-fit:cover;" alt="${productName}" />
                  </td>` : ''}
                  <td style="padding:24px;vertical-align:middle;">
                    <p style="margin:0 0 16px;font-size:17px;font-weight:800;color:#FFFFFF;line-height:1.3;">${productName}</p>

                    <!-- Price comparison -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="padding-right:20px;border-right:1px solid #2A2A2A;">
                          <p style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Was</p>
                          <p style="margin:0;font-size:14px;color:#555555;text-decoration:line-through;">PKR ${oldPrice.toLocaleString('en-PK')}</p>
                        </td>
                        <td style="padding-left:20px;">
                          <p style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#E8D5B0;">Now</p>
                          <p style="margin:0;font-size:20px;font-weight:900;color:#E8D5B0;">PKR ${newPrice.toLocaleString('en-PK')}</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 16px;font-size:11px;color:#555555;">You save <strong style="color:#E8D5B0;">PKR ${savings.toLocaleString('en-PK')}</strong></p>
                    <a href="${productUrl}" style="display:inline-block;background:#E8D5B0;color:#0A0A0A;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:12px 28px;">Buy Now</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:11px;color:#444444;text-align:center;">Sale prices don't last forever. Stock is not guaranteed.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;border-top:none;padding:28px 48px;">
              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
              <p style="margin:6px 0 0;font-size:9px;color:#333333;line-height:1.6;">© 2026 · You received this because this item is on your wishlist. <a href="${appUrl}/unsubscribe" style="color:#444444;text-decoration:underline;">Unsubscribe</a></p>
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
