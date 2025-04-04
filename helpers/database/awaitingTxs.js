import { connectToDatabase } from "helpers/database/mongo"; // Mongo connection

// Database collection name
const collectionName = "awaitingTxs";

/**
 * Inserts delegate tx to the database
 * @param {Object} tx dictionary containing the signature data
 */
const insertDelegateTx = async (tx) => {
  // Collect database connection
  const { db } = await connectToDatabase();

  // Insert delegate transaction
  const { insertedId } = await db.insertOne(tx);

  // Return insertionId
  return insertedId;
};

/**
 * Does database data validation for delegation. Checks
 * if user has pending tx or tx in past week.
 * @param {String} address
 */
const delegationAllowed = async (address) => {
  // Collect database connection
  const { db } = await connectToDatabase();

  // Check for existing transactions from user
  const existingUserTxs = await db
    .find({ from: address, type: "delegate", executed: false })
    .toArray();

  // If existing transactions, throw error
  if (existingUserTxs.length > 0) {
    const error = new Error(
      "user has pending delegate txs. Please wait before queueing more"
    );
    error.code = 403;
    throw error;
  }

  // Check for delegations in past week
  const delegationsInPastWeek = await db
    .find({
      createdAt: {
        $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
      },
      from: address,
      type: "delegate",
    })
    .toArray();

  // If delegations in past week, throw error
  if (delegationsInPastWeek.length > 0) {
    const error = new Error("only one delegation allowed per week");
    error.code = 403;
    throw error;
  }
};

/**
 * Inserts vote tx to the database
 * @param {Object} tx dictionary containing the signature data
 * @returns {String} insertedId Id of the inserted tx
 */
const insertVoteTx = async (tx) => {
  // Collect database connection
  const { db } = await connectToDatabase();

  // Insert vote
  const { insertedId } = await db.insertOne(tx);

  // Return inserted vote id
  return insertedId;
};

/**
 * Validates vote tx based on database data. Checks if user
 * has already submitted a sig for this proposal.
 * @param {String} address
 * @param {Number} proposalId
 */
const voteAllowed = async (address, proposalId) => {
  // Collect database connection
  const { db } = await connectToDatabase();

  // Collect existing user transactions
  const existingUserTxs = await db
    .find({ from: address, executed: false, type: "vote" })
    .toArray();

  const existingVoteForProposal = await db
    .find({ from: address, proposalId, type: "vote" })
    .toArray();

  // If existing transactions, throw error
  if (existingUserTxs.length > 0 || existingVoteForProposal > 0) {
    const error = new Error("only one pending vote at a time");
    error.code = 409;
    throw error;
  }
};

/**

 */
const pendingTransactions = async () => {
  // Collect database connection
  const { db } = await connectToDatabase();

  const pendingTxs = await db.find({ executed: false }).toArray();
  pendingTxs.forEach((tx) => {
    delete tx._id;
    delete tx.executed;
    delete tx.createdAt;
  });
  return pendingTxs;
};

const votes = async (proposalId, address, executed) => {
  const { db } = await connectToDatabase();

  const query = { type: "vote" };
  if (!!proposalId && BigInt(proposalId) > 0)
    query.proposalId = proposalId.toString();
  if (!!address) query.from = address.toString().toLowerCase();
  if (executed !== undefined) query.executed = executed === "true";
  const votes = await db.find(query).sort({ createdAt: -1 }).toArray();
  votes.forEach((tx) => {
    delete tx._id;
    delete tx.createdAt;
  });
  return votes;
};

// Export functions
export {
  insertDelegateTx,
  insertVoteTx,
  delegationAllowed,
  voteAllowed,
  pendingTransactions,
  votes,
};
