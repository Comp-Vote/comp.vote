import fs from "fs";
import Web3 from "web3";
import axios from "axios";
import Cors from "cors";

import {
  insertDelegateTx,
  insertVoteTx,
  delegationAllowed,
  voteAllowed,
} from "helpers/database/awaitingTxs";

const web3 = new Web3(process.env.NEXT_PUBLIC_INFURA_RPC);
const sigRelayerAbi = JSON.parse(fs.readFileSync("helpers/abi/SigRelayer.abi"));
const compAbi = JSON.parse(fs.readFileSync("helpers/abi/comp.abi"));
const governanceAlphaAbi = JSON.parse(
  fs.readFileSync("helpers/abi/GovernorAlpha.abi")
);
const sigRelayer = new web3.eth.Contract(
  sigRelayerAbi,
  "0xf61d8eef3f479dfa24beaa46bf6f235e6e2f7af8"
);
const compToken = new web3.eth.Contract(
  compAbi,
  "0xc00e94cb662c3520282e6f5717214004a7f26888"
);
const governanceAlpha = new web3.eth.Contract(
  governanceAlphaAbi,
  "0xc0da01a04c3f3e0be433606045bb7017a7323e38"
);

async function runMiddleware(req, res) {
  const cors = Cors({
    methods: ["GET", "POST"],
  });
  return new Promise((resolve, rejected) => {
    cors(req, res, (result) => {
      if (result instanceof Error) {
        return rejected(result);
      }
      return resolve(result);
    });
  });
}

/**
 * Checks if address can delegate by sig to given delegatee
 * @param {String} address to delegate from
 * @param {String} delegatee address to delegate to (optional)
 */
async function canDelegate(address, delegatee = "0x") {
  if (address === undefined) {
    const err = new Error("invalid address input");
    err.code = 422;
    throw err;
  }
  address = address.toString().toLowerCase();

  // Gets the address onchain COMP balance, current address
  // delegated to and checks if database for delegationAllowed
  let compBalance, currentDelegatee;
  try {
    [compBalance, currentDelegatee] = await Promise.all([
      compToken.methods.balanceOf(address).call(),
      compToken.methods.delegates(address).call(),
      delegationAllowed(address),
    ]);
  } catch (err) {
    if (typeof err.code == "number") {
      throw err;
    }
    const newErr = new Error("error fetching data from blockchain");
    newErr.code = 500;
    throw newErr;
  }
  // Enforces a min COMP balance of 1
  if (compBalance <= 1e18) {
    const err = new Error("COMP balance too low");
    err.code = 403;
    throw err;
  }
  // If delegatee is specified, must not match existing delegatee
  if (
    delegatee != "0x" &&
    delegatee
      .toString()
      .toLowerCase()
      .localeCompare(currentDelegatee.toString().toLowerCase()) == 0
  ) {
    const err = new Error("delegatee can not be current delegatee");
    err.code = 403;
    throw err;
  }
}

/**
 * Checks if an address can vote by sig for the given proposal
 * @param {String} address
 * @param {Number} proposalId
 */
async function canVote(address, proposalId) {
  if (typeof address == "undefined" || typeof proposalId == "undefined") {
    const err = new Error("invalid input");
    err.code = 422;
    throw err;
  }

  address = address.toString().toLowerCase();

  // On chain proposal data
  let proposal;
  // On chain votes delegated at start of proposal
  let votesDelegated;
  // Address proposal receipt. Stores voting status
  let receipt;
  // Current chain block
  let currentBlock;

  try {
    [proposal, receipt, currentBlock] = await Promise.all([
      governanceAlpha.methods.proposals(proposalId).call(),
      governanceAlpha.methods.getReceipt(proposalId, address).call(),
      web3.eth.getBlockNumber(),
      voteAllowed(address, proposalId),
    ]);
    votesDelegated = await compToken.methods
      .getPriorVotes(address, proposal.startBlock)
      .call();
  } catch (err) {
    if (typeof err.code == "number") {
      // error thrown from DB vote allowed. Throw to res
      throw err;
    }
    const newErr = new Error("error fetching data from blockchain");
    newErr.code = 500;
    throw newErr;
  }

  // Not ongoing proposal. Leaves a 5 block buffer for last minute relay
  if (
    !(
      currentBlock > proposal.startBlock &&
      proposal.currentBlock < proposal.endBlock - 5
    ) ||
    proposal.canceled
  ) {
    const err = new Error("proposal voting period is not active");
    err.code = 400;
    throw err;
  }

  // Require at least 1 COMP delegated
  if (votesDelegated < 1e18) {
    const err = new Error("must have at least 1 COMP delegated");
    err.code = 403;
    throw err;
  }

  // address has not voted yet
  if (receipt.hasVoted) {
    const err = new Error("address already voted");
    err.code = 400;
    throw err;
  }
}

