import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";
import { quotationSchema } from "@/lib/validations/quotation";
import { QuotationStatus } from "@prisma/client";
import { getUserSession } from "@/lib/auth/session";
import { generateQuotationDraft } from "@/lib/services/ai/quotation-draft";

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    const body = await req.json();
    logger.request("Public quotation creation request", body);

    const validatedData = quotationSchema.parse(body);
    logger.info("Quotation validated data", { validatedData });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Fetch product names for the AI draft context
    const productIds = validatedData.items.map((i: any) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, basePrice: true },
    });

    // Enrich items with names for the initial AI draft
    const enrichedItems = validatedData.items.map((item: any) => {
      const p = products.find((prod) => prod.id === item.productId);
      return {
        ...item,
        productName: p?.name || "Unknown Product",
      };
    });

    // Create a plain object for data to ensure no prototype issues
    const data: any = {
      userId: session?.userId || null,
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone || null,
      company: validatedData.company || null,
      items: JSON.parse(JSON.stringify(validatedData.items)), // Ensure items is a plain serializable object
      status: QuotationStatus.PENDING,
      expiresAt,
      aiDraft: "Acknowledgment draft pending...",
    };

    // Log the exact data being sent to Prisma for debugging
    logger.info("Sending to Prisma", { data });

    try {
      const quotation = await db.quotation.create({ data });

      // Generate initial AI Draft immediately as per DAY-08 Spec
      try {
        const draftInput = { ...quotation, items: enrichedItems };
        const aiDraft = await generateQuotationDraft(draftInput);

        await db.quotation.update({
          where: { id: quotation.id },
          data: { aiDraft }
        });

        quotation.aiDraft = aiDraft;
      } catch (aiError) {
        logger.error("Failed to generate initial AI draft", aiError as Error);
      }

      return NextResponse.json({ success: true, data: quotation }, { status: 201 });
    } catch (dbError: any) {
      logger.error("Prisma create error", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        data // Log the data that caused the error
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
