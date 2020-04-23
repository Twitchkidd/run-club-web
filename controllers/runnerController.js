const mongoose = require("mongoose");
const Runner = mongoose.model("Runner");
const promisify = require("es6-promisify");

exports.loginForm = (req, res) => {
  res.render("login", { title: "Login" });
};

exports.registerForm = (req, res) => {
  res.render("register", { title: "Register" });
};

exports.validateRunner = (req, res, next) => {
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
  const runner = new Runner({ email: req.body.email, name: req.body.name });
  const registerWithPromise = promisify(Runner.register, Runner);
  await registerWithPromise(runner, req.body.password);
  next();
};

exports.account = (req, res) => {
  res.render("account", { title: "Edit Your Account" });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
  };
  const runner = await Runner.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: "query" }
  );
  req.flash("success", "Updated profile!");
  res.redirect("back");
};
