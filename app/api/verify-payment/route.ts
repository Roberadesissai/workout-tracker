import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { sessionId, postId, userId } = await request.json();

    if (!sessionId || !postId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the payment was successful
    if (session.payment_status === "paid") {
      // Update the payment status in your database
      const { error: updateError } = await supabase
        .from("premium_payments")
        .update({
          status: "succeeded",
          payment_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .match({
          post_id: postId,
          user_id: userId,
          status: "pending",
        });

      if (updateError) {
        console.error("Error updating payment status:", updateError);
        return NextResponse.json(
          { error: "Failed to update payment status" },
          { status: 500 }
        );
      }

      return NextResponse.json({ status: "succeeded" });
    }

    return NextResponse.json({ status: session.payment_status });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
