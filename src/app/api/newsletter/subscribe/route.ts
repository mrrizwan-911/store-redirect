import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { generateWelcomeCoupon } from "@/lib/services/marketing/coupon";
import { sendEmail } from "@/lib/services/email/sender";
import { newsletterWelcomeTemplate } from "@/lib/services/email/templates/newsletterWelcome";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  source: z.string().optional().default("HOMEPAGE"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, source } = result.data;

    // 1. Check if already a subscriber
    const existing = await db.subscriber.findUnique({
      where: { email },
    });

    if (existing && existing.status === "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This email is already subscribed to our newsletter." },
        { status: 400 }
      );
    }

    // 2. Upsert subscriber (handles re-subscribing)
    await db.subscriber.upsert({
      where: { email },
      update: {
        status: "ACTIVE",
        source,
        updatedAt: new Date()
      },
      create: {
        email,
        source,
        status: "ACTIVE"
      },
    });

    // 3. Check for previous orders to decide on welcome gift
    const previousOrder = await db.order.findFirst({
      where: {
        OR: [
          { address: { email } },
          { user: { email } }
        ]
      }
    });

    const hasOrderedBefore = !!previousOrder;

    if (!hasOrderedBefore) {
      // 4. Generate Welcome Incentive (10% Off) for FIRST TIME subscribers only
      const coupon = await generateWelcomeCoupon(email);

      // 5. Send Welcome Email with Coupon
      const { subject, html, text } = newsletterWelcomeTemplate(coupon.code);

      await sendEmail({
        to: email,
        subject,
        html,
        text,
        type: "MARKETING",
      });
      logger.info(`Newsletter: Welcome coupon sent to ${email}`);
    } else {
      // Send a generic welcome email without a coupon
      await sendEmail({
        to: email,
        subject: "Welcome to CALNZA | Subscription Confirmed",
        html: `
          <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: auto; border: 1px solid #000; padding: 40px; color: #000;">
            <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;">Welcome Back to CALNZA</h1>
            <p style="text-align: center; font-size: 14px; line-height: 1.6; color: #666;">
              Thank you for re-joining our inner circle. We're glad to have you back.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" style="display: inline-block; padding: 15px 30px; background: #000; color: #fff; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Shop New Arrivals</a>
            </div>
          </div>
        `,
        text: "Welcome back to CALNZA! Your subscription has been confirmed.",
        type: "MARKETING",
      });
      logger.info(`Newsletter: Generic welcome sent to ${email} (Existing customer)`);
    }

    logger.info(`Newsletter: New subscriber registered: ${email} (Source: ${source})`);

    return NextResponse.json({
      success: true,
      message: "Subscription successful! Check your email for your welcome gift."
    });

  } catch (error) {
    logger.error("Newsletter Subscription Error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during subscription. Please try again later." },
      { status: 500 }
    );
  }
}
