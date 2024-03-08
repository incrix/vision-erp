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
const {sessionExpire} = require("./middleware.js")
const methodOverride = require("method-override");
const Product = require("./services/product/index.js");
const Customer = require("./services/customer/index.js");
const Vendor = require("./services/vendor/index.js");
module.exports = (config) => {


  connectDB(config.databaseURL);
  const app = express();
  const log = config.log()

  // middlewere connection
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(helmet());

  app.use(express.urlencoded({ extended: false }));
 
  app.use(methodOverride("_method"));
  passportInitialize(passport);
  sessionManagement(app,config);


  // passport middleware
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  
  
  // app.post(
  //   "/login-verify",
  //   passport.authenticate("local", {
  //     successRedirect: "/user/login",
  //     failureRedirect: "/user/failed",
  //     failureFlash: true,
  //   })
  // );

  const otp = new GenerateOtp(5, true);
  const mailSender = new MailSender({
    host: config.host,
    name: config.name,
    port: config.port,
    user: config.user,
    pass: config.pass,
  });
  const vendor = new Vendor()
  const user = new User({ otp, mailSender });
  const product = new Product()
  const customer = new Customer()
  const services = {
    user,
    mailSender,
    product,
    customer,
    vendor
  };


  // router
  app.get('/expire', (req,res) => {
    res.send('expire')
  })
  // app.use("/",sessionExpire,router({ services, passport,log }));
  app.use("/",router({ services, passport,log }));
  return app;
};

