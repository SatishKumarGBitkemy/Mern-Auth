const router = require("express").Router();

const {
  createUser,
  signin,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/user");
const { isResetTokenValid } = require("../middlewares/user");
const { validateUser, validate } = require("../middlewares/validator");

router.post("/api/user/create", validateUser, validate, createUser);
router.post("/api/user/signin", signin);
router.post("/api/user/verify-email", verifyEmail);
router.post("/api/user/forgot-password", forgotPassword);
router.post("/api/user/reset-password", isResetTokenValid, resetPassword);
router.get("/api/user/verify-token", isResetTokenValid, (req, res) => {
  res.json({ success: true });
});

module.exports = router;
