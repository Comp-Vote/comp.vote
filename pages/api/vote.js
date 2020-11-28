import { vote } from "helpers"; // Vote helper

export default async (req, res) => {
  const transaction = req.body; // Collect transaction object

  try {
    // Send vote
    await vote(
      transaction.address,
      transaction.proposalId,
      transaction.support,
      transaction.v,
      transaction.r,
      transaction.s
    );
  } catch (error) {
    // If error, send code and message
    res.status(error.code).end(error.message);
  }

  // Else, return success
  res.status(200);
};
