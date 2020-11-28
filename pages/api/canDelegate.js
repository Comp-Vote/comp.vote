import { canDelegate, runMiddleware } from "./helperFunctions";
export default async function handler(req, res) {
  // Runs CORS middleware
  await runMiddleware(req, res);

  // Will revert on failure with error message and status code
  try {
    await canDelegate(req.query.address);
  } catch (err) {
    res.status(err.code).json(JSON.stringify({ message: err.message }));
    return;
  }
  res.status(200).json(JSON.stringify({ message: "successful" }));
}
