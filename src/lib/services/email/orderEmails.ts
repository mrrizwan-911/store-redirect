import { sendEmail } from './sender'
import { orderConfirmTemplate } from './templates/orderConfirm'
import { orderShippedTemplate } from './templates/orderShipped'
import { orderDeliveredTemplate } from './templates/orderDelivered'
import { orderProcessingTemplate } from './templates/orderProcessing'
import { orderCancelledTemplate } from './templates/orderCancelled'
import { orderRefundedTemplate } from './templates/orderRefunded'

export async function sendOrderConfirmationEmail(order: any, user: any) {
  if (!user?.email) return false

  const { subject, html, text } = orderConfirmTemplate(user.name, order.orderNumber, order.items, order.total)

  return sendEmail({
    to: user.email,
    subject,
    html,
    text,
    type: 'order_confirmation',
    userId: user.id
  })
}

export async function sendOrderProcessingEmail(order: any, user: any) {
  if (!user?.email) return false

  const { subject, html, text } = orderProcessingTemplate(user.name, order.orderNumber, order.items, order.total)

  return sendEmail({
    to: user.email,
    subject,
    html,
    text,
    type: 'order_processing',
    userId: user.id
  })
}

export async function sendOrderShippedEmail(order: any, user: any, trackingNumber: string, carrier?: string) {
  if (!user?.email) return false

  const { subject, html, text } = orderShippedTemplate(user.name, order.orderNumber, trackingNumber, carrier)

  return sendEmail({
    to: user.email,
    subject,
    html,
    text,
    type: 'order_shipped',
    userId: user.id
  })
}

export async function sendOrderDeliveredEmail(order: any, user: any, pointsEarned: number = 0) {
  if (!user?.email) return false

  const { subject, html, text } = orderDeliveredTemplate(user.name, order.orderNumber, pointsEarned)

  return sendEmail({
    to: user.email,
    subject,
    html,
    text,
    type: 'order_delivered',
    userId: user.id
  })
}

export async function sendOrderCancelledEmail(order: any, user: any) {
  if (!user?.email) return false

  const { subject, html, text } = orderCancelledTemplate(user.name, order.orderNumber, order.items, order.total)

  return sendEmail({
    to: user.email,
    subject,
    html,
    text,
    type: 'order_cancelled',
    userId: user.id
  })
}

export async function sendOrderRefundedEmail(order: any, user: any) {
  if (!user?.email) return false

  const { subject, html, text } = orderRefundedTemplate(user.name, order.orderNumber, order.items, order.total)

  return sendEmail({
    to: user.email,
    subject,
    html,
    text,
    type: 'order_refunded',
    userId: user.id
  })
}
