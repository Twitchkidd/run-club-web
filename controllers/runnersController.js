const mongoose = require("mongoose");
const User = mongoose.model("User");

exports.newBuds = async (req, res) => {
  const newBuds = await User.find({
    _id: {
      $nin: [
        ...req.user.buds,
        ...req.user.outboundBudRequests,
        ...req.user.inboundBudRequests,
        ...req.user.rejectedBudRequests,
        req.user._id,
      ],
    },
  });
  res.render("newBuds", { title: "New Buds", runners: newBuds });
};

exports.budsRequest = async (req, res) => {
  const userPromise = User.findOne({ _id: req.user._id });
  const otherRunnerPromise = User.findOne({ _id: req.params.id });
  const [user, otherRunner] = await Promise.all([
    userPromise,
    otherRunnerPromise,
  ]);
  if (
    [
      ...user.outboundBudRequests,
      ...user.rejectedBudRequests,
      ...user.buds,
    ].includes(otherRunner._id.toString())
  ) {
    req.flash("error", "Can't send buds request to user!");
    res.redirect("back");
    return;
  }
  if (user.inboundBudRequests.includes(otherRunner._id.toString())) {
    // TODO Actually make buds (... lol)
    req.flash(
      "success",
      "Other runner had also requested to be buds! You're buds!"
    );
    res.redirect("back");
    return;
  }
  user.outboundBudRequests.push(otherRunner._id.toString());
  otherRunner.inboundBudRequests.push(user._id.toString());
  await Promise.all([user.save(), otherRunner.save()]);
  req.flash("success", `Buds request sent to ${otherRunner.name}!`);
  res.redirect("back");
};

exports.budsList = async (req, res) => {
  const budsList = await User.find({
    _id: {
      $in: [...req.user.buds, ...req.user.inboundBudRequests],
    },
  });
  res.render("budsList", { title: "Buds List", runners: budsList });
};

exports.acceptBudRequest = async (req, res) => {
  const userPromise = User.findOne({ _id: req.user._id });
  const otherRunnerPromise = User.findOne({ _id: req.params.id });
  const [user, otherRunner] = await Promise.all([
    userPromise,
    otherRunnerPromise,
  ]);
  const userIdString = user._id.toString();
  const otherRunnerIdString = otherRunner._id.toString();
  if (
    [...user.rejectedBudRequests, ...user.buds].includes(otherRunnerIdString)
  ) {
    req.flash("error", "Can't accept bud request!");
    res.redirect("back");
    return;
  }
  user.buds.push(otherRunnerIdString);
  user.inboundBudRequests = user.inboundBudRequests.filter(
    (runnerId) => runnerId !== otherRunnerIdString
  );
  otherRunner.buds.push(userIdString);
  otherRunner.outboundBudRequests = otherRunner.outboundBudRequests.filter(
    (runnerId) => runnerId !== userIdString
  );
  await Promise.all([user.save(), otherRunner.save()]);
  req.flash("success", `${otherRunner.name} is now your bud!`);
  res.redirect("back");
};

exports.rejectBudRequest = async (req, res) => {
  const userPromise = User.findOne({ _id: req.user._id });
  const otherRunnerPromise = User.findOne({ _id: req.params.id });
  const [user, otherRunner] = await Promise.all([
    userPromise,
    otherRunnerPromise,
  ]);
  const userIdString = user._id.toString();
  const otherRunnerIdString = otherRunner._id.toString();
  if (![...user.inboundBudRequests].includes(otherRunnerIdString)) {
    req.flash(
      "error",
      `There doesn't appear to be a bud request from ${otherRunner.name} to be rejected!`
    );
    res.redirect("back");
  }
  user.rejectedBudRequests.push(otherRunnerIdString);
  user.inboundBudRequests = user.inboundBudRequests.filer(
    (runnerId) => runnerId !== otherRunnerIdString
  );
  otherRunner.rejectedBudRequests.push(userIdString);
  otherRunner.outboundBudRequests = otherRunner.outboundBudRequests.filter(
    (runnerId) => runnerId !== userIdString
  );
  await Promise.all([user.save(), otherRunner.save()]);
  req.flash("success", `${otherRunner.name}'s bud request has been rejected!`);
  res.redirect("back");
};

exports.unBudRunner = async (req, res) => {
  const userPromise = User.findOne({ _id: req.user._id });
  const otherRunnerPromise = User.findOne({ _id: req.params.id });
  const [user, otherRunner] = await Promise.all([
    userPromise,
    otherRunnerPromise,
  ]);
  const userIdString = user._id.toString();
  const otherRunnerIdString = otherRunner._id.toString();
  if (!user.buds.includes(otherRunnerIdString)) {
    req.flash("error", `Can't un-bud ${otherRunner.name}!`);
    res.redirect("back");
  }
  user.rejectedBudRequests.push(otherRunnerIdString);
  user.buds = user.buds.filter((runnerId) => runnerId !== otherRunnerIdString);
  otherRunner.rejectedBudRequests.push(userIdString);
  otherRunner.buds = otherRunner.buds.filter(
    (runnerId) => runnerId !== userIdString
  );
  await Promise.all([user.save(), otherRunner.save()]);
  req.flash("success", `${otherRunner.name} has been un-budded!`);
  res.redirect("back");
};
