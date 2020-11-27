import { getDatabase } from "./mongo";

const collectionName = "awaitingTxs";

/**
 * Inserts delegate tx to the database
 * @param {Object} tx dictionary containing the signature data
 */
async function insertDelegateTx(tx) {
  const database = await getDatabase();

  const { insertedId } = await database
    .collection(collectionName)
    .insertOne(tx);
  return insertedId;
}

/**
 * Does database data validation for delegation. Checks
 * if user has pending tx or tx in past week.
 * @param {String} address
 */
async function delegationAllowed(address) {
  const database = await getDatabase();

  const existingUserTxs = await database
    .collection(collectionName)
    .find({ from: address, type: "delegate", executed: false })
    .toArray();
  if (existingUserTxs.length > 0) {
    const err = new Error(
      "user has pending delegate txs. Please wait before queueing more"
    );
    err.code = 403;
    throw err;
  }
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
    const err = new Error("only one delegation allowed per week");
    err.code = 403;
    throw err;
  }
}

/**
 * Inserts vote tx to the database
 * @param {Object} tx dictionary containing the signature data
 * @returns {String} insertedId Id of the inserted tx
 */
async function insertVoteTx(tx) {
  const database = await getDatabase();
  const { insertedId } = await database
    .collection(collectionName)
    .insertOne(tx);
  return insertedId;
}

/**
 * Validates vote tx based on database data. Checks if user
 * has already submitted a sig for this proposal.
 * @param {String} address
 * @param {Number} proposalId
 */
async function voteAllowed(address, proposalId) {
  const database = await getDatabase();
  let existingUserTxs = await database
    .collection(collectionName)
    .find({ from: address, proposalId: proposalId, type: "vote" })
    .toArray();
  if (existingUserTxs.length > 0) {
    const err = new Error("user already voted for this proposal");
    err.code = 409;
    throw err;
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
