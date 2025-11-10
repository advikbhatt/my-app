var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var app = express();
app.use(
  cors({
    origin: [
      "http://localhost:8080",              
      "http://childsafeenvirons.com",       
      "https://childsafeenvirons.com",      
    ],
    methods: ["GET", "POST", "OPTIONS"],     
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,                       
  })
);
app.options("*", cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(logger("dev"));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  console.log(`🌍 ${req.method} ${req.path} | Origin: ${req.headers.origin}`);
  next();
});

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.post("/airpay/ipn", (req, res) => {
  try {
    console.log("💳 Received AirPay IPN:", req.body);
    const { TRANSACTIONID, STATUS, AMOUNT } = req.body;
    console.log(`Transaction ${TRANSACTIONID} => ${STATUS} (₹${AMOUNT})`);
    res.status(200).send("IPN received successfully");
  } catch (error) {
    console.error("IPN processing error:", error);
    res.status(500).send("Error processing IPN");
  }
});

app.get("/airpay/success", (req, res) => {
  res.redirect("https://childsafeenvirons.com/payment-status?status=SUCCESS");
});

app.get("/airpay/failure", (req, res) => {
  res.redirect("https://childsafeenvirons.com/payment-status?status=FAILED");
});


app.post("/txn/create-subscription", (req, res) => {
  res.json({ success: true, message: "Subscription created successfully" });
});

app.post("/txn", async (req, res) => {
  try {
    const {
      buyerEmail,
      buyerFirstName,
      buyerLastName,
      buyerAddress,
      buyerCity,
      buyerState,
      buyerCountry,
      buyerPhone,
      buyerPinCode,
      amount,
      orderid,
      currency,
      isocurrency,
    } = req.body;

    console.log("🧾 New Transaction Request:", orderid, "Amount:", amount);

    const MERCHANT_ID = process.env.AIRPAY_MERCHANT_ID;
    const USERNAME = process.env.AIRPAY_USERNAME;
    const PASSWORD = process.env.AIRPAY_PASSWORD;
    const SECRET_KEY = process.env.AIRPAY_SECRET_KEY;

    if (!MERCHANT_ID || !USERNAME || !PASSWORD || !SECRET_KEY) {
      console.error("⚠️ Missing AirPay credentials in environment variables");
      return res
        .status(500)
        .json({ error: "Server misconfigured: AirPay credentials missing" });
    }

    const html = `
      <html>
        <body onload="document.forms[0].submit()">
          <form action="https://payments.airpay.co.in/pay/index.php" method="POST">
            <input type="hidden" name="merchantId" value="${MERCHANT_ID}" />
            <input type="hidden" name="orderid" value="${orderid}" />
            <input type="hidden" name="buyerEmail" value="${buyerEmail}" />
            <input type="hidden" name="buyerFirstName" value="${buyerFirstName}" />
            <input type="hidden" name="buyerLastName" value="${buyerLastName}" />
            <input type="hidden" name="buyerAddress" value="${buyerAddress}" />
            <input type="hidden" name="buyerCity" value="${buyerCity}" />
            <input type="hidden" name="buyerState" value="${buyerState}" />
            <input type="hidden" name="buyerCountry" value="${buyerCountry}" />
            <input type="hidden" name="buyerPhone" value="${buyerPhone}" />
            <input type="hidden" name="buyerPinCode" value="${buyerPinCode}" />
            <input type="hidden" name="amount" value="${amount}" />
            <input type="hidden" name="currency" value="${currency}" />
            <input type="hidden" name="isocurrency" value="${isocurrency}" />
            <input type="hidden" name="returnurl" value="https://childsafeenvirons.com/payment-status" />
            <input type="hidden" name="callbackurl" value="https://my-app-76fv.onrender.com/airpay/ipn" />
          </form>
        </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error("❌ Error creating AirPay txn:", err);
    res.status(500).json({ error: "Error creating payment transaction" });
  }
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  console.error("Error:", err.message);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
