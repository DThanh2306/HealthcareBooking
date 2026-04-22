const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");

const createPaymentUrl = (ipAddr, amount, orderInfo, txnRef) => {
  const tmnCode = "B77INC60";
  const secretKey = "NU3W61XPNAW4DDRSYM30E0G4GL97VG7M";
  const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = "http://localhost:3000/api/payment/vnpay/return";

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: amount * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef.toString(), // 🔥 QUAN TRỌNG
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
  };

  // sort + encode chuẩn VNPay
  vnp_Params = Object.keys(vnp_Params)
    .sort()
    .reduce((result, key) => {
      result[key] = encodeURIComponent(vnp_Params[key]).replace(/%20/g, "+");
      return result;
    }, {});

  const signData = qs.stringify(vnp_Params, { encode: false });

  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(signData, "utf-8")
    .digest("hex");

  vnp_Params["vnp_SecureHash"] = secureHash;

  return vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });
};

module.exports = {
  createPaymentUrl
};
