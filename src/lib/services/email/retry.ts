import { db } from '@/lib/db/client'
import { sendEmail } from '@/lib/services/email/sender'

function labelFromType(type: string) {
  return type
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

export async function retryEmailLog(logId: string) {
  const log = await db.emailLog.findUnique({ where: { id: logId } })
  if (!log) return { ok: false as const, status: 404, error: 'Notification log not found' }

  const retryCount = log.retryCount + 1
  const label = labelFromType(log.type)
  const success = await sendEmail({
    to: log.email,
    subject: `CALNZA Notification Retry: ${label}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px; border: 1px solid #eee; color: #111;">
        <h1 style="font-size: 20px; letter-spacing: 0.08em; text-transform: uppercase;">CALNZA Notification</h1>
        <p style="font-size: 14px; line-height: 1.7; color: #444;">
          We are retrying a previous ${label} notification because the original delivery was marked as failed or was requested for resend by an administrator.
        </p>
        <p style="font-size: 12px; color: #777;">If you recently contacted support, no further action is required.</p>
      </div>
    `,
    text: `CALNZA Notification Retry: ${label}`,
    type: `${log.type}_retry`,
    userId: log.userId || undefined,
  }, retryCount)

  await db.emailLog.update({
    where: { id: logId },
    data: {
      status: success ? 'retried' : 'retry_failed',
      retryCount,
    },
  })

  return { ok: success, status: success ? 200 : 502, error: success ? null : 'Retry email failed' }
}
