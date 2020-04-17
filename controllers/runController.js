const mongoose = require("mongoose");
const Run = mongoose.model("Run");

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render("index");
};

exports.newRun = (req, res) => {
  res.render("editRun", { title: "New Run" });
};

exports.createRun = async (req, res) => {
  const run = await new Run(req.body).save();
  req.flash(
    "success",
    `Successfully Created ${run.name}, care to invite some buds?`
  );
  res.redirect(`/run/${run.slug}`);
};

exports.getRuns = async (req, res) => {
  const runs = await Run.find();
  res.render("runs", { title: "Runs", runs });
};

exports.editRun = async (req, res) => {
  const run = await Run.findOne({ _id: req.params.id });
  // auth TODO
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
