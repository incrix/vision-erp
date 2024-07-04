"use strict";
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const createError = require("http-errors");
const connectDB = require("./utils/connectDB.js");
const { sessionManagement } = require("./utils/sessionConnection.js");
const flash = require("express-flash");
const passport = require("passport");
const passportInitialize = require("./auth/passport.js");
const helmet = require("helmet");
const GenerateOtp = require("./utils/otpGenerator.js");
const router = require("./router/index.js");
const User = require("./services/user");
const MailSender = require("./services/email/index.js");
const { sessionExpire, userIsLogin } = require("./middleware.js");
const {checkTheInput} = require("./utils/checkTheInput.js")
const methodOverride = require("method-override");
const Product = require("./services/product/index.js");
const Customer = require("./services/customer/index.js");
const Vendor = require("./services/vendor/index.js");
const Invoice = require("./services/invoice/index.js");
const Payment = require("./services/payment/index.js");


module.exports = (config) => {
  
  const getConnection = connectDB({
    url: config.databaseURL,
    poolSize: config.poolSize,
  })
    .then((connection) => console.log("data base connect successfully"))
    .catch((error) => console.console.log(error));

  const app = express();
  const log = config.log();

  // middlewere connection
  app.use(
    cors(
      {
    //    // origin:"https://d1dp27wvujqxte.cloudfront.net",
    //    // origin:'https://d1ucsdf3cm5a5l.cloudfront.net',
    //   //origin: 'http://erp-client-3.s3-website.ap-south-1.amazonaws.com',
       origin: 'http://localhost:3000', // Replace with your frontend domain
      credentials: true,
    }
  )
  );
  app.use(compression());
  app.use(express.json());
  app.use(helmet());

  app.use(express.urlencoded({ extended: false }));

  app.use(methodOverride("_method"));
  passportInitialize(passport);
  sessionManagement(app, config);

  // passport middleware
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  const otp = new GenerateOtp(5, true);
  const mailSender = new MailSender({
    host: config.host,
    name: config.name,
    port: config.port,
    user: config.user,
    pass: config.pass,
  });

 
  const vendor = new Vendor();
  const user = new User({ otp, mailSender });
  const product = new Product();
  const customer = new Customer();
  const invoice = new Invoice();
  const payment = new Payment()
  const services = {
    user,
    mailSender,
    product,
    customer,
    vendor,
    getConnection,
    invoice,
    payment
  };


  // router
  app.get("/api/expire", (req, res) => {
    if (!req.session.counters) req.session.counters = 1;
    else req.session.counters += 1;
    console.log(req.session.counters);
    res.send("expire");
  });
  app.use("/api/", sessionExpire,checkTheInput,router({ services, passport, log }));

  app.get("/api/user-isLogin", userIsLogin);

  // logout
  app.get("/api/logout", (req, res) => {
    
    req.session.destroy();
    res.json({ status: "success", message: "logged out successfully" });
  });
  // app.use("/api/",router({ services, passport,log }));




  return app;
}





