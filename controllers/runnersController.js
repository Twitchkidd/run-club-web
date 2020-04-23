const mongoose = require("mongoose");
const User = mongoose.model("User");

exports.getRunners = async (req, res) => {
  const runners = await User.find();
  res.render("runners", { title: "Runners", runners });
};

exports.toggleFriendship = async (req, res) => {
  const buds = req.user.buds.map((obj) => obj.toString());
  const operator = buds.includes(req.params.id) ? "$pull" : "$addToSet";
  const runner = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { buds: req.params.id } },
    { new: true }
  );
  req.flash(
    `${operator === "$pull" ? "info" : "success"}`,
    operator === "$pull"
      ? `You've unfriended ${runner.name}.`
      : `You've friended ${runner.name}!`
  );
  res.redirect("back");
};

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
  console.log(user);
  console.log(user.outboundBudRequests);
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
