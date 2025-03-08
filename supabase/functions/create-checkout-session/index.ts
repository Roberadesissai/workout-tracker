// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "@supabase/supabase-js";
// import Stripe from "stripe";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
//   "Access-Control-Allow-Headers":
//     "*, authorization, x-client-info, apikey, content-type",
//   "Access-Control-Max-Age": "86400",
// };

// serve(async (req) => {
//   // Handle CORS preflight requests
//   if (req.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers: corsHeaders,
//     });
//   }

//   try {
//     // Verify authorization header
//     const authHeader = req.headers.get("Authorization");
//     if (!authHeader) {
//       throw new Error("No authorization header");
//     }

//     const { amount, postId, userId, successUrl, cancelUrl } = await req.json();

//     if (!amount || !postId || !userId) {
//       throw new Error("Missing required fields");
//     }

//     // Initialize Stripe
//     const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
//       apiVersion: "2023-10-16",
//     });

//     // Initialize Supabase client
//     const supabaseClient = createClient(
//       Deno.env.get("SUPABASE_URL") || "",
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
//     );

//     // Get user details from Supabase
//     const { data: userData, error: userError } = await supabaseClient
//       .from("profiles")
//       .select("email")
//       .eq("id", userId)
//       .single();

//     if (userError || !userData?.email) {
//       throw new Error("User not found or email not available");
//     }

//     // Create Stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             product_data: {
//               name: "Premium Content Access",
//               description: "One-time access to premium content",
//             },
//             unit_amount: Math.round(amount * 100), // Convert to cents
//           },
//           quantity: 1,
//         },
//       ],
//       mode: "payment",
//       success_url: successUrl,
//       cancel_url: cancelUrl,
//       customer_email: userData.email,
//       metadata: {
//         post_id: postId,
//         user_id: userId,
//       },
//     });

//     // Return the session URL
//     return new Response(JSON.stringify({ url: session.url }), {
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error creating checkout session:", error);
//     return new Response(
//       JSON.stringify({
//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to create checkout session",
//       }),
//       {
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//         status: 400,
//       }
//     );
//   }
// });
