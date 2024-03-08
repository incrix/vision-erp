const session = require("express-session");
 const mongoDBstore = require("connect-mongodb-session")(session);
const MongoDbStore = require('connect-mongo');

exports.sessionManagement = async (app, config) => {
  const store = new mongoDBstore({
    uri: config.databaseURL,
    collection: "sessions",
  });

  // Catch errors
  store.on("error", function (error) {});
  app.use(
    session({
      secret: config.secret,
      resave: true,
      secure: true,
      httpOnly: true,
      saveUninitialized: false,
      cookie: {
        // sameSite:'none',
        expires: 2629746000,
      },
      store: store,
    })
  );
};
