import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

// Secrets from Supabase
const MERCHANT_ID = Deno.env.get("AIRPAY_MERCHANT_ID")!;
const USERNAME = Deno.env.get("AIRPAY_USERNAME")!;
const PASSWORD = Deno.env.get("AIRPAY_PASSWORD")!;
const SECRET_KEY = Deno.env.get("AIRPAY_SECRET_KEY")!;

// CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // replace with frontend domain in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Dummy checksum (AirPay will accept your SECRET_KEY and encdata)
function generateChecksum() {
  // For demo purposes, just hash MERCHANT_ID + date
  const date = new Date().toISOString().split("T")[0];
  let sum = 0;
  for (const c of MERCHANT_ID + date) sum += c.charCodeAt(0);
  return sum.toString(16);
}

// Main Edge Function
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS_HEADERS });

  try {
    const body = await req.json();
    const required = ["buyerEmail", "buyerFirstName", "buyerLastName", "amount", "orderid", "currency", "isocurrency"];
    for (const field of required) if (!body[field]) throw new Error(`Missing field: ${field}`);

    // Prepare AirPay payload
    const payload = {
      buyer_email: body.buyerEmail,
      buyer_firstname: body.buyerFirstName,
      buyer_lastname: body.buyerLastName,
      amount: body.amount,
      orderid: body.orderid,
      iso_currency: body.isocurrency,
      currency_code: body.currency,
      merchant_id: MERCHANT_ID,
    };

    const paymentUrl = "https://payments.airpay.co.in/pay/v4/index.php";
    const checksum = generateChecksum();

    return new Response(JSON.stringify({ paymentUrl, encryptedData: SECRET_KEY, checksum, merchantId: MERCHANT_ID }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500, headers: CORS_HEADERS });
  }
});
