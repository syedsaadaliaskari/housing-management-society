import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billId, amount, description } = await req.json();

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description || "Society Bill Payment",
              description: `Bill ID: ${billId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        billId: String(billId),
        userId: String(session.user?.id),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/resident/bills?success=true&billId=${billId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/resident/bills?cancelled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Payment failed to initialize" },
      { status: 500 },
    );
  }
}
