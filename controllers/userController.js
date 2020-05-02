const mongoose = require("mongoose");
const User = mongoose.model("User");
const Run = mongoose.model("Run");
const promisify = require("es6-promisify");
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

exports.landingPage = async (req, res) => {
  if (!req.user) {
    res.render("landing", { title: "Welcome" });
  } else {
    const upcomingRuns = await Run.find({ author: req.user }).lean();
    res.render("landing", { title: req.user.name, upcomingRuns });
  }
};

exports.registerForm = (req, res) => {
  res.render("register", { title: "Register" });
};

exports.validateUser = (req, res, next) => {
  req.sanitizeBody("name");
  req.checkBody("name", "Please supply a name!").notEmpty();
  req.sanitizeBody("email").normalizeEmail({
    remove_dots: false,
    gmail_remove_dots: false,
    remove_extensions: false,
    gmail_remove_subaddress: false,
  });
  req.checkBody("email", "Please supply an email address!").notEmpty();
  req.checkBody("password", "Please supply a password!").notEmpty();
  req
    .checkBody("password-confirm", "Please supply a password confirmation!")
    .notEmpty();
  req
    .checkBody("password-confirm", "Passwords don't match!")
    .equals(req.body.password);
  const errors = req.validationErrors();
  if (errors) {
    req.flash(
      "error",
      errors.map((err) => err.msg)
    );
    res.render("register", {
      title: "Register",
      body: req.body,
      flashes: req.flash(),
    });
    return;
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  const registerWithPromise = promisify(User.register, User);
  await registerWithPromise(user, req.body.password);
  next();
};

exports.loginForm = (req, res) => {
  res.render("login", { title: "Login" });
};

exports.account = (req, res) => {
  const firstTime = req.query.firstTime;
  res.render("account", {
    title: "Edit Your Account",
    firstTime,
  });
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

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    distance: req.body.distance,
    pace: req.body.pace,
    bio: req.body.bio,
  };
  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: "query" }
  );
  req.flash("success", "Updated profile!");
  res.redirect("back");
};

exports.updateAccountFirstTime = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    distance: req.body.distance,
    pace: req.body.pace,
    bio: req.body.bio,
  };
  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: "query" }
  );
  req.flash("success", "Updated profile!");
  res.redirect("/");
};
