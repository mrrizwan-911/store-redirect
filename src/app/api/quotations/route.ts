import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";
import { quotationSchema } from "@/lib/validations/quotation";
import { QuotationStatus } from "@prisma/client";
import { getUserSession } from "@/lib/auth/session";
import { generateQuotationDraft } from "@/lib/services/ai/quotation-draft";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/utils/rateLimit";
import { verifyTurnstile } from "@/lib/utils/verifyTurnstile";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitErr = await checkRateLimit(rateLimiters.api, clientIp);
    if (rateLimitErr) return rateLimitErr;

    const session = await getUserSession();
    const body = await req.json();

    if (!body.turnstileToken) {
      return NextResponse.json({ success: false, error: "Security verification is required" }, { status: 403 });
    }

    const isHuman = await verifyTurnstile(body.turnstileToken, clientIp);
    if (!isHuman) {
      return NextResponse.json({ success: false, error: "Security verification failed" }, { status: 403 });
    }

    const validatedData = quotationSchema.parse(body);
    logger.info("Public quotation creation request", {
      hasUser: Boolean(session?.userId),
      itemCount: validatedData.items.length,
      country: validatedData.country,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Fetch product names for the AI draft context
    const productIds = validatedData.items.map((i: any) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        basePrice: true,
        variants: {
          select: { id: true, title: true }
        }
      },
    });

    // Enrich items with names for the initial AI draft
    const enrichedItems = validatedData.items.map((item: any) => {
      const p = products.find((prod) => prod.id === item.productId);
      const v = item.variantId ? p?.variants.find((varnt) => varnt.id === item.variantId) : null;
      return {
        ...item,
        productName: p?.name || "Unknown Product",
        variantName: v?.title || undefined,
      };
    });

    // Create a plain object for data to ensure no prototype issues
    const data: any = {
      userId: session?.userId || null,
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || null,
      company: validatedData.company || null,
      addressLine1: validatedData.addressLine1,
      addressLine2: validatedData.addressLine2 || null,
      city: validatedData.city,
      province: validatedData.province,
      postalCode: validatedData.postalCode,
      country: validatedData.country,
      items: JSON.parse(JSON.stringify(validatedData.items)), // Ensure items is a plain serializable object
      status: QuotationStatus.PENDING,
      expiresAt,
      aiDraft: "Acknowledgment draft pending...",
    };

    logger.info("Sending quotation to Prisma", {
      hasUser: Boolean(data.userId),
      itemCount: validatedData.items.length,
      country: data.country,
    });

    try {
      const quotation = await db.quotation.create({ data });

      // Generate initial AI Draft asynchronously so it doesn't block the UI
      const draftInput = { ...quotation, items: enrichedItems };
      generateQuotationDraft(draftInput)
        .then(async (aiDraft) => {
          await db.quotation.update({
            where: { id: quotation.id },
            data: { aiDraft }
          });
        })
        .catch((aiError) => {
          logger.error("Failed to generate initial AI draft", aiError as Error);
        });

      return NextResponse.json({ success: true, data: quotation }, { status: 201 });
    } catch (dbError: any) {
      logger.error("Prisma create error", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Internal Server Error",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: error.issues?.[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    logger.error("Failed to create quotation", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
