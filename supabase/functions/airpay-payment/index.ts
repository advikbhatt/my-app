import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

// Load secrets from Supabase
const MERCHANT_ID = Deno.env.get("AIRPAY_MERCHANT_ID")!;
const USERNAME = Deno.env.get("AIRPAY_USERNAME")!;
const PASSWORD = Deno.env.get("AIRPAY_PASSWORD")!;
const SECRET_KEY = Deno.env.get("AIRPAY_SECRET_KEY")!;

// ---------- Utility Functions ----------

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// MD5 hash
async function md5Hex(data: string) {
  const hashBuffer = await crypto.subtle.digest("MD5", new TextEncoder().encode(data));
  return bufferToHex(hashBuffer);
}

// SHA256 hash
async function sha256Hex(data: string) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return bufferToHex(hashBuffer);
}

// Convert hex string to ArrayBuffer
function hexToArrayBuffer(hex: string) {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  return bytes.buffer;
}

// Generate random IV (16 bytes)
function generateIvHex() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// AES-256-CBC encrypt
async function encryptAES256CBC(plainText: string, keyHex: string, ivHex: string) {
  const keyBuffer = hexToArrayBuffer(keyHex);
  const ivBuffer = hexToArrayBuffer(ivHex);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: ivBuffer },
    cryptoKey,
    new TextEncoder().encode(plainText)
  );

  return ivHex + btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
}

// ---------- CORS headers ----------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Replace with your frontend domain in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ---------- Main Edge Function ----------
serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS_HEADERS });

  try {
    const body = await req.json();

    // Required fields
    const required = ["buyerEmail", "buyerFirstName", "buyerLastName", "amount", "orderid", "currency", "isocurrency"];
    for (const field of required) {
      if (!body[field]) throw new Error(`Missing field: ${field}`);
    }

    // Generate encryption key & IV
    const md5Key = await md5Hex(`${USERNAME}~:~${PASSWORD}`);
    const ivHex = generateIvHex();

    // Prepare AirPay request payload
    const dataObject = {
      buyer_email: body.buyerEmail,
      buyer_firstname: body.buyerFirstName,
      buyer_lastname: body.buyerLastName,
      buyer_address: body.buyerAddress || "",
      buyer_city: body.buyerCity || "",
      buyer_state: body.buyerState || "",
      buyer_country: body.buyerCountry || "",
      amount: body.amount,
      orderid: body.orderid,
      buyer_phone: body.buyerPhone || "",
      buyer_pincode: body.buyerPinCode || "",
      iso_currency: body.isocurrency,
      currency_code: body.currency,
      merchant_id: MERCHANT_ID,
    };

    // Encrypt payload & generate checksum
    const encryptedData = await encryptAES256CBC(JSON.stringify(dataObject), md5Key, ivHex);
    const checksum = await sha256Hex(Object.values(dataObject).join("") + new Date().toISOString().split("T")[0]);

    // Return data to frontend
    return new Response(
      JSON.stringify({
        paymentUrl: "https://payments.airpay.co.in/pay/v4/index.php",
        encryptedData,
        checksum,
        merchantId: MERCHANT_ID,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
