var express = require('express');
var router = express.Router();
// var axios = require('axios');
var crypto = require('crypto');
//const bodyParser = require('body-parser');
 
//import fetch from 'node-fetch';
require("dotenv").config();

const {  body, check, validationResult } = require("express-validator");
const {validateTxn, runValidation} = require('../validate/validateTransaction');

var secret = process.env.AIRPAY_SECRET_KEY;
var mid = process.env.AIRPAY_MERCHANT_ID;
var username = process.env.AIRPAY_USERNAME;
var password = process.env.AIRPAY_PASSWORD;
var clientid = process.env.AIRPAY_CLIENT_ID;
var clientsecret = process.env.AIRPAY_CLIENT_SECRET;
//var URL = 'https://payments.airpay.co.in/pay/v4/index.php';
const tokenUrl = "https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/token.php";
var now = new Date();
const key = crypto.createHash('md5').update(username + "~:~" + password).digest('hex');
const iv = crypto.randomBytes(8);
const ivHex = iv.toString('hex');

function decrypt(responsedata, secretKey) {

  let data = responsedata;
  console.log('Decrypt function input', responsedata)
  try {
   
    const hash = crypto.createHash('sha256').update(data).digest();
    const iv = hash.slice(0, 16);
    console.log('iv', iv);
    const encryptedData = Buffer.from(data.slice(16), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), iv);
    let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
    console.log(decrypted);
    decrypted += decipher.final();
    console.log('decrypted>>>>>>>>>')
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error; // Re-throw for proper handling
  }
}
function encryptChecksum(data, salt) {
  const key = crypto.createHash('sha256').update(`${salt}@${data}`).digest('hex');
  return key;
}
function encrypt(request, secretKey) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), Buffer.from(ivHex));
    const raw = Buffer.concat([cipher.update(request, 'utf-8'), cipher.final()]);
    const data = ivHex + raw.toString('base64');
  return data;
  }
  function checksumcal(postData) {
    const sortedData = {};
    Object.keys(postData).sort().forEach(function(key) {
        sortedData[key] = postData[key];
    });
  
    let data = '';
    for (const value of Object.values(sortedData)) {
        data += value;
    }
    console.log(data + new Date().toISOString().split('T')[0]);
    return calculateChecksumHelper(data + new Date().toISOString().split('T')[0]);
  }
  
  function calculateChecksumHelper(data) {
    const checksum = makeEnc(data);
    return checksum;
  }
  
  function makeEnc(data) {
    const key = crypto.createHash('sha256').update(data).digest('hex');
    return key;
  }

  async function sendPostData(tokenUrl, postData) {
    // console.log(">>>>>>>>>>>>>>>>>>>>>>>", tokenUrl, postData)
    //process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                //'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(postData),
        });
       // console.log("<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", response)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = response.text()
        return responseData;
    } catch (error) {
        console.error('Error sending POST request:', error);
        return null;
    }
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/txn', function(req, res, next) {
  res.render('txn', { title: 'Express' });
});
router.post('/sendtoairpay',
    [ 
      //first name
      check("buyerFirstName",'First Name is required')
      .not().isEmpty()
      .isLength({ min: 3 })  
      .withMessage("The name must have minimum length of 3")
      .isLength({ max: 50 })
      .withMessage("The name must have maximum length of 5")
      .custom(value => {
        var pnValdiate= /^[A-Za-z]+$/
        if (!pnValdiate.test(value)) {
          throw new Error('Invalid first name')
        }
        else  return true;
        
      })
      .trim(),
      //last name
      check("buyerLastName",'Last Name is required')
       .not().isEmpty()
       .isLength({ max: 50 })
       .withMessage("The last name must have maximum length of 5")
      .custom(value => {
        var pnValdiate= /^[A-Za-z]+$/
        if (!pnValdiate.test(value)) {
          throw new Error('Invalid last name')
        }
        else  return true;
        
      })
      .trim(),
      //phone no
         check('buyerPhone', 'Phone no is required')
        .isLength({ min: 1 })
        .matches(/^[0-9- ]{8,15}$/i).withMessage('Invalid format')
        
      .trim(),
      //amount ^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$
      check("amount",'Amount is required')
      .not().isEmpty()
      .isNumeric()
      .trim(),
      //email
      check("buyerEmail")
      .isEmail()
      .withMessage("Invalid email address"),
      //.normalizeEmail(),
      //currency
      check("currency",'Currency is required')
      .isLength({ min: 1 })
     
      .trim(),
      //isocurrency
      check("isocurrency",'ISO currency is required')
      .not().isEmpty()
      .isLength({ max:3 ,min:3})
      .withMessage("ISO currency must have a length of 3")
      .custom(value => {
        var pnValdiate= /^[A-Za-z]+$/
        if (!pnValdiate.test(value)) {
          throw new Error('Invalid format')
        }
        else  return true;
        
      })
     
      .trim(),
      //order id
      check("orderid",'Orderid is required')
      .isLength({ min: 1 })
      .trim(),
      //pin
      check("buyerPinCode")
      
      .custom(value => {
        var pnValdiate= /^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/
        if (value!='' && !pnValdiate.test(value)) {
          throw new Error('Invalid format')
        }
        else  return true;
        
      })
     ],
  runValidation, async function(req, res, next) {
  var dateformat = require('dateformat');
  const reqBody = req.body;
  // Create an object with key-value pairs
const dataObject = {
  buyer_email: reqBody.buyerEmail,
  buyer_firstname: reqBody.buyerFirstName,
  buyer_lastname: reqBody.buyerLastName,
  buyer_address: reqBody.buyerAddress,
  buyer_city: reqBody.buyerCity,
  buyer_state: reqBody.buyerState,
  buyer_country: reqBody.buyerCountry,
  amount: reqBody.amount,
  orderid: reqBody.orderid,
  buyer_phone: reqBody.buyerPhone,
  buyer_pincode: reqBody.buyerPinCode,
  iso_currency: reqBody.isocurrency,
  currency_code: reqBody.currency,
  merchant_id:mid
};
var udata =(username +':|:'+password);
privatekey = encryptChecksum(udata,secret);
checksum = checksumcal(dataObject);
var fdata = dataObject;
const encryptedfData = encrypt(JSON.stringify(fdata), key);
let request = {
   client_id: clientid,
   client_secret: clientsecret,
   grant_type: 'client_credentials',
   merchant_id: mid
 };
const encryptedData = encrypt(JSON.stringify(request), key);
const reqs = {
   merchant_id: request.merchant_id,
   encdata: encryptedData,
   checksum: checksumcal(request)
 };

let accessToken = await sendPostData(tokenUrl, reqs);
const decryptedData = decrypt((JSON.parse(accessToken).response), key);
const x =  decryptedData
// Use a regular expression to extract the value associated with "nested"
const match = x.match(/"data"\s*:\s*\{[^}]*\}/);
let nestedObjectString
if (match) {
  nestedObjectString = match[0];
} else {
  console.error('No match found for "nested" key.');
}
let tokenResponse = match;
let token = JSON.parse("{" + nestedObjectString + "}")
let accesstoken = token.data.access_token;
var URL = 'https://payments.airpay.co.in/pay/v4/index.php';
URL = URL + '?token='+ encodeURIComponent(accesstoken);
console.log(URL);

res.render('sendtoairpay',{ mid: mid,data:encryptedfData,privatekey : privatekey,checksum:checksum, URL:URL});
});

