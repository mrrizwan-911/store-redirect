import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { getUserSession } from "@/lib/auth/session";
import { sendEmail } from "@/lib/services/email/sender";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import { escapeHtml, safeEmailLink } from "@/lib/utils/sanitize";
import { createUnsubscribeUrl } from "@/lib/utils/unsubscribeToken";

const broadcastSchema = z.object({
  subject: z.string().min(3),
  header: z.string().min(3),
  body: z.string().min(10),
  ctaLabel: z.string().default("Shop Now"),
  ctaLink: z.string().default("/products"),
  segment: z.enum(["all", "recent", "unsubscribed"]).default("all"),
});

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const session = await getUserSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json();
    const result = broadcastSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { subject, header, body: content, ctaLabel, ctaLink, segment } = result.data;
    const safeHeader = escapeHtml(header);
    const safeContent = escapeHtml(content).replace(/\n/g, "<br/>");
    const safeCtaLabel = escapeHtml(ctaLabel);
    const safeCtaLink = safeEmailLink(ctaLink);

    // 3. Fetch targeted subscribers
    let where: any = { status: "ACTIVE" };
    if (segment === "recent") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: thirtyDaysAgo };
    } else if (segment === "unsubscribed") {
      where.status = "UNSUBSCRIBED";
    }

    const subscribers = await db.subscriber.findMany({ where });

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No subscribers found for this segment." });
    }

    // 4. Build HTML template (Minimal Luxury Style)
    const emailHtml = (email: string) => `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; color: #000;">
        <div style="text-align: center; margin-bottom: 40px;">
          <p style="font-size: 10px; font-weight: 700; letter-spacing: 0.35em; text-transform: uppercase; color: #000;">CALNZA</p>
        </div>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; margin-bottom: 24px;">${safeHeader}</h1>
        <div style="font-size: 14px; line-height: 1.8; color: #444; margin-bottom: 40px; white-space: pre-wrap;">
          ${safeContent}
        </div>
        <div style="text-align: center; margin-bottom: 40px;">
          <a href="${safeCtaLink.startsWith('https://') ? safeCtaLink : `${process.env.NEXT_PUBLIC_APP_URL || 'https://calnza.com'}${safeCtaLink}`}"
             style="display: inline-block; padding: 18px 48px; background: #000; color: #fff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">
            ${safeCtaLabel}
          </a>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
          <p style="font-size: 10px; color: #999; line-height: 1.6;">
            © 2026 CALNZA. All rights reserved.<br/>
            You are receiving this because you are subscribed to our inner circle.<br/>
            <a href="${createUnsubscribeUrl(email)}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;

    // 5. Dispatch Emails (Parallel with individual logging)
    // In a real production app with thousands of users, we'd use a background queue (e.g. BullMQ, Upstash QStash)
    const sendResults = await Promise.allSettled(
      subscribers.map((sub) =>
        sendEmail({
          to: sub.email,
          subject,
          html: emailHtml(sub.email),
          type: "MARKETING",
        })
      )
    );

    const successCount = sendResults.filter((r) => r.status === "fulfilled" && r.value).length;

    logger.info(`Broadcast: "${subject}" sent to ${successCount} subscribers (Segment: ${segment})`);

    return NextResponse.json({
      success: true,
      count: successCount,
      message: `Broadcast successfully sent to ${successCount} subscribers.`
    });

  } catch (error) {
    logger.error("Broadcast Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send broadcast." },
      { status: 500 }
    );
  }
}
