const passport = require("passport");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const crypto = require("crypto");
const promisify = require("es6-promisify");
const mail = require("../handlers/mail");

exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "Failed login!",
  successRedirect: "/",
  successFlash: "You're logged in!",
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You're now logged out!");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  } else {
    req.flash("error", "Oops, you must be logged in to do that!");
    res.redirect("/login");
  }
};

// exports.index = (req, res, next) => {
//   if (req.isAuthenticated()) {
//     next();
//     return;
//   } else {

// }

exports.forgot = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // What to put in this message has security/privacy implications
    req.flash("error", "No account with that email exists");
    return res.redirect("/login");
  }
  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: "Password reset",
    resetURL,
    filename: "password-reset",
  });
  req.flash("success", `You have been emailed a password reset link.`);
  res.redirect("/login");
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired");
    return res.redirect("/login");
  }
  res.render("reset", { title: "Reset Your Password" });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body["password-confirm"]) {
    next();
    return;
  } else {
    req.flash("error", "Passwords do not match!");
    res.redirect("back");
  }
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired");
    return res.redirect("/login");
  }
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpired = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash("Success", "Nice! Your password has been reset!");
  res.redirect("/");
};
