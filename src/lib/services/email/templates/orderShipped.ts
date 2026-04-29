export function orderShippedTemplate(
  name: string,
  orderNumber: string,
  trackingNumber: string,
  carrier?: string
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const subject = `It's on its way, ${name} — Order #${orderNumber} Shipped`

  // Pakistani courier tracking links
  let trackingUrl = `${appUrl}/account/orders`
  const carrierUpper = carrier?.toUpperCase() || ''
  if (carrierUpper === 'TCS') {
    trackingUrl = `https://www.tcsexpress.com/tracking/tracking-results?trackingNo=${trackingNumber}`
  } else if (carrierUpper === 'LEOPARDS' || carrierUpper === 'LEOPARD') {
    trackingUrl = `https://www.leopardscourier.com/leopards-tracking?track-number=${trackingNumber}`
  } else if (carrierUpper === 'TRAX') {
    trackingUrl = `https://trax.pk/tracking/?tracking_number=${trackingNumber}`
  } else if (carrierUpper === 'M&P' || carrierUpper === 'MNP') {
    trackingUrl = `https://www.mulphilog.com/tracking-details?tracking_number=${trackingNumber}`
  }

  const carrierLine = carrier ? `via ${carrier}` : ''

  const text = `
CALNZA — Your Order Is Shipped

Hi ${name},

Your order #${orderNumber} has left our facility ${carrierLine} and is on its way to you.

Tracking Number: ${trackingNumber}
${carrier ? `Carrier: ${carrier}` : ''}

Track here: ${trackingUrl}

CALNZA © 2026
`.trim()

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Shipped — Calnza</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D0D;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;padding:40px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#333333;">#${orderNumber}</p>
                  </td>
                </tr>
              </table>

              <!-- Shipped badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 24px;">
                <tr>
                  <td style="background:transparent;border:1.5px solid #E8D5B0;padding:8px 16px;">
                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#E8D5B0;">&#9992; &nbsp;In Transit</p>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px;font-size:32px;font-weight:800;line-height:1.15;color:#FFFFFF;letter-spacing:-0.01em;">Your order is<br/><span style="color:#E8D5B0;">on its way.</span></h1>
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.7;">Hi ${name}, we've handed your order to the courier. Here's everything you need to track it.</p>
            </td>
          </tr>

          <!-- Tracking Block -->
          <tr>
            <td style="background:#111111;border:1px solid #1E1E1E;border-top:none;padding:40px 48px;">

              <!-- Progress Track Visual -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td align="center" style="width:25%;">
                    <div style="width:10px;height:10px;background:#E8D5B0;border-radius:50%;margin:0 auto 8px;font-size:0;">&nbsp;</div>
                    <p style="margin:0;font-size:9px;font-weight:700;color:#E8D5B0;letter-spacing:0.1em;text-transform:uppercase;">Placed</p>
                  </td>
                  <td style="border-top:2px solid #E8D5B0;position:relative;"></td>
                  <td align="center" style="width:25%;">
                    <div style="width:10px;height:10px;background:#E8D5B0;border-radius:50%;margin:0 auto 8px;font-size:0;">&nbsp;</div>
                    <p style="margin:0;font-size:9px;font-weight:700;color:#E8D5B0;letter-spacing:0.1em;text-transform:uppercase;">Shipped</p>
                  </td>
                  <td style="border-top:2px solid #2A2A2A;"></td>
                  <td align="center" style="width:25%;">
                    <div style="width:10px;height:10px;background:#2A2A2A;border-radius:50%;margin:0 auto 8px;border:2px solid #3A3A3A;font-size:0;">&nbsp;</div>
                    <p style="margin:0;font-size:9px;color:#444444;letter-spacing:0.1em;text-transform:uppercase;">Delivered</p>
                  </td>
                </tr>
              </table>

              <!-- Tracking Number -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border:1px solid #2A2A2A;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #1A1A1A;">
                    <p style="margin:0;font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#555555;">Tracking Number</p>
                    <p style="margin:8px 0 0;font-size:24px;font-weight:900;color:#FFFFFF;letter-spacing:0.1em;font-family:'Courier New',Courier,monospace;">${trackingNumber}</p>
                  </td>
                </tr>
                ${carrier ? `
                <tr>
                  <td style="padding:14px 24px;">
                    <p style="margin:0;font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#555555;">Courier</p>
                    <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:#FFFFFF;">${carrier}</p>
                  </td>
                </tr>` : ''}
              </table>

              <!-- Track CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${trackingUrl}" style="display:inline-block;background:#E8D5B0;color:#0A0A0A;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:18px 48px;">
                      Track My Package
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;border-top:none;padding:28px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
                    <p style="margin:6px 0 0;font-size:9px;color:#333333;line-height:1.6;">© 2026 · <a href="${appUrl}" style="color:#555555;text-decoration:none;">calnza.com</a></p>
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
