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

app.use(
  cors({
    origin: [
      "http://localhost:8080",             
      "http://childsafeenvirons.com",       
      "https://childsafeenvirons.com",      
      "https://my-app-76fv.onrender.com",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use("/", indexRouter);
app.use("/users", usersRouter);


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


app.get("/airpay/success", (req, res) => {
  console.log("✅ Payment success redirect triggered");
  res.redirect("http://childsafeenvirons.com/payment-status?status=SUCCESS");
});


app.get("/airpay/failure", (req, res) => {
  console.log("❌ Payment failure redirect triggered");
  res.redirect("http://childsafeenvirons.com/payment-status?status=FAILED");
});


app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.json({ error: err.message });
});

/* ----------------------------- EXPORT ----------------------------- */
module.exports = app;
