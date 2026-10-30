import { Router } from "express";
import crypto from "node:crypto";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import { PLANS } from "../config/plans.js";
import { createRequestHash, verifyResponseHash } from "../utils/payu.js";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const { planId, firstname, email, phone } = req.body ?? {};
    const plan = PLANS[String(planId ?? "")];
    if (!plan) return res.status(400).json({ message: "Choose a valid subscription plan." });

    const cleanName = String(firstname ?? "").trim().slice(0, 80);
    const cleanEmail = String(email ?? "").trim().toLowerCase().slice(0, 254);
    const cleanPhone = String(phone ?? "").trim().replace(/[^\d+]/g, "").slice(0, 20);
    if (cleanName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanPhone.length < 8) {
      return res.status(400).json({ message: "Enter a valid name, email address, and phone number." });
    }

    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    if (!key || !salt) return res.status(503).json({ message: "PayU is not configured. Add credentials to server/.env." });

    const txnid = `bc${Date.now()}${crypto.randomBytes(4).toString("hex")}`.slice(0, 25);
    const amount = Number(plan.amount).toFixed(2);
    const productinfo = `BlueCode OS ${plan.name} subscription`;
    const hash = createRequestHash({
      key, txnid, amount, productinfo, firstname: cleanName, email: cleanEmail, salt
    });

    await Payment.create({
      txnid, planId: plan.id, planName: plan.name, amount: Number(amount),
      firstname: cleanName, email: cleanEmail, phone: cleanPhone, status: "pending"
    });

    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fields = {
      key, txnid, amount, productinfo, firstname: cleanName, email: cleanEmail,
      phone: cleanPhone,
      surl: `${serverUrl}/api/payments/callback`,
      furl: `${serverUrl}/api/payments/callback`,
      hash
    };
    for (let i = 1; i <= 10; i++) fields[`udf${i}`] = "";

    res.json({
      paymentUrl: process.env.PAYU_PAYMENT_URL || "https://test.payu.in/_payment",
      fields
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "Could not create a unique transaction. Please try again." });
    console.error("PayU create error:", error.message);
    res.status(500).json({ message: "Unable to start payment." });
  }
});

// PayU posts application/x-www-form-urlencoded data to this callback.
router.post("/callback", async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const body = req.body ?? {};
    const txnid = String(body.txnid ?? "");
    const payment = await Payment.findOne({ txnid });
    const salt = process.env.PAYU_MERCHANT_SALT;

    if (!payment || !salt) return res.redirect(`${clientUrl}/payment-result?status=verification_failed`);

    const hashVerified = verifyResponseHash(body, salt);
    const amountMatches = Number(body.amount) === Number(payment.amount);
    const keyMatches = String(body.key ?? "") === String(process.env.PAYU_MERCHANT_KEY ?? "");
    if (!hashVerified || !amountMatches || !keyMatches) {
      payment.status = "verification_failed";
      payment.hashVerified = false;
      payment.rawResponse = { status: String(body.status ?? ""), txnid };
      await payment.save();
      return res.redirect(`${clientUrl}/payment-result?status=verification_failed`);
    }

    payment.hashVerified = true;
    payment.payuStatus = String(body.status ?? "");
    payment.mihpayid = String(body.mihpayid ?? "");
    // Only activate for PayU's success status after hash and amount checks.
    if (String(body.status ?? "").toLowerCase() === "success") {
      payment.status = "success";
      payment.rawResponse = { status: body.status, mihpayid: body.mihpayid ?? "" };
      await payment.save();

      const startedAt = new Date();
      const periodEndsAt = new Date(startedAt);
      periodEndsAt.setMonth(periodEndsAt.getMonth() + 1);
      await Subscription.findOneAndUpdate(
        { txnid: payment.txnid },
        {
          paymentId: payment._id, txnid: payment.txnid,
          planId: payment.planId, planName: payment.planName,
          customerEmail: payment.email, status: "active", startedAt, periodEndsAt
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.redirect(`${clientUrl}/payment-result?status=success&txnid=${encodeURIComponent(txnid)}`);
    }

    payment.status = "failed";
    payment.rawResponse = { status: body.status ?? "", mihpayid: body.mihpayid ?? "" };
    await payment.save();
    return res.redirect(`${clientUrl}/payment-result?status=failed&txnid=${encodeURIComponent(txnid)}`);
  } catch (error) {
    console.error("PayU callback error:", error.message);
    return res.redirect(`${clientUrl}/payment-result?status=verification_failed`);
  }
});

router.get("/status/:txnid", async (req, res) => {
  try {
    const payment = await Payment.findOne({ txnid: req.params.txnid }).select("-rawResponse -__v");
    if (!payment) return res.status(404).json({ message: "Transaction not found." });
    res.json({ txnid: payment.txnid, planName: payment.planName, amount: payment.amount, status: payment.status });
  } catch {
    res.status(400).json({ message: "Invalid transaction ID." });
  }
});

export default router;
