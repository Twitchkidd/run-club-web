const mongoose = require("mongoose");
const User = mongoose.model("User");

exports.getRunners = async (req, res) => {
  const runners = await User.find();
  res.render("runners", { title: "Runners", runners });
};

exports.toggleFriendship = async (req, res) => {
  const friends = req.user.friends.map((obj) => obj.toString());
  const operator = friends.includes(req.params.id) ? "$pull" : "$addToSet";
  const runner = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { friends: req.params.id } },
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
