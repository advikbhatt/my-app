require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const createError = require("http-errors");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();

/* ----------------------------- CORS CONFIG ----------------------------- */
app.use(
  cors({
    origin: [
      "http://localhost:8080",              // Local development
      "http://childsafeenvirons.com",       // Production (HTTP)
      "https://childsafeenvirons.com",      // Production (HTTPS)
      "https://my-app-76fv.onrender.com",   // Backend domain
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

/* ----------------------------- MIDDLEWARES ----------------------------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* ----------------------------- VIEWS ----------------------------- */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

/* ----------------------------- ROUTES ----------------------------- */
app.use("/", indexRouter);
app.use("/users", usersRouter);

/* ----------------------------- AIRPAY CALLBACKS ----------------------------- */

app.post("/airpay/ipn", async (req, res) => {
  try {
    console.log("💳 Received AirPay IPN:", req.body);
    const { TRANSACTIONID, STATUS, AMOUNT } = req.body;

    console.log(`Transaction ${TRANSACTIONID} => ${STATUS} (₹${AMOUNT})`);

    if (STATUS === "SUCCESS") {
      const { data, error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          payment_status: "SUCCESS",
          updated_at: new Date().toISOString(),
        })
        .eq("orderid", TRANSACTIONID);

      if (error) {
        console.error("❌ Supabase update failed:", error);
      } else {
        console.log("✅ Supabase subscription activated:", data);
      }
    } else {
      await supabase
        .from("subscriptions")
        .update({
          status: "failed",
          payment_status: STATUS,
          updated_at: new Date().toISOString(),
        })
        .eq("orderid", TRANSACTIONID);

      console.log(`❌ Payment failed for ${TRANSACTIONID}`);
    }

    res.status(200).send("IPN received successfully");
  } catch (error) {
    console.error("💥 IPN processing error:", error);
    res.status(500).send("Error processing IPN");
  }
});


/**
 * ✅ Payment success redirect
 * Redirects user to frontend with a success query parameter.
 */
app.get("/airpay/success", (req, res) => {
  console.log("✅ Payment success redirect triggered");
  res.redirect("http://childsafeenvirons.com/payment-status?status=SUCCESS");
});

/**
 * ✅ Payment failure redirect
 * Redirects user to frontend with a failed query parameter.
 */
app.get("/airpay/failure", (req, res) => {
  console.log("❌ Payment failure redirect triggered");
  res.redirect("http://childsafeenvirons.com/payment-status?status=FAILED");
});

/* ----------------------------- ERROR HANDLING ----------------------------- */

// 404 handler
app.use((req, res, next) => {
  next(createError(404));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.json({ error: err.message });
});

/* ----------------------------- EXPORT ----------------------------- */
module.exports = app;
