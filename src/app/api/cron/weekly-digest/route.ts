import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sendEmail } from "@/lib/services/email/sender";
import { logger } from "@/lib/utils/logger";

/**
 * Weekly New Arrivals Digest Cron
 * Triggered every Friday (or manual)
 */
export async function GET(req: Request) {
  try {
    // 1. Auth check (Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch products added in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newArrivals = await db.product.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        isActive: true
      },
      take: 4,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (newArrivals.length === 0) {
      logger.info("Weekly Digest: No new arrivals this week. Skipping digest.");
      return NextResponse.json({ success: true, message: "No new products to showcase." });
    }

    // 3. Fetch active subscribers
    const subscribers = await db.subscriber.findMany({
      where: { status: "ACTIVE" }
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscribers." });
    }

    // 4. Build HTML template
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calnza.com';
    const productGridHtml = newArrivals.map(p => `
      <div style="margin-bottom: 30px;">
        <img src="${p.images[0]?.url || 'https://via.placeholder.com/400'}" alt="${p.name}" style="width: 100%; max-width: 260px; height: auto; border: 1px solid #eee;" />
        <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; margin: 15px 0 5px;">${p.name}</h3>
        <p style="font-size: 13px; color: #666; margin: 0;">PKR ${p.basePrice.toString()}</p>
        <a href="${appUrl}/products/${p.slug}" style="display: inline-block; margin-top: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #000; text-decoration: underline;">View Details</a>
      </div>
    `).join('');

    const digestHtml = (email: string) => `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: auto; border: 1px solid #000; padding: 40px; color: #000;">
        <div style="text-align: center; margin-bottom: 40px;">
          <p style="font-size: 10px; font-weight: 700; letter-spacing: 0.35em; text-transform: uppercase; color: #000;">CALNZA</p>
          <h2 style="font-family: 'Playfair Display', serif; font-size: 24px; text-transform: uppercase; letter-spacing: 0.1em; margin: 20px 0;">New Arrivals This Week</h2>
          <p style="font-size: 12px; color: #666;">A curated selection of our latest drops.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
          ${productGridHtml}
        </div>

        <div style="text-align: center; margin-bottom: 40px;">
          <a href="${appUrl}/products?sort=createdAt_desc"
             style="display: inline-block; padding: 18px 48px; background: #000; color: #fff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">
            Shop All New Arrivals
          </a>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
          <p style="font-size: 9px; color: #999; line-height: 1.6;">
            © 2026 CALNZA. All rights reserved.<br/>
            You're receiving this because you're part of our inner circle.<br/>
            <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #666;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;

    // 5. Dispatch Emails
    await Promise.allSettled(
      subscribers.map((sub) =>
        sendEmail({
          to: sub.email,
          subject: "The Weekly Drop | New Arrivals at CALNZA",
          html: digestHtml(sub.email),
          type: "MARKETING_DIGEST",
        })
      )
    );

    logger.info(`Weekly Digest sent to ${subscribers.length} subscribers.`);
    return NextResponse.json({ success: true, count: subscribers.length });

  } catch (error) {
    logger.error("Weekly Digest Cron Error:", error);
    return NextResponse.json({ success: false, error: "Cron execution failed." }, { status: 500 });
  }
}
