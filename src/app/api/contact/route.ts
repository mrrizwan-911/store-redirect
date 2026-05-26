import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/utils/rateLimit";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitErr = await checkRateLimit(rateLimiters.api, clientIp);
    if (rateLimitErr) return rateLimitErr;

    const body = await req.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const inquiry = await db.inquiry.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        subject: result.data.subject || "No Subject",
        message: result.data.message,
      },
    });

    logger.info(`New contact inquiry received from ${result.data.email}`, { inquiryId: inquiry.id });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully. Our concierge will contact you soon.",
    });
  } catch (error) {
    logger.error("Contact Form Submission Error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
