const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/specialty.controller");
const auth = require("../middlewares/auth.middleware");

// Public list
router.get("/specialties", ctrl.list);
router.get("/specialties/:id", ctrl.get);

// Admin CRUD
router.post("/specialties", auth.verifyToken, auth.requireAdmin, ctrl.create);
router.put("/specialties/:id", auth.verifyToken, auth.requireAdmin, ctrl.update);
router.delete("/specialties/:id", auth.verifyToken, auth.requireAdmin, ctrl.remove);

module.exports = router;
