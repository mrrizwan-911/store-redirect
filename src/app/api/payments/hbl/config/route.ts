import { NextResponse } from 'next/server'

/**
 * HBL Public Config Route.
 * Returns non-sensitive configuration needed by the frontend (like the checkout JS URL).
 */
export async function GET() {
  return NextResponse.json({
    checkoutJsUrl: process.env.HBL_CHECKOUT_JS_URL || 'https://hblpay.hbl.com/checkout/version/56/checkout.js',
    merchantName: process.env.HBL_MERCHANT_NAME || 'E-Commerce Store',
    mode: process.env.HBL_MODE || 'test',
  })
}
