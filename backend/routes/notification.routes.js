const express = require("express");
const router = express.Router();
const controller = require("../controllers/notification.controller");
const auth = require("../middlewares/auth.middleware");

// Doctor notifications routes
router.get(
  "/doctor/notifications",
  auth.verifyToken,
  auth.requireDoctor,
  controller.getDoctorNotifications
);

router.patch(
  "/doctor/notifications/:id/read",
  auth.verifyToken,
  auth.requireDoctor,
  controller.markDoctorNotificationRead
);

// Optional: acknowledge endpoint (alias to read for now)
router.patch(
  "/doctor/notifications/:id/acknowledge",
  auth.verifyToken,
  auth.requireDoctor,
  controller.markDoctorNotificationRead
);

module.exports = router;
