import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const { AIRPAY_USERNAME, AIRPAY_PASSWORD, AIRPAY_SECRET, AIRPAY_MERCHANT_ID } = process.env;

app.post("/create-payment", (req, res) => {
  const { amount, orderId, customer } = req.body;

  // AirPay’s checksum/private key formula
  const privateKeyString = `${AIRPAY_USERNAME}:${AIRPAY_PASSWORD}:${AIRPAY_SECRET}:${amount}:${orderId}`;
  const privatekey = crypto.createHash("sha256").update(privateKeyString).digest("hex");

  const checksumString = `${AIRPAY_MERCHANT_ID}:${AIRPAY_USERNAME}:${AIRPAY_PASSWORD}:${orderId}:${amount}:${AIRPAY_SECRET}`;
  const checksum = crypto.createHash("sha256").update(checksumString).digest("hex");

  const payload = {
    mercid: AIRPAY_MERCHANT_ID,
    orderid: orderId,
    amount,
    currency: "INR",
    isocurrency: "INR",
    buyerEmail: customer.email,
    buyerPhone: customer.phone,
    buyerFirstName: customer.name,
    privatekey,
    checksum,
  };

  res.json({ success: true, payload });
});

app.listen(5000, () => console.log("✅ AirPay backend running on http://localhost:5000"));
