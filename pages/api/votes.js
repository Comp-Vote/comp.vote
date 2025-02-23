import { getVotes } from "helpers"; // canVote helper

export default async (req, res) => {
  // Collect address and proposalId
  const { address, proposalId } = req.query;
  let fetchedTransactions;

  try {
    fetchedTransactions = await getVotes(proposalId, address);
  } catch (error) {
    res.status(error.code).send({
      message: error.message,
    });
    return;
  }

  res.status(200).json(fetchedTransactions);
};
