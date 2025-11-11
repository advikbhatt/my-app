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
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.post('/airpay/ipn', (req, res) => {
  try {
    console.log('💳 Received Airpay IPN:', req.body);
    const { TRANSACTIONID, STATUS, AMOUNT } = req.body;
    console.log(`Transaction ${TRANSACTIONID} => ${STATUS} (₹${AMOUNT})`);
    res.status(200).send('IPN received successfully');
  } catch (error) {
    console.error('IPN processing error:', error);
    res.status(500).send('Error processing IPN');
  }
});

app.get('/airpay/success', (req, res) => {
  res.redirect('http://childsafeenvirons.com/payment-status?status=SUCCESS');
});

app.get('/airpay/failure', (req, res) => {
  res.redirect('http://childsafeenvirons.com/payment-status?status=FAILED');
});

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  console.error("Error:", err.message);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
