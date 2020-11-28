import { delegate, runMiddleware } from "helpers";

export default async function handler(req, res) {
  await runMiddleware(req, res);

  const newTx = req.body;
  const address = newTx.address;
  const delegatee = newTx.delegatee;
  const v = newTx.v;
  const r = newTx.r;
  const s = newTx.s;
  const nonce = newTx.nonce;
  const expiry = newTx.expiry;

  // Validate and submit tx. Reverts on error with message and code
  try {
    await delegate(address, delegatee, nonce, expiry, v, r, s);
  } catch (err) {
    res.status(err.code).json(JSON.stringify({ message: err.message }));
    return;
  }
  res.status(200).json(JSON.stringify({ message: "successful" }));
}
