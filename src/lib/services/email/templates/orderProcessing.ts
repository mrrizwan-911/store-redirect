interface OrderItem {
  product: { name: string; images: { url: string }[] }
  quantity: number
  price: any
}

function buildItemRows(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #1E1E1E;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:60px;vertical-align:top;">
              <img src="${item.product.images[0]?.url ?? ''}" width="52" height="65"
                style="display:block;object-fit:cover;background:#1A1A1A;" alt="${item.product.name}" />
            </td>
            <td style="padding-left:14px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#FFFFFF;line-height:1.4;">${item.product.name}</p>
              <p style="margin:0;font-size:11px;color:#555555;letter-spacing:0.08em;">Qty: ${item.quantity}</p>
            </td>
            <td align="right" valign="top">
              <p style="margin:0;font-size:13px;font-weight:700;color:#E8D5B0;white-space:nowrap;">PKR ${Number(item.price).toLocaleString('en-PK')}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join('')
}

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

export function orderProcessingTemplate(
  name: string,
  orderNumber: string,
  items: OrderItem[],
  total: any,
  whatsappNumber: string = ''
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const subject = `Order #${orderNumber} Is Being Prepared — Calnza`

  const textItems = items.map(i => `  ${i.product.name} × ${i.quantity}  —  PKR ${Number(i.price).toLocaleString('en-PK')}`).join('\n')
  const text = `CALNZA — Order Processing\n\nHi ${name},\n\nYour order #${orderNumber} is now being carefully prepared for shipment. We'll notify you as soon as it ships.\n\n${textItems}\n\nTotal: PKR ${Number(total).toLocaleString('en-PK')}\n\nTrack: ${appUrl}/account/orders\n\nCalnza © 2026`

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
        <tr><td style="background:#1A1A1A;border:1.5px solid #2A2A2A;padding:8px 16px;">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#FFFFFF;">&#9881; &nbsp;Processing</p>
        </td></tr>
      </table>
      <h1 style="margin:0 0 8px;font-size:30px;font-weight:800;color:#FFFFFF;letter-spacing:-0.01em;line-height:1.15;">We're preparing<br/><span style="color:#E8D5B0;">your order.</span></h1>
      <p style="margin:0;font-size:13px;color:#666666;line-height:1.7;">Hi ${name}, our team is carefully packing your items. You'll receive a shipping confirmation with a tracking number shortly.</p>
    </td>
  </tr>
  <tr>
    <td style="background:#111111;border:1px solid #1E1E1E;border-top:none;padding:0 48px;">
      <p style="margin:0;padding:24px 0 0;font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#444444;">Order Summary</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${buildItemRows(items)}
        <tr>
          <td style="padding:20px 0;border-top:1px solid #2A2A2A;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#FFFFFF;">Total</p>
          </td>
          <td align="right" style="padding:20px 0;border-top:1px solid #2A2A2A;">
            <p style="margin:0;font-size:18px;font-weight:800;color:#E8D5B0;">PKR ${Number(total).toLocaleString('en-PK')}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#0A0A0A;border:1px solid #1E1E1E;border-top:none;padding:32px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td align="center">
          <a href="${appUrl}/account/orders" style="display:inline-block;background:#E8D5B0;color:#0A0A0A;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:18px 48px;">View Order Status</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:11px;color:#444444;text-align:center;">Questions? <a href="https://wa.me/${whatsappNumber}" style="color:#E8D5B0;text-decoration:none;">WhatsApp us</a></p>
    </td>
  </tr>
  ${darkFooter(appUrl, whatsappNumber)}`

  return { subject, html: emailShell(content), text }
}
