// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
// import Stripe from "https://esm.sh/stripe@13.6.0";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
// };

// const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
//   apiVersion: "2023-10-16",
//   httpClient: Stripe.createFetchHttpClient(),
// });

// const supabase = createClient(
//   Deno.env.get("SUPABASE_URL") || "",
//   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
// );

// serve(async (req) => {
//   // Handle CORS preflight
//   if (req.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: corsHeaders,
//     });
//   }

//   try {
//     const signature = req.headers.get("stripe-signature");
//     if (!signature) {
//       return new Response("No signature provided", {
//         status: 400,
//         headers: corsHeaders,
//       });
//     }

//     const body = await req.text();
//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(
//         body,
//         signature,
//         Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
//       );
//     } catch (err) {
//       console.error(`⚠️ Webhook signature verification failed.`, err.message);
//       return new Response(`Webhook Error: ${err.message}`, { status: 400 });
//     }

//     console.log(`Event received: ${event.type}`);

//     switch (event.type) {
//       case "checkout.session.completed": {
//         const session = event.data.object;
//         console.log("Processing checkout session:", session.id);

//         // Extract metadata
//         const postId = session.metadata?.post_id;
//         const userId = session.metadata?.user_id;

//         if (!postId || !userId) {
//           console.error("Missing metadata in session:", session.id);
//           return new Response("Missing metadata", { status: 400 });
//         }

//         // Update payment status in database
//         const { error: updateError } = await supabase
//           .from("premium_payments")
//           .update({
//             status: "succeeded",
//             payment_id: session.payment_intent,
//             updated_at: new Date().toISOString(),
//           })
//           .match({
//             post_id: postId,
//             user_id: userId,
//             status: "pending",
//           });

//         if (updateError) {
//           console.error("Error updating payment:", updateError);
//           return new Response("Error updating payment status", { status: 500 });
//         }

//         console.log(`✅ Payment status updated for session ${session.id}`);
//         break;
//       }

//       case "checkout.session.expired": {
//         const session = event.data.object;
//         const postId = session.metadata?.post_id;
//         const userId = session.metadata?.user_id;

//         if (postId && userId) {
//           const { error: updateError } = await supabase
//             .from("premium_payments")
//             .update({
//               status: "expired",
//               updated_at: new Date().toISOString(),
//             })
//             .match({
//               post_id: postId,
//               user_id: userId,
//               status: "pending",
//             });

//           if (updateError) {
//             console.error("Error updating expired payment:", updateError);
//           }
//         }
//         break;
//       }
//     }

//     return new Response(JSON.stringify({ received: true }), {
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   } catch (err) {
//     console.error("Webhook error:", err);
//     return new Response(`Webhook Error: ${err.message}`, { status: 500 });
//   }
// });
