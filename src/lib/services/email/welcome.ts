import { Resend } from 'resend'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { welcomeTemplate } from './templates/welcome'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!resend) {
    logger.warn('RESEND_API_KEY is missing. Skipping welcome email send in development.', { email })
    return
  }

  try {
    const { subject, html, text } = welcomeTemplate(name)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Calnza <noreply@calnza.com>'

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      logger.error('Failed to send welcome email', error, { email })
      // Do not throw: welcome email is non-critical
      return
    }

    logger.info('Welcome email sent', { email })

    await db.emailLog.create({
      data: { email, type: 'welcome', status: 'sent' },
    })
  } catch (err) {
    logger.error('Unexpected error sending welcome email', err, { email })
    // Do not throw
  }
}
