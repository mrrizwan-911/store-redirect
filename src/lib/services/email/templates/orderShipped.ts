export function orderShippedTemplate(name: string, orderNumber: string, trackingNumber: string, carrier?: string): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourstore.com'
  const subject = `Your order is on its way! — #${orderNumber}`

  // Tracking Link Logic for Pakistani Carriers
  let trackingUrl = `${appUrl}/account`
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

  const text = `Hi ${name},

Your order #${orderNumber} has been shipped${carrier ? ` via ${carrier}` : ''}!

Tracking Number: ${trackingNumber}

Track your order: ${trackingUrl}

CALNZA © 2026`.trim()

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="520" style="background:#141414;border:1px solid #222;max-width:520px;width:100%;">
        <tr><td style="padding:32px;">
          <h2 style="color:#E8D5B0;font-size:22px;margin:0 0 8px;">Your order is on its way!</h2>
          <p style="color:#888;font-size:14px;margin:0 0 24px;">Hi ${name}, your order #${orderNumber} has been shipped${carrier ? ` via <strong>${carrier}</strong>` : ''}.</p>

          <div style="background:#0A0A0A;border:1px solid #222;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="color:#F5F5F5;font-size:12px;margin:0 0 8px;text-transform:uppercase;tracking:2px;">Tracking Number</p>
            <p style="color:#E8D5B0;font-size:24px;font-weight:bold;margin:0;letter-spacing:1px;">${trackingNumber}</p>
          </div>

          <div style="text-align:center;margin:32px 0;">
            <a href="${trackingUrl}"
               style="background:#E8D5B0;color:#0A0A0A;padding:14px 32px;text-decoration:none;font-weight:600;display:inline-block;text-transform:uppercase;letter-spacing:1px;font-size:12px;">
              Track your package
            </a>
          </div>

          <p style="color:#666;font-size:11px;text-align:center;margin-top:40px;">
            If you have any questions about your delivery, please contact the carrier directly or reply to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()

  return { subject, html, text }
}
