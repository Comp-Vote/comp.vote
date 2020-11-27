import { canDelegate, runMiddleware } from "./helperFunctions";
export default async function handler(req, res) {
  // Runs CORS middleware
  await runMiddleware(req, res);

  // Returns true if succesfull. Will revert on failure with error message.
  const val = await canDelegate(req.query.address);
  res.end(JSON.stringify({ result: val }));
}
