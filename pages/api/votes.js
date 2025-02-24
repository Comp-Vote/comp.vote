import { getVotes } from "helpers"; // canVote helper

export default async (req, res) => {
  // Collect address and proposalId
  const { address, proposalId } = req.query;
  let fetchedTransactions;

  if (!proposalId && !address) {
    res.status(400).send("proposalId or address required");
    return;
  }

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
