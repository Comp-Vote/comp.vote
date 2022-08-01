import { getPendingTransactions } from "helpers"; // canVote helper
import { Web3Handler } from "../../helpers/index.js";

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

  const { web3, multicall, compToken, governorBravo } = await Web3Handler();

  const pendingTxsWithStartBlocks = await Promise.all(
    pendingTransactions.map(async (tx) => {
      if (tx.type !== "vote") return null;
      return Object.assign({}, tx, {
        startBlock: (
          await governorBravo.methods.proposals(tx.proposalId).call()
        ).startBlock,
      });
    })
  );

  const voteWeightCalls = pendingTxsWithStartBlocks.map((tx) => {
    if (tx.type !== "vote") return null;
    return {
      target: compToken._address,
      callData: compToken.methods
        .getPriorVotes(tx.from, tx.startBlock)
        .encodeABI(),
    };
  });

  let voteWeights = [
    ...(
      await multicall.methods.aggregate(voteWeightCalls.filter((n) => n)).call()
    ).returnData,
  ];
  pendingTransactions = pendingTransactions.map((tx) => {
    if (tx.type !== "vote") return tx;
    return Object.assign({}, tx, {
      voteWeight: web3.utils.toBN(voteWeights.shift()).div(web3.utils.toBN(10 ** 16)).toNumber()/100,
    });
  });

  res.status(200).json(pendingTransactions);
};
