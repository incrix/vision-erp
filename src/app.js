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
const methodOverride = require("method-override");
const Product = require("./services/product/index.js");
const Customer = require("./services/customer/index.js");
const Vendor = require("./services/vendor/index.js");
const argv = require("minimist")(process.argv.slice(2));

module.exports = (config) => {
  const getConnection = connectDB({
    url: config.databaseURL,
    poolSize: config.poolSize,
  });

  const app = express();
  const log = config.log();

  // middlewere connection
  app.use(
    cors(
    //  {
      // origin:
      //   process.env.NODE_ENV == "development"
      //     ? "http://localhost:3000"
      //     : "https://d1dp27wvujqxte.cloudfront.net",
      //   credentials: true,
    //}
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
  const services = {
    user,
    mailSender,
    product,
    customer,
    vendor,
    getConnection,
  };

  // router
  app.get('/',(req,res) =>{
    res.send('ok fuck you')
  })
  app.get("/expire", (req, res) => {
    try {
      if (!req.session.counters) req.session.counters = 1;
    else req.session.counters += 1;
    console.log(req.session.counters);
    res.send("expire");
    } catch (error) {
      res.json({error: error})
    }
  });
  app.use("/api/", sessionExpire, router({ services, passport, log }));

  app.get("/api/user-isLogin", userIsLogin);

  // logout
  app.get("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ status: "success", message: "logged out successfully" });
  });
  //app.use("/",router({ services, passport,log }));
  return app;
};
