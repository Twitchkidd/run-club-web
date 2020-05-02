const mongoose = require("mongoose");
const Run = mongoose.model("Run");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  },
};

exports.newRun = (req, res) => {
  res.render("editRun", { title: "New Run" });
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
};

exports.createRun = async (req, res) => {
  req.body.author = req.user._id;
  const run = await new Run(req.body).save();
  req.flash(
    "success",
    `Successfully Created ${run.name}, care to invite some buds?`
  );
  res.redirect(`/runs/${run.slug}`);
};

exports.getMyRuns = async (req, res) => {
  const myOwnRunsPromise = Run.find({ author: req.user._id });
  // const runsImInPromise = Run.find({ author: req.user._id }); This is wrong, lol, it's dog-walking time though.
  const runsImInPromise = Run.find({ author: req.user._id });
  const [myOwnRuns, runsImIn] = Promise.all([
    myOwnRunsPromise,
    runsImInPromise,
  ]);
  res.render("runs", { title: "My Runs", runs: [...myOwnRuns, ...runsImIn] });
};

exports.getRuns = async (req, res) => {
  const runs = await Run.find();
  res.render("runs", { title: "Runs", runs });
};

const confirmOwner = (run, user) => {
  if (!run.author.equals(user._id)) {
    throw Error("You must have started a run in order to edit it!");
  }
};

exports.editRun = async (req, res) => {
  const run = await Run.findOne({ _id: req.params.id });
  confirmOwner(run, req.user);
  res.render("editRun", { title: `Edit ${run.name}`, run });
};

exports.updateRun = async (req, res) => {
  req.body.location.type = "Point";
  const run = await Run.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    /* return the new run instead of the found one */ runValidators: true /* forces model to run validators again so you can't update a run with no name*/,
  }).exec();
  req.flash(
    "success",
    `Successfully updated <strong>${run.name}</strong>. <a href="/runs/${run.slug}">View Run -></a>`
  );
  res.redirect(`/runs/${run._id}/edit`);
};

exports.getRunBySlug = async (req, res, next) => {
  const run = await Run.findOne({ slug: req.params.slug }).populate(
    "author runners"
  );
  if (!run) {
    return next();
  }
  res.render("run", { run, title: run.name });
};

exports.getRunsByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Run.getTagsList();
  const runsPromise = Run.find({ tags: tagQuery });
  const [tags, runs] = await Promise.all([tagsPromise, runsPromise]);
  res.render("tag", { tags, title: "Tags", tag, runs });
};

exports.joinRun = async (req, res) => {
  const run = await Run.findOne({ slug: req.params.slug }).populate(
    "author runners"
  );
  if (
    [
      run.author._id.toString(),
      ...run.runners.map((runner) => runner._id.toString()),
    ].includes(req.user._id.toString())
  ) {
    req.flash("error", "Can't join run!");
    res.redirect("back");
    return;
  }
  run.runners.push(req.user);
  await run.save();
  req.flash("success", "Joined run!");
  res.redirect("back");
};

exports.leaveRun = async (req, res) => {
  const run = await Run.findOne({ slug: req.params.slug }).populate(
    "author runners"
  );
  if (
    req.user._id.toString() === run.author._id.toString() ||
    ![...run.runners.map((runner) => runner._id.toString())].includes(
      req.user._id.toString()
    )
  ) {
    req.flash("error", "Can't leave run!");
    res.redirect("back");
    return;
  }
  run.runners = run.runners.filter(
    (runner) => runner._id.toString() !== req.user._id.toString()
  );
  await run.save();
  req.flash("info", "Left run!");
  res.redirect("back");
};
