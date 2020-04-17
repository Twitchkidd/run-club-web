const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

// TODO Add user!
const runSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: "Please name the run! 😃",
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now(),
  },
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: [
      {
        type: Number,
        required: "You must supply coordinates!",
      },
    ],
    address: {
      type: String,
      required: "You must supply an address!",
    },
  },
});

runSchema.pre("save", function (next) {
  if (!this.isModified("name")) {
    next();
    return;
  }
  this.slug = slug(this.name);
  next();
  // TODO make more resilant so slugs are unique
});

module.exports = mongoose.model("Run", runSchema);
