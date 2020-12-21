import { canVote } from "helpers"; // canVote helper

export default async (req, res) => {
  // Collect address and proposalId
  const { address, proposalId } = req.query;

  try {
    // Check if address can vote for proposalId
    await canVote(address, proposalId);
  } catch (error) {
    // Check for error
    res.status(error.code).send({
      message: error.message,
    });
    return;
  }

  // If success, return
  res.status(200).end();
};