/**
 * Validates the given vote by sig data and saves it to the database
 * @param {String} address that created the signature
 * @param {Number} proposalId to vote on
 * @param {bool} support
 * @param {String} v
 * @param {String} r
 * @param {String} s
 */
async function vote(address, proposalId, support, v, r, s) {
  if ([address, proposalId, support, v, r, s].includes(undefined)) {
    const err = new Error("invalid input");
    err.code = 422;
    throw err;
  }

  address = address.toString().toLowerCase();

  // Address verified used to create signature
  let sigAddress;

  try {
    sigAddress = await Promise.all([
      sigRelayer.methods
        .signatoryFromVoteSig(proposalId, support, v, r, s)
        .call()
        .toString()
        .toLowerCase(),
      canVote(address, proposalId),
    ]);
  } catch (err) {
    if (typeof err.code == "number") {
      throw err;
    }
    const newErr = new Error("error fetching data from blockchain");
    newErr.code = 500;
    throw newErr;
  }

  sigAddress = sigAddress.toString().toLowerCase();

  // Address verified to create sig and alleged must match
  if (address.localeCompare(sigAddress.toString().toLowerCase()) != 0) {
    const err = new Error("given address does not match signer address");
    err.code = 422;
    throw err;
  }

  let newTx = {};
  newTx.v = v;
  newTx.r = r;
  newTx.s = s;
  newTx.support = support;
  newTx.from = address;
  newTx.type = "vote";
  newTx.createdAt = new Date();
  newTx.executed = false;

  await insertVoteTx(newTx);

  // Send notification to admin using telegram
  if (typeof process.env.NOTIFICATION_HOOK != "undefined") {
    axios.get(process.env.NOTIFICATION_HOOK + "New comp.vote voting sig");
  }
}

/**
 * Validates the given delegate by sig data and saves it to the database
 * @param {String} address that created the signature
 * @param {String} delegatee to delegate to
 * @param {Number} nonce
 * @param {Number} expiry UNIX time when signature expires
 * @param {String} v
 * @param {String} r
 * @param {String} s
 */
async function delegate(address, delegatee, nonce, expiry, v, r, s) {
  // Validate input data
  if ([address, delegatee, nonce, expiry, v, r, s].includes(undefined)) {
    const err = new Error("invalid input");
    err.code = 422;
    throw err;
  }

  address = address.toString().toLowerCase();
  delegatee = delegatee.toString().toLowerCase();

  // Address verified used to create signature
  let sigAddress;

  try {
    sigAddress = await Promise.all([
      sigRelayer.methods
        .signatoryFromDelegateSig(delegatee, nonce, expiry, v, r, s)
        .call(),
      canDelegate(address, delegatee),
    ]);
  } catch (err) {
    if (typeof err.code == "number") {
      throw err;
    }
    const newErr = new Error("error fetching data from blockchain");
    newErr.code = 500;
    throw newErr;
  }

  sigAddress = sigAddress.toString().toLowerCase();

  // Address verified to create sig and alleged must match
  if (sigAddress.localeCompare(address) != 0) {
    const err = new Error("given address does not match signer address");
    err.code = 422;
    throw err;
  }

  let newTx = {};

  newTx.from = address;
  newTx.v = v;
  newTx.r = r;
  newTx.s = s;
  newTx.nonce = nonce;
  newTx.expiry = expiry;
  newTx.type = "delegate";
  newTx.createdAt = new Date();
  newTx.executed = false;

  await insertDelegateTx(newTx);

  if (typeof process.env.NOTIFICATION_HOOK != "undefined") {
    axios.get(process.env.NOTIFICATION_HOOK + "New comp.vote delegation sig");
  }
}

export { canDelegate, canVote, vote, delegate, runMiddleware };
