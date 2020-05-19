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
  // Right, so here, no scrubbing or types or anything?
  // Not to throw shade, it's just I feel like some
  // routes got developed more and some didn't, just
  // because there's some give and take while watching the
  // videos about it as far as what gets tested, and then
  // it's like up to the reader to be conscientious, which
  // is probably fine, lol. Anyway, wtf are these things,
  // lets start there.
  const budsList = await User.find({
    _id: {
      $in: [...req.user.buds, ...req.user.inboundBudRequests],
    },
  }).lean();
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
  // console.log([...user.buds]);
  // console.log(typeof [...user.buds][0]);
  // // Hi I'm actually an object
  // console.dir([...user.buds][0]);
  // console.log([...user.buds][0].toString());
  // // Hey I'm a string
  // console.log([user.buds.toString()][0]);
  // console.log(otherRunnerIdString);
  // console.log([user.buds.toString()][0].includes(otherRunnerIdString));
  if (
    [user.rejectedBudRequests.toString()][0].includes(otherRunnerIdString) ||
    [user.buds.toString()][0].includes(otherRunnerIdString)
  ) {
    req.flash("error", "Can't accept bud request!");
    res.redirect("back");
    return;
  }
  console.log(otherRunner);
  const newRunnerPromise = User.findByIdAndUpdate(
    user._id,
    {
      $addToSet: { buds: { otherRunner } },
      $pull: { inboundBudRequests: { otherRunner } },
    },
    { new: true }
  );
  const nextNewRunnerPromise = User.findByIdAndUpdate(
    otherRunner._id,
    {
      $addToSet: { buds: { user } },
      $pull: { outboundBudRequests: { user } },
    },
    { new: true }
  );
  const [newRunner, nextNewRunner] = await Promise.all([
    newRunnerPromise,
    nextNewRunnerPromise,
  ]);
  console.log(newRunner);
  console.log(nextNewRunner);
  // console.log(user.buds);
  // user.buds.push(otherRunnerIdString);
  // console.log(user.buds);
  // console.log(user.inboundBudRequests);
  // user.inboundBudRequests = user.inboundBudRequests.filter(
  //   (runnerId) => runnerId !== otherRunnerIdString
  // );
  // console.log(user.inboundBudRequests);
  // console.log(otherRunner.buds);
  // otherRunner.buds.push(userIdString);
  // console.log(otherRunner.buds);
  // console.log(otherRunner.outboundBudsRequests);
  // otherRunner.outboundBudRequests = otherRunner.outboundBudRequests.filter(
  //   (runnerId) => runnerId !== userIdString
  // );
  // console.log(otherRunner.outboundBudsRequests);
  // await Promise.all([user.save(), otherRunner.save()]);
  req.flash("success", `${nextNewRunner.name} is now your bud!`);
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
