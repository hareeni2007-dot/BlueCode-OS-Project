import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  txnid: { type: String, required: true, unique: true, index: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  firstname: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ["pending", "success", "failed", "verification_failed"], default: "pending" },
  payuStatus: { type: String, default: "" },
  mihpayid: { type: String, default: "" },
  hashVerified: { type: Boolean, default: false },
  rawResponse: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const MongoosePayment = mongoose.model("Payment", paymentSchema);

// In-memory fallback store when MongoDB is not running locally
const memoryPayments = new Map();

function wrapDoc(data) {
  if (!data) return null;
  const doc = {
    ...data,
    save: async function () {
      memoryPayments.set(doc.txnid, { ...doc, updatedAt: new Date() });
      return doc;
    }
  };
  return doc;
}

const PaymentAdapter = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePayment.create(data);
    }
    const doc = {
      _id: "mem_" + Math.random().toString(36).slice(2, 11),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
      payuStatus: "",
      mihpayid: "",
      hashVerified: false,
      rawResponse: {},
      ...data
    };
    memoryPayments.set(doc.txnid, doc);
    return wrapDoc(doc);
  },
  findOne(query) {
    if (mongoose.connection.readyState === 1) {
      return MongoosePayment.findOne(query);
    }
    const execute = async () => {
      let found = null;
      if (query?.txnid) {
        found = memoryPayments.get(query.txnid);
      } else {
        for (const doc of memoryPayments.values()) {
          let match = true;
          for (const [k, v] of Object.entries(query || {})) {
            if (doc[k] !== v) { match = false; break; }
          }
          if (match) { found = doc; break; }
        }
      }
      return found ? wrapDoc(found) : null;
    };

    return {
      select() {
        return this;
      },
      then(onFulfilled, onRejected) {
        return execute().then(onFulfilled, onRejected);
      },
      catch(onRejected) {
        return execute().catch(onRejected);
      }
    };
  }
};

export default PaymentAdapter;
