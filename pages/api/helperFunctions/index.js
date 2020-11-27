import Web3 from "web3";
import fs from "fs";
import axios from "axios";
import Cors from "cors";

import {
  insertDelegateTx,
  insertVoteTx,
  delegationAllowed,
  voteAllowed,
} from "./database/awaitingTxs";

const web3 = new Web3(process.env.WEB3_URL);
const sigRelayerAbi = JSON.parse(
  fs.readFileSync("pages/api/helperFunctions/abi/SigRelayer.abi")
);
const compAbi = JSON.parse(
  fs.readFileSync("pages/api/helperFunctions/abi/comp.abi")
);
const governanceAlphaAbi = JSON.parse(
  fs.readFileSync("pages/api/helperFunctions/abi/GovernorAlpha.abi")
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
    return false;
  }
  address = address.toString().toLowerCase();

  // Gets the address onchain COMP balance, current address
  // delegated to and checks if database for delegationAllowed
  let compBalance, currentDelegatee, delAllowed;
  try {
    [compBalance, currentDelegatee, delAllowed] = await Promise.all([
      compToken.methods.balanceOf(address).call(),
      compToken.methods.delegates(address).call(),
      delegationAllowed(address),
    ]);
  } catch (err) {
    return false;
  }
  // Enforces a min COMP balance of 1
  // If delegatee is specified, must not match existing delegatee
  return (
    delAllowed &&
    compBalance >= 1e18 &&
    (delegatee == "0x" ||
      delegatee
        .toString()
        .toLowerCase()
        .localeCompare(currentDelegatee.toString().toLowerCase()) != 0)
  );
}

/**
 * Checks if an address can vote by sig for the given proposal
 * @param {String} address
 * @param {Number} proposalId
 */
async function canVote(address, proposalId) {
  if (address === undefined || proposalId === undefined) {
    return false;
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
  // Database validity check
  let vAllowed;

  try {
    [proposal, receipt, currentBlock, vAllowed] = await Promise.all([
      governanceAlpha.methods.proposals(proposalId).call(),
      governanceAlpha.methods.getReceipt(proposalId, address).call(),
      web3.eth.getBlockNumber(),
      voteAllowed(address, proposalId),
    ]);
    votesDelegated = await compToken.methods
      .getPriorVotes(address, proposal.startBlock)
      .call();
  } catch (err) {
    return false;
  }

  // Not ongoing proposal. Leaves a 5 block buffer for last minute relay
  if (
    !(
      currentBlock > proposal.startBlock &&
      proposal.currentBlock < proposal.endBlock - 5
    ) ||
    proposal.canceled
  ) {
    return false;
  }

  // Require at least 1 COMP delegated and address has not voted yet
  return votesDelegated > 1e18 && !receipt.hasVoted && vAllowed;
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
    return false;
  }

  address = address.toString().toLowerCase();

  // Address verified used to create signature
  let sigAddress;
  // Result of canVote function
  let canVoteVerified;

  try {
    [sigAddress, canVoteVerified] = await Promise.all([
      sigRelayer.methods
        .signatoryFromVoteSig(proposalId, support, v, r, s)
        .call()
        .toString()
        .toLowerCase(),
      canVote(address, proposalId),
    ]);
  } catch (err) {
    return false;
  }

  sigAddress = sigAddress.toString().toLowerCase();

  // Address verified to create sig and alleged must match
  if (address.localeCompare(sigAddress.toString().toLowerCase()) != 0) {
    return false;
  }

  if (!canVoteVerified) {
    return false;
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

  try {
    await insertVoteTx(newTx);
  } catch (err) {
    return false;
  }

  // Send notification to admin using telegram
  axios.get(process.env.NOTIFICATION_HOOK + "New comp.vote voting sig");
  return true;
}

/**
 * Validates the given delegate by sig data and saves it to the database
 * @param {*} address that created the signature
 * @param {*} delegatee to delegate to
 * @param {*} nonce
 * @param {*} expiry UNIX time when signature expires
 * @param {*} v
 * @param {*} r
 * @param {*} s
 */
async function delegate(address, delegatee, nonce, expiry, v, r, s) {
  // Validate input data
  if ([address, delegatee, nonce, expiry, v, r, s].includes(undefined)) {
    return false;
  }

  address = address.toString().toLowerCase();
  delegatee = delegatee.toString().toLowerCase();

  // Address verified used to create signature
  let sigAddress;
  // Result of canDelegate function
  let canDelegateVerified;

  [sigAddress, canDelegateVerified] = await Promise.all([
    sigRelayer.methods
      .signatoryFromDelegateSig(delegatee, nonce, expiry, v, r, s)
      .call(),
    canDelegate(address, delegatee),
  ]);

  sigAddress = sigAddress.toString().toLowerCase();

  // Address verified to create sig and alleged must match
  if (sigAddress.localeCompare(address) != 0) {
    return false;
  }

  if (!canDelegateVerified) {
    return false;
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

  try {
    await insertDelegateTx(newTx);
  } catch (err) {
    return false;
  }

  axios.get(process.env.NOTIFICATION_HOOK + "New comp.vote delegation sig");
  return true;
}

module.exports = {
  canDelegate,
  canVote,
  vote,
  delegate,
  runMiddleware,
};
