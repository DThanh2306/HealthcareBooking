const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.post("/vnpay/create", paymentController.createVNPayPayment);
router.get("/vnpay/return", paymentController.vnpayReturn);

module.exports = router;
