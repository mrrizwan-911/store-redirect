import { Resend } from 'resend'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function adminInviteTemplate(invitedBy: string, acceptUrl: string, expiresHours = 48) {
  const subject = `You've been invited to manage Calnza`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Admin Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;letter-spacing:0.5em;color:#fff;font-weight:300;text-transform:uppercase;">Calnza</p>
            <p style="margin:6px 0 0;font-size:9px;letter-spacing:0.3em;color:rgba(255,255,255,0.45);text-transform:uppercase;">Admin Access</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 20px;font-size:13px;color:#888;letter-spacing:0.2em;text-transform:uppercase;">You're Invited</p>
            <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a;font-weight:400;line-height:1.3;">
              Join Calnza as an Admin
            </h2>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
              <strong style="color:#0a0a0a;">${invitedBy}</strong> has invited you to access
              the Calnza admin dashboard. Click the button below to set up your password and
              get started. This invite expires in <strong>${expiresHours} hours</strong>.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td style="background:#0a0a0a;border-radius:2px;">
                  <a href="${acceptUrl}"
                     style="display:block;padding:16px 40px;font-size:11px;letter-spacing:0.3em;color:#fff;text-decoration:none;text-transform:uppercase;font-weight:600;">
                    Accept Invitation →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#aaa;line-height:1.6;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin:0;font-size:11px;color:#0a0a0a;word-break:break-all;">
              <a href="${acceptUrl}" style="color:#0a0a0a;">${acceptUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:11px;color:#bbb;line-height:1.7;text-align:center;">
              If you didn't expect this invitation, you can safely ignore this email.<br/>
              © 2026 Calnza · Lahore &amp; London
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `You've been invited to manage Calnza by ${invitedBy}.\n\nAccept your invitation here:\n${acceptUrl}\n\nThis invite expires in ${expiresHours} hours.\n\nIf you didn't expect this, ignore this email.`

  return { subject, html, text }
}

export async function sendAdminInviteEmail(
  toEmail: string,
  invitedBy: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calnza.pk'
  const acceptUrl = `${baseUrl}/accept-invite?token=${token}`

  if (!resend) {
    logger.warn('[AdminInvite] RESEND_API_KEY not set — invite link:', { toEmail, acceptUrl })
    return
  }

  const { subject, html, text } = adminInviteTemplate(invitedBy, acceptUrl)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Calnza <noreply@calnza.pk>'

  const { error } = await resend.emails.send({ from: fromEmail, to: toEmail, subject, html, text })

  if (error) {
    logger.error('[AdminInvite] Failed to send invite email', error, { toEmail })
    throw new Error(`Email send failed: ${error.message}`)
  }

  logger.info('[AdminInvite] Invite email sent', { toEmail })

  await db.emailLog.create({
    data: { email: toEmail, type: 'admin_invite', status: 'sent' },
  })
}
