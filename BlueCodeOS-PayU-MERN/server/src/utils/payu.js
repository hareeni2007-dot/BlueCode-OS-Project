import crypto from "node:crypto";

export function sha512(value) {
  return crypto.createHash("sha512").update(value, "utf8").digest("hex").toLowerCase();
}

export function createRequestHash({ key, txnid, amount, productinfo, firstname, email, salt }) {
  const udf = Array(10).fill("");
  const sequence = [
    key, txnid, amount, productinfo, firstname, email,
    ...udf, salt
  ].join("|");
  return sha512(sequence);
}

export function verifyResponseHash(body, salt) {
  const {
    status = "", email = "", firstname = "", productinfo = "",
    amount = "", txnid = "", key = "", hash = ""
  } = body;
  const udfReverse = [];
  for (let i = 10; i >= 1; i--) udfReverse.push(body[`udf${i}`] ?? "");
  // PayU response hash reverses the request sequence.
  const sequence = [
    salt, status, ...udfReverse, email, firstname, productinfo, amount, txnid, key
  ].join("|");
  const calculated = sha512(sequence);
  const supplied = String(hash).toLowerCase();
  const a = Buffer.from(calculated);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
