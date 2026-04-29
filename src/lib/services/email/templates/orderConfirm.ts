interface OrderItem {
  product: { name: string; images: { url: string }[] }
  quantity: number
  price: any
}

export function orderConfirmTemplate(
  name: string,
  orderNumber: string,
  items: OrderItem[],
  total: any
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  const subject = `Order Confirmed #${orderNumber} — Thank you, ${name}`

  const textItems = items
    .map(i => `  ${i.product.name} × ${i.quantity}  —  PKR ${Number(i.price).toLocaleString('en-PK')}`)
    .join('\n')

  const text = `
CALNZA — Order Confirmed

Hi ${name}, your order has been placed successfully.

Order #${orderNumber}

${textItems}

────────────────────
Total: PKR ${Number(total).toLocaleString('en-PK')}

Track your order: ${appUrl}/account/orders
WhatsApp support: https://wa.me/${whatsappNumber}

CALNZA © 2026
`.trim()

  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #1E1E1E;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:64px;vertical-align:top;">
              <img src="${item.product.images[0]?.url ?? ''}" width="56" height="70"
                style="display:block;object-fit:cover;background:#1A1A1A;" alt="${item.product.name}" />
            </td>
            <td style="padding-left:16px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#FFFFFF;line-height:1.4;">${item.product.name}</p>
              <p style="margin:0;font-size:11px;color:#555555;letter-spacing:0.1em;">Qty: ${item.quantity}</p>
            </td>
            <td align="right" style="vertical-align:top;white-space:nowrap;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#E8D5B0;">PKR ${Number(item.price).toLocaleString('en-PK')}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed — Calnza</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D0D;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;padding:40px 48px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#333333;">Order Confirmed</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 24px;">
                <tr>
                  <td style="background:#E8D5B0;padding:10px 16px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0A0A0A;">&#10003; &nbsp;Confirmed</p>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px;font-size:30px;font-weight:800;line-height:1.15;letter-spacing:-0.01em;color:#FFFFFF;">Thank you,<br/>${name}.</h1>
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.6;">Your order has been placed and is being reviewed. We'll send you another update when it starts processing.</p>
            </td>
          </tr>

          <!-- Order Number Strip -->
          <tr>
            <td style="background:#E8D5B0;padding:14px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:9px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#0A0A0A;">Order Number</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:800;color:#0A0A0A;letter-spacing:0.05em;">#${orderNumber}</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:9px;color:#6B5A3A;letter-spacing:0.1em;text-transform:uppercase;">Keep for reference</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="background:#111111;border:1px solid #1E1E1E;border-top:none;padding:0 48px;">
              <p style="margin:0;padding:24px 0 0;font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#444444;">Your Items</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>

              <!-- Total -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2A2A2A;margin-top:0;">
                <tr>
                  <td style="padding:20px 0;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#FFFFFF;">Order Total</p>
                  </td>
                  <td align="right" style="padding:20px 0;">
                    <p style="margin:0;font-size:20px;font-weight:800;color:#E8D5B0;">PKR ${Number(total).toLocaleString('en-PK')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;border-top:none;padding:32px 48px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/account/orders" style="display:inline-block;background:#E8D5B0;color:#0A0A0A;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:18px 48px;">
                      Track My Order
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:11px;color:#444444;text-align:center;line-height:1.6;">
                Questions? <a href="https://wa.me/${whatsappNumber}" style="color:#E8D5B0;text-decoration:none;">WhatsApp us</a> — we reply within minutes.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:9px;color:#333333;line-height:1.7;">
                      CALNZA · Clothes, Shoes, Apparel &amp; Accessories · © 2026<br/>
                      <a href="${appUrl}/account" style="color:#444444;text-decoration:underline;">Your Account</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${appUrl}" style="color:#444444;text-decoration:underline;">Shop</a>
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
`.trim()

  return { subject, html, text }
}
