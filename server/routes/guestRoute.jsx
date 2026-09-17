const router = require("express").Router();
const controller = require("../controller/guestController.jsx");

router.post("/", controller.createGuest);
router.get("/", controller.listGuests);
router.get("/notifications", controller.getNotifications);
router.post("/:id/reanalyze", controller.refreshGuestAnalysis);
router.patch("/:id/booking-status", controller.updateBookingStatus);
router.patch("/:id/staff-actions", controller.updateStaffActions);
router.get("/:id", controller.getGuest);

module.exports = router;
