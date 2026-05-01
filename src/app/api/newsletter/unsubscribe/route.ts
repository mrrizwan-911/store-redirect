import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";

const unsubscribeSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = unsubscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    }

    const { email } = result.data;

    await db.subscriber.update({
      where: { email },
      data: { status: "UNSUBSCRIBED" },
    });

    logger.info(`Newsletter: User unsubscribed: ${email}`);

    return NextResponse.json({
      success: true,
      message: "You have been successfully unsubscribed from our newsletter.",
    });
  } catch (error) {
    logger.error("Newsletter Unsubscribe Error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
