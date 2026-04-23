import { Resend } from 'resend'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { forgotPasswordTemplate } from './templates/forgotPassword'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendForgotPasswordEmail(email: string, name: string, resetUrl: string): Promise<void> {
  if (!resend) {
    logger.warn('RESEND_API_KEY is missing. Skipping email send in development.', { email, resetUrl })
    return
  }

  const { subject, html, text } = forgotPasswordTemplate(name, resetUrl)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Calnza <noreply@calnza.com>'

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject,
    html,
    text,
  })

  if (error) {
    logger.error('Failed to send Forgot Password email', error, { email })
    throw new Error(`Resend error: ${error.message}`)
  }

  logger.info('Forgot Password email sent', { email })

  await db.emailLog.create({
    data: { email, type: 'forgot_password', status: 'sent' },
  })
}
