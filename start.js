const mongoose = require("mongoose");

const [major, minor] = process.versions.node.split(".").map(parseFloat);
if (major < 7 || (major === 7 && minor <= 5)) {
  console.log(
    "🛑 Please use Node 7.6 or greater to make async/await available!"
  );
  process.exit();
}

// import environmental variables from variables.env
require("dotenv").config({ path: "variables.env" });

// connect to database and handle any bad connections
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on("error", (err) => {
  console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

// import all models
require("./models/Run");
require("./models/User");

// Start the app!
const app = require("./app");
app.set("port", process.env.PORT || 7777);
const server = app.listen(app.get("port"), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
