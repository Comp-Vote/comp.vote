import { getDatabase } from "./mongo";

const collectionName = "awaitingTxs";

async function insertDelegateTx(tx) {
  const database = await getDatabase();
  const existingUserTxs = await database
    .collection(collectionName)
    .find({ from: tx.from, type: "delegate", executed: false })
    .toArray();
  if (existingUserTxs.length > 0) {
    throw new Error(
      "User has pending delegate txs. Please wait before queueing more."
    );
  }

  //Check for any delegations in past week
  const delegationsInPastWeek = await database
    .collection(collectionName)
    .find({
      createdAt: {
        $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
      },
      from: tx.from,
      type: "delegate",
    })
    .toArray();
  if (delegationsInPastWeek.length > 0) {
    throw new Error("Only one delegation allowed per week.");
  }

  const { insertedId } = await database
    .collection(collectionName)
    .insertOne(tx);
  return insertedId;
}

async function delegationAllowed(address) {
  const database = await getDatabase();
  const delegationsInPastWeek = await database
    .collection(collectionName)
    .find({
      createdAt: {
        $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
      },
      from: address,
      type: "delegate",
    })
    .toArray();
  if (delegationsInPastWeek.length > 0) {
    throw new Error("Only one delegation allowed per week.");
  } else {
    return true;
  }
}

async function insertVoteTx(tx) {
  const database = await getDatabase();
  let existingUserTxs;

  existingUserTxs = await database
    .collection(collectionName)
    .find({ from: tx.from, proposalId: tx.proposalId, type: "vote" })
    .toArray();
  if (existingUserTxs.length > 0) {
    throw new Error("User already voted for this proposal.");
  }

  // Check if user has enough votes for the proposal or if voted on chain.

  const { insertedId } = await database
    .collection(collectionName)
    .insertOne(tx);
  return insertedId;
}

async function voteAllowed(address, proposalId) {
  const database = await getDatabase();
  let existingUserTxs = await database
    .collection(collectionName)
    .find({ from: address, proposalId: proposalId, type: "vote" })
    .toArray();
  if (existingUserTxs.length > 0) {
    throw new Error("User already voted for this proposal.");
  } else {
    return true;
  }
}

async function getTxs() {
  const database = await getDatabase();
  return await database.collection(collectionName).find({}).toArray();
}

module.exports = {
  insertDelegateTx,
  insertVoteTx,
  getTxs,
  delegationAllowed,
  voteAllowed,
};
