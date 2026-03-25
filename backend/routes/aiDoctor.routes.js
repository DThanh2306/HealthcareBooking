const express = require("express");
const controller = require("../controllers/aiDoctor.controller");
const router = express.Router();

router.get("/health", controller.health);
router.post("/start", controller.startConversation);
router.post("/message", controller.sendMessage);

module.exports = router;





