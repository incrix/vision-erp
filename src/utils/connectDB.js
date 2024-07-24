var mongoose = require("mongoose");

let connection = null;
let db;

module.exports = async function ({ url, poolSize }) {
  if (
    connection === null ||
    (connection.connection.readyState !== 1 &&
      connection.connection.readyState !== 2)
    // readystate 1 === connected, 2 === connecting, I don't want to start new connection if it's already connecting.
  ) {
    mongoose = require("mongoose");
    console.log("[MONGOOSE] Creating New Connection");

    mongoose.connection.on("open", () => {
      console.log("Connected with poolSize " + poolSize);
      //   log("[ MONGOOSE] Connected with poolSize " + poolsize);
    });

    try {
      mongoose
        .connect(url, {
          maxPoolSize: poolSize,
          connectTimeoutMS: 10000,
          serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        })
        .then((res) => {
          db = res;
        });
    } catch (err) {
      console.log("Mongoose connection error", err);
    }
    connection = mongoose; //save it to the cache variable

    return;
  } else {
    return;
  }
};

function afterwards() {
  //do stuff
  console.log("calling 2");
  // db.disconnect();
}
