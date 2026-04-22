const db = require("../config/db");
const vnpayService = require("../services/vnpay.service");
const appointmentService = require("../services/appointment.service");
const qs = require("qs");
const crypto = require("crypto");
const config = require("../config/vnpay.config");

// Tạo payment + URL VNPay
exports.createVNPayPayment = async (req, res) => {
  const data = req.body;

  const amount = Number(String(data.amount).replace(/\./g, ''));

  const [result] = await db.query(
    `INSERT INTO payments (id_u, dr_id, amount, appointment_data)
     VALUES (?, ?, ?, ?)`,
    [data.id_u, data.dr_id, amount, JSON.stringify(data)]
  );

  const paymentId = result.insertId;

  const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const paymentUrl = vnpayService.createPaymentUrl(
    ipAddr,
    amount,
    "Thanhtoandatlich",
    paymentId
  );

  res.json({ payment_url: paymentUrl });
};

// VNPay return
exports.vnpayReturn = async (req, res) => {
  let vnp_Params = req.query;

  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sorted = Object.keys(vnp_Params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = vnp_Params[key];
      return obj;
    }, {});

  const signData = qs.stringify(sorted, { encode: false });

  const hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash !== signed) {
    return res.send("Invalid signature");
  }

  const paymentId = vnp_Params["vnp_TxnRef"];
  const responseCode = vnp_Params["vnp_ResponseCode"];

  const [rows] = await db.query(
    "SELECT * FROM payments WHERE id_payment = ?",
    [paymentId]
  );

  const payment = rows[0];

  if (!payment) return res.send("Payment not found");

  if (responseCode === "00") {
    // SUCCESS
    if (payment.status !== "success") {
      const data = payment.appointment_data;

      await appointmentService.createAppointment(data);

      await db.query(
        `UPDATE payments SET status='success', vnp_transaction_no=? WHERE id_payment=?`,
        [vnp_Params["vnp_TransactionNo"], paymentId]
      );
    }

    return res.redirect("http://localhost:5173/payment-success");
  } else {
    await db.query(
      "UPDATE payments SET status='failed' WHERE id_payment=?",
      [paymentId]
    );

    return res.redirect("http://localhost:5173/payment-failed");
  }
};

