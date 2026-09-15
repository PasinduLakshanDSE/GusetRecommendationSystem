const router = require("express").Router();
const { requireAuth } = require("../middlewares/auth.jsx");
const { setupStatus, bootstrapAdmin, login, currentUser, requestPasswordReset, resetPassword } = require("../controller/authController.jsx");

router.get("/setup-status", setupStatus);
router.post("/bootstrap", bootstrapAdmin);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);
router.get("/me", requireAuth, currentUser);

module.exports = router;
