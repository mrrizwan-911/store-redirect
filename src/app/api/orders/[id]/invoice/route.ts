import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getUserSession } from '@/lib/auth/session';
import { generateOrderInvoicePDF } from '@/lib/services/pdf/generator';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Enhanced Auth: Check both Header (Tests) and Cookies (Browser)
    let userId: string | null = null;
    let userRole: string | null = null;

    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const session = await getUserSession();

    if (authHeader) {
      try {
        const payload = verifyAccessToken(authHeader);
        userId = payload.userId;
        userRole = payload.role;
      } catch (e) {
        // Fallback or ignore
      }
    }

    if (!userId && session) {
      userId = session.userId;
      userRole = session.role;
    }

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: {
        address: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    // Security check: Only the order owner or an admin can download the invoice
    if (order.userId !== userId && userRole !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const pdfBuffer = generateOrderInvoicePDF(order);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[INVOICE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
