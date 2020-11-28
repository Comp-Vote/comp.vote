import { vote, runMiddleware } from "helpers";

export default async function handler(req, res) {
  // Runs CORS middleware
  await runMiddleware(req, res);

  const newTx = req.body;
  const proposalId = newTx.proposalId;
  const support = newTx.support;
  const address = newTx.address;
  const v = newTx.v;
  const r = newTx.r;
  const s = newTx.s;

  // Validate and submit tx. Reverts on error with message and code
  try {
    await vote(address, proposalId, support, v, r, s);
  } catch (err) {
    res.status(err.code).json(JSON.stringify({ message: err.message }));
    return;
  }
  res.status(200).json(JSON.stringify({ message: "successful" }));
}
