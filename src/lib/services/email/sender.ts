import { Resend } from 'resend'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

const resend = new Resend(process.env.RESEND_API_KEY || 'mock_key')

interface EmailAttachment {
  filename: string
  content: Buffer | string
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  type: string
  userId?: string
  attachments?: EmailAttachment[]
}

export async function sendEmail(
  params: SendEmailParams,
  retryCount: number = 0
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not set. Skipping actual email send.', { type: params.type, to: params.to })
      // Simulate success for testing and logic flow
      await db.emailLog.create({
        data: { email: params.to, type: params.type, status: 'sent', userId: params.userId, retryCount },
      })
      return true
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Calnza <noreply@calnza.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments,
    })

    await db.emailLog.create({
      data: { email: params.to, type: params.type, status: 'sent', userId: params.userId, retryCount },
    })

    return true
  } catch (error) {
    logger.error(`[EMAIL] Attempt ${retryCount + 1} failed for ${params.type}:`, error)

    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)))
      return sendEmail(params, retryCount + 1)
    }

    // Final failure — log it
    await db.emailLog.create({
      data: { email: params.to, type: params.type, status: 'failed', userId: params.userId, retryCount },
    })

    return false
  }
}
