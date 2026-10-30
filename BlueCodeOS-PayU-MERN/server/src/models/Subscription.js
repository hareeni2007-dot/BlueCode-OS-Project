import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, unique: true },
  txnid: { type: String, required: true, unique: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  customerEmail: { type: String, required: true, lowercase: true },
  status: { type: String, enum: ["active", "inactive"], default: "inactive" },
  startedAt: { type: Date },
  periodEndsAt: { type: Date }
}, { timestamps: true });

const MongooseSubscription = mongoose.model("Subscription", subscriptionSchema);

const memorySubscriptions = new Map();

const SubscriptionAdapter = {
  async findOneAndUpdate(filter, update, options = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseSubscription.findOneAndUpdate(filter, update, options);
    }
    const key = filter.txnid;
    const existing = memorySubscriptions.get(key) || {
      _id: "mem_sub_" + Math.random().toString(36).slice(2, 11),
      createdAt: new Date()
    };
    const merged = { ...existing, ...update, updatedAt: new Date() };
    memorySubscriptions.set(key, merged);
    return merged;
  }
};

export default SubscriptionAdapter;
