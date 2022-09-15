const User = require("../model/user");

const { isValidObjectId } = require("mongoose");
const { sendError } = require("../utils/helper");
const ResetToken = require("../model/resetToken");

exports.isResetTokenValid = async (req, res, next) => {
  const { token, id } = req.query;

  if (!token || !id) return sendError(res, "Invalid Request");

  if (!isValidObjectId(id)) return sendError(res, "Invalid User!");

  const user = await User.findById(id);
  if (!user) return sendError(res, "User not found!");

  const resetToken = await ResetToken.findOne({ owner: user._id });
  if (!resetToken) return sendError(res, "Reset token not found!");

  const isValid = await resetToken.compareToken(token);
  if (!isValid) return sendError(res, "Reset token is Invalid!");

  req.user = user;
  next();
};
