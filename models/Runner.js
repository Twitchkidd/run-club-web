const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require("md5");
const validator = require("validator");
const mongodbErrorHandler = require("mongoose-mongodb-errors");
const passportLocalMongoose = require("passport-local-mongoose");

const runnerSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "Invalid email address!"],
    required: "Please provide an email address!",
  },
  name: {
    type: String,
    trim: true,
    required: "Please provide a name!",
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  buds: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Runner",
    },
  ],
  outboundBudRequests: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Runner",
    },
  ],
  inboundBudRequests: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Runner",
    },
  ],
  rejectedBudRequests: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Runner",
    },
  ],
});

runnerSchema.virtual("gravatar").get(function () {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

runnerSchema.plugin(passportLocalMongoose, { usernameField: "email" });
runnerSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model("Runner", runnerSchema);
