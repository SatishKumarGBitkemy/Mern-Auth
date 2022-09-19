const User = require("../model/user");
const VerficationToken = require("../model/verificationToken");
const ResetToken = require("../model/resetToken");
const { sendError, createRandomBytes } = require("../utils/helper");

const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const {
  generateOTP,
  mailTransport,
  generateEmailTemplate,
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  plainEmailTemplate,
} = require("../utils/mail");
const { isValidObjectId } = require("mongoose");

exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) return sendError(res, "This email is already exists!");

  const newUser = new User({ name, email, password });

  const OTP = generateOTP();
  const verficationToken = new VerficationToken({
    owner: newUser._id,
    token: OTP,
  });

  await verficationToken.save();
  await newUser.save();

  mailTransport().sendMail({
    from: process.env.MAILTRAP_USERNAME,
    to: newUser.email,
    subject: "Verify your email Account",
    html: generateEmailTemplate(OTP),
  });

  res.send(newUser);
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  if (!email.trim() || !password.trim())
    return sendError(res, "email/password missing!" + res);

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found");

  const isMatched = await user.comparePassword(password);
  if (!isMatched) return sendError(res, "email/password does not match!");

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({
    success: true,
    user: { name: user.name, email: user.email, id: user._id, token },
  });
};

exports.verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp.trim())
    return sendError(res, "Invalid request, missing parameters!");

  if (!isValidObjectId(userId)) return sendError(res, "Invalid user Id!");

  const user = await User.findById(userId);
  if (!user) return sendError(res, "Sorry user not found!");

  if (user.verified)
    return sendError(res, "This account is already verified !");

  const token = await VerficationToken.findOne({ owner: user._id });
  if (!token) return sendError(res, "Sorry user not found!");

  const isMatched = await token.compareToken(otp);
  if (!isMatched) return sendError(res, "Please provide a valid token!");

  user.verified = true;

  await VerficationToken.findByIdAndDelete(token._id);
  await user.save();

  mailTransport().sendMail({
    from: process.env.MAILTRAP_USERNAME,
    to: user.email,
    subject: "Verify your email Account",
    html: welcomeEmailTemplate(
      "Email Verified Successfully",
      "Thanks for connecting with us"
    ),
  });

  res.json({
    success: true,
    message: "your email is verified,",
    user: { name: user.name, email: user.email, id: user._id },
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, "Please provide a valid email!");

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found,Invalid request!");

  const token = await ResetToken.findOne({ owner: user._id });
  if (token)
    return sendError(
      res,
      "Only after one hour you can request for another token!"
    );

  const randomBytes = await createRandomBytes();
  const resetToken = new ResetToken({ owner: user._id, token: randomBytes });
  await resetToken.save();

  mailTransport().sendMail({
    from: process.env.MAILTRAP_USERNAME,
    to: user.email,
    subject: "Password Reset",
    html: passwordResetEmailTemplate(
      `http://localhost:3000/reset-password?token=${randomBytes}&id=${user._id}`
    ),
  });
  res.json({
    success: true,
    message: "Password reset link is sent to your email",
  });
};

exports.resetPassword = async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return sendError(res, "user not found");

  const isSamePassword = await user.comparePassword(password);
  if (!isSamePassword)
    return sendError(res, "New Password should be different!");

  if (password.trim().length < 8 || password.trim().length > 20)
    return sendError(res, "Password must be 8 to 20 characters long!");

  user.password = password.trim();
  await user.save();

  await ResetToken.findOneAndDelete({ owner: user._id });

  mailTransport().sendMail({
    from: process.env.MAILTRAP_USERNAME,
    to: user.email,
    subject: "Password Reset Successfully",
    html: plainEmailTemplate(
      "Password Reset Successfully",
      "Now you can login with new password "
    ),
  });

  res.json({ success: true, message: "Password Reset Successfully!" });
};
