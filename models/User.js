const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require("md5");
const validator = require("validator");
const mongodbErrorHandler = require("mongoose-mongodb-errors");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "Invalid email address!"],
    required: "Please provide an email address!",
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  created: {
    type: Date,
    default: Date.now(),
  },
  name: {
    type: String,
    trim: true,
    required: "Please provide a name!",
  },
  bio: String,
  photo: String,
  distanceLower: Number,
  distanceUpper: Number,
  paceLower: Number,
  paceUpper: Number,
  buds: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  outboundBudRequests: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  inboundBudRequests: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  rejectedBudRequests: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
});

userSchema.virtual("gravatar").get(function () {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model("User", userSchema);
