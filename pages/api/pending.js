import { getPendingTransactions } from "helpers"; // canVote helper

export default async (req, res) => {
  // Collect address and proposalId
  const { address, proposalId } = req.query;
  let pendingTransactions;

  try {
    // Check if address can vote for proposalId
    pendingTransactions = await getPendingTransactions();
    

  } catch (error) {
    // Check for error
    res.status(error.code).send({
      message: error.message,
    });
    return;
  }

  res.status(200).json(pendingTransactions);
};
