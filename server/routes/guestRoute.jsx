const router = require("express").Router();
const controller = require("../controller/guestController.jsx");

router.post("/", controller.createGuest);
router.get("/", controller.listGuests);
router.get("/notifications", controller.getNotifications);
router.patch("/:id/booking-status", controller.updateBookingStatus);
router.get("/:id", controller.getGuest);

module.exports = router;
