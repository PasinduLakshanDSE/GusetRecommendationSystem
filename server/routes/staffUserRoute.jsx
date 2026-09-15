const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middlewares/auth.jsx");
const { listStaffUsers, createStaffUser, updateStaffStatus } = require("../controller/staffUserController.jsx");

router.use(requireAuth, requireAdmin);
router.get("/", listStaffUsers);
router.post("/", createStaffUser);
router.patch("/:id/status", updateStaffStatus);

module.exports = router;
