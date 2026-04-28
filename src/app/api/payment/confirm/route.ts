import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";

export const runtime = "nodejs";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

class MockPaymentProvider {
  async charge(_amount: number) {
    return {
      success: true,
      providerRef: `MOCK_PAY_${Date.now()}`,
    };
  }
}

const generateTravelPass = async (travelPassId: string, journeyId: string) => {
  const payload = {
    travelPassId,
    journeyId,
    issuedAt: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(payload);

  const qrDataUrl = await QRCode.toDataURL(dataStr, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
    color: {
      dark: "#FFFFFF",
      light: "#00000000",
    },
  });

  return qrDataUrl;
};

const bookTicketsAndGeneratePasses = async (journeyId: string) => {
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    include: {
      legs: {
        include: {
          ticket: true,
          travelPass: true,
        },
      },
    },
  });

  if (!journey) throw new Error("Journey not found");

  for (const leg of journey.legs) {
    if (leg.ticket && leg.travelPass) continue;

    const ticket =
      leg.ticket ??
      (await prisma.ticket.create({
        data: {
          journeyLegId: leg.id,
          provider: "MOCK",
          status: "CONFIRMED",
        },
      }));

    let qrData: string | null = null;

    if (leg.mode !== "WALK") {
      qrData = await generateTravelPass(ticket.id, journeyId);
    }

    if (!leg.travelPass) {
      await prisma.legTravelPass.create({
        data: {
          journeyLegId: leg.id,
          qrData,
          validFrom: new Date(),
          validTill: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
      });
    }
  }
};

const confirmPaymentService = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) throw new Error("Payment not found");

  const provider = new MockPaymentProvider();
  const result = await provider.charge(payment.amount);

  if (!result.success) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED" },
    });
    throw new Error("Payment failed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        providerRef: result.providerRef,
      },
    });

    await tx.journey.update({
      where: { id: payment.journeyId },
      data: { status: "BOOKED" },
    });
  });

  return {
    success: true,
    journeyId: payment.journeyId,
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId required" },
        { status: 400 }
      );
    }

    const result = await confirmPaymentService(paymentId);

    if (!result.success) {
      return NextResponse.json(
        { error: "Payment failed" },
        { status: 400 }
      );
    }

    await bookTicketsAndGeneratePasses(result.journeyId);

    return NextResponse.json({
      success: true,
      journeyId: result.journeyId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to confirm payment" },
      { status: 500 }
    );
  }
}