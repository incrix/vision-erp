"use strict";

const serverless = require("serverless-http");
const config = require("./src/configs")[process.env.NODE_ENV || "development"];
const app = require("./src/app")(config);

process.env.DEPLOYMENT
  ? (module.exports.app = serverless(app))
  : app.listen(3333, () => console.log("server running on port 3333"));
