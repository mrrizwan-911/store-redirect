interface QuotationItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export function quotationSentTemplate(
  name: string,
  company: string | undefined,
  quotationNumber: string,
  items: QuotationItem[],
  subtotal: number,
  expiryDate: string,
  pdfUrl?: string
): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://calnza.com'
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  const subject = `Your Calnza Quotation #${quotationNumber} Is Ready`

  const textItems = items.map(i => `  ${i.name}  ×${i.quantity}  @ PKR ${i.unitPrice.toLocaleString('en-PK')}  =  PKR ${i.totalPrice.toLocaleString('en-PK')}`).join('\n')
  const text = `CALNZA — Quotation Ready\n\nHi ${name},\n\nYour quotation #${quotationNumber} is ready.\n${company ? `Company: ${company}\n` : ''}\n${textItems}\n\nSubtotal: PKR ${subtotal.toLocaleString('en-PK')}\nExpires: ${expiryDate}\n\n${pdfUrl ? `Download PDF: ${pdfUrl}\n` : ''}Convert to order: ${appUrl}/quotations/${quotationNumber}\nQuestions: https://wa.me/${whatsappNumber}\n\nCalnza © 2026`

  const itemRows = items.map(i => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1E1E1E;">
        <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#FFFFFF;">${i.name}</p>
        <p style="margin:0;font-size:11px;color:#555555;">Qty: ${i.quantity} @ PKR ${i.unitPrice.toLocaleString('en-PK')}</p>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #1E1E1E;white-space:nowrap;vertical-align:top;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#E8D5B0;">PKR ${i.totalPrice.toLocaleString('en-PK')}</p>
      </td>
    </tr>`).join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quotation Ready — Calnza</title>
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
                  <td><p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.35em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p></td>
                  <td align="right"><p style="margin:0;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#333333;">B2B Quotation</p></td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
                <tr><td style="background:transparent;border:1.5px solid #E8D5B0;padding:8px 16px;">
                  <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#E8D5B0;">&#128196; &nbsp;Quote Ready</p>
                </td></tr>
              </table>
              <h1 style="margin:0 0 8px;font-size:30px;font-weight:800;color:#FFFFFF;letter-spacing:-0.01em;line-height:1.15;">Your quote<br/><span style="color:#E8D5B0;">is prepared.</span></h1>
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.7;">Hi ${name}${company ? ` from <strong style="color:#999999;">${company}</strong>` : ''}, your quotation #${quotationNumber} has been prepared and is ready for review.</p>
            </td>
          </tr>

          <!-- Expiry warning -->
          <tr>
            <td style="background:#1A1A1A;border:1px solid #1E1E1E;border-top:none;padding:12px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><p style="margin:0;font-size:10px;color:#777777;letter-spacing:0.05em;">&#9203; This quote expires on</p></td>
                  <td align="right"><p style="margin:0;font-size:10px;font-weight:700;color:#E8D5B0;letter-spacing:0.1em;">${expiryDate}</p></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="background:#111111;border:1px solid #1E1E1E;border-top:none;padding:0 48px;">
              <p style="margin:0;padding:24px 0 0;font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#444444;">Quoted Items</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
                <tr>
                  <td style="padding:20px 0;border-top:1px solid #2A2A2A;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.1em;text-transform:uppercase;">Subtotal</p>
                  </td>
                  <td align="right" style="padding:20px 0;border-top:1px solid #2A2A2A;">
                    <p style="margin:0;font-size:20px;font-weight:800;color:#E8D5B0;">PKR ${subtotal.toLocaleString('en-PK')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTAs -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;border-top:none;padding:32px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr><td align="center">
                  <a href="${appUrl}/quotations/${quotationNumber}" style="display:inline-block;background:#E8D5B0;color:#0A0A0A;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:18px 48px;">Accept &amp; Convert to Order</a>
                </td></tr>
              </table>
              ${pdfUrl ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr><td align="center">
                  <a href="${pdfUrl}" style="display:inline-block;border:1.5px solid #2A2A2A;color:#888888;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:16px 48px;">&#8659; Download PDF Quote</a>
                </td></tr>
              </table>` : ''}
              <p style="margin:0;font-size:11px;color:#444444;text-align:center;">Need changes? <a href="https://wa.me/${whatsappNumber}" style="color:#E8D5B0;text-decoration:none;">WhatsApp us</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A0A0A;border:1px solid #1E1E1E;border-top:none;padding:28px 48px;">
              <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#E8D5B0;">CALNZA</p>
              <p style="margin:6px 0 0;font-size:9px;color:#333333;">© 2026 · <a href="${appUrl}" style="color:#555555;text-decoration:none;">calnza.com</a></p>
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
