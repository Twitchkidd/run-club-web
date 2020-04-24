const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

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
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: "You must supply an author!",
  },
  runners: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  start: {
    type: Date,
    required: "You must supply a start time!",
  },
});

runSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next();
    return;
  }
  this.slug = slug(this.name);
  // find other runs that have the slug run, run-1, run-2 etc
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  const runsWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (runsWithSlug.length) {
    this.slug = `${this.slug}-${runsWithSlug.length + 1}`;
  }
  next();
});

runSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

module.exports = mongoose.model("Run", runSchema);
