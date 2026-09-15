const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middlewares/auth.jsx");
const controller = require("../controller/portalSettingsController.jsx");

router.get("/", requireAuth, controller.getSettings);
router.patch("/", requireAuth, requireAdmin, controller.updateSettings);

module.exports = router;
