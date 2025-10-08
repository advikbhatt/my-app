import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { amount } = await req.json();

    const mercid = Deno.env.get("AIRPAY_MERCHANT_ID")!;
    if (!mercid) throw new Error("Missing AIRPAY_MERCHANT_ID in environment variables");

    const orderid = Math.random().toString(36).substring(2, 10);
    const uniqueid = crypto.randomUUID().slice(0, 8);

    const formData = new URLSearchParams({
      mercid,
      orderid,
      amount: amount.toString(),
      currency: "356", 
      isocurrency: "INR",
      uniqueid,
      postxntype: "1",
    });

    const response = await fetch("https://payments.airpay.co.in/web-api/pos/create", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const text = await response.text();
    console.log("Raw AirPay response:", text.slice(0, 300));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: "error", raw: text };
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in process-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