router.post('/responsefromairpay', function(req, res, next) {

const key = crypto.createHash('md5').update(username + "~:~" + password).digest('hex');
const responseData = req.body.response;
const decrypteddata = decrypt(responseData, key);
const y =  decrypteddata
 // Use a regular expression to extract the value associated with "nested"
 const match = y.match(/"data"\s*:\s*\{[^}]*\}/);
 let nestedObjectString
 if (match) {
   nestedObjectString = match[0];
  } else {
   console.error('No match found for "nested" key.');
 }
 let tokenResponse = match;
 let token = JSON.parse("{" + nestedObjectString + "}")

 var TRANSACTIONID = token.data.orderid;
 var APTRANSACTIONID = token.data.ap_transactionid;
 var AMOUNT = token.data.amount;
 var TRANSACTIONSTATUS = token.data.transaction_status;
 var MESSAGE  = token.data.message;
 var ap_SecureHash = token.data.ap_securehash;
 var CUSTOMVAR = token.data.custom_var;

 var hashdata = TRANSACTIONID+':'+APTRANSACTIONID+':'+AMOUNT+':'+TRANSACTIONSTATUS+':'+MESSAGE+':'+mid+':'+username;
  var CRC32 = require('crc-32');
  var txnhash = CRC32.str(hashdata);

    var chmod = req.body.CHMOD;
    var custmvar = req.body.CUSTOMERVPA;
    if(chmod==='upi')
    {
      txnhash = CRC32.str(req.body.TRANSACTIONID+':'+req.body.APTRANSACTIONID+':'+req.body.AMOUNT+':'+req.body.TRANSACTIONSTATUS+':'+req.body.MESSAGE+':'+mid+':'+username+':'+custmvar);
    }
    txnhash = txnhash>>>0;
    txndata = ap_SecureHash;

    res.render('responsefromairpay', { txnhash : txnhash,txndata: txndata,TRANSACTIONID:TRANSACTIONID,APTRANSACTIONID:APTRANSACTIONID,AMOUNT:AMOUNT,MESSAGE:MESSAGE,CUSTOMVAR:CUSTOMVAR,TRANSACTIONSTATUS :TRANSACTIONSTATUS });
});


router.post("/airpay-webhook", express.urlencoded({ extended: true }), (req, res) => {
  console.log("/Webhook:", req.body);
  const { TRANSACTIONSTATUS, ORDERID, AMOUNT, MESSAGE } = req.body;
  if (TRANSACTIONSTATUS === "SUCCESS") {
    console.log(` Payment Successful for Order: ${ORDERID}, Amount: ${AMOUNT}`);
  } else {
    console.log(` Payment Failed for Order: ${ORDERID}, Message: ${MESSAGE}`);
  }

  res.status(200).send("OK"); 
});

module.exports = router;
