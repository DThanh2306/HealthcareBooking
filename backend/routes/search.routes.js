const express = require("express");
const router = express.Router();
const controller = require("../controllers/search.controller");

router.get("/all/:keyword", controller.searchAllDoctorsAndHospitals);

module.exports = router;
