import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import CryptoJS from "https://cdn.skypack.dev/crypto-js@4.1.1";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const { encryptedData } = await req.json();
    if (!encryptedData) return new Response(JSON.stringify({ error: "Missing encryptedData" }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });

    const privateKey = Deno.env.get("AIRPAY_SECRET") || "YOUR_PRIVATE_KEY";
    const key = CryptoJS.enc.Utf8.parse(privateKey.padEnd(32, '0'));

    const bytes = CryptoJS.AES.decrypt(encryptedData, key, { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    return new Response(JSON.stringify({ success: true, data: JSON.parse(decryptedData) }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});
