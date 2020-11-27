
import Web3 from "web3";
import fs from "fs";
import axios from "axios";
import Cors from "cors";

import {startDatabase} from "./database/mongo";
import {insertDelegateTx, insertVoteTx , getTxs, delegationAllowed, voteAllowed} from "./database/awaitingTxs";

const web3 = new Web3(process.env.WEB3_URL);
const sigRelayerAbi = JSON.parse(fs.readFileSync('pages/api/helperFunctions/abi/SigRelayer.abi'));
const compAbi = JSON.parse(fs.readFileSync('pages/api/helperFunctions/abi/comp.abi'));
const governanceAlphaAbi = JSON.parse(fs.readFileSync('pages/api/helperFunctions/abi/GovernorAlpha.abi'));
const sigRelayer = new web3.eth.Contract(sigRelayerAbi,'0xf61d8eef3f479dfa24beaa46bf6f235e6e2f7af8');
const compToken = new web3.eth.Contract(compAbi,'0xc00e94cb662c3520282e6f5717214004a7f26888');
const governanceAlpha = new web3.eth.Contract(governanceAlphaAbi,'0xc0da01a04c3f3e0be433606045bb7017a7323e38');


async function runMiddleware(req,res) {
	const cors = Cors({
		methods: ['GET','POST']
	})
	return new Promise((resolve, rejected) => {
		cors(req,res, (result) => {
			if(result instanceof Error) {
				return rejected(result)
			}
			return resolve(result)
		})
	})
}

async function canDelegate(address,delegatee="0x") {
	console.log('got here 1');
	if(address === undefined) {
		console.log('from address false');
		return false;
	}
	address = address.toString().toLowerCase()
	let compBalance,currentDelegatee,delAllowed;
	try {
		[compBalance,currentDelegatee,delAllowed] = await Promise.all([
			compToken.methods.balanceOf(address).call(),
			compToken.methods.delegates(address).call(),
			delegationAllowed(address)
		]);
	}
	catch(err) {
		console.log('reverted');
		console.log(err);
		return false;
	}
	console.log(compBalance);
	console.log(currentDelegatee);
	console.log(delAllowed);
	console.log('got here 2');
	console.log(compBalance >= 1e18)
	console.log(delegatee == "0x")
	return delAllowed && compBalance >= 1e18 && (delegatee == "0x" || delegatee.toString().toLowerCase().localeCompare(currentDelegatee.toString().toLowerCase()) != 0);
};

async function canVote(address,proposalId) {

	if(address === undefined || proposalId === undefined) {
		console.log('invalid params');
		return false;
	}

	address = address.toString().toLowerCase();

	let proposal,votesDelegated,receipt,currentBlock,vAllowed;

	try {
		[proposal,receipt,currentBlock,vAllowed] = await Promise.all([
			governanceAlpha.methods.proposals(proposalId).call(),
			governanceAlpha.methods.getReceipt(proposalId,address).call(),
			web3.eth.getBlockNumber(),
			voteAllowed(address,proposalId)
		]);
		votesDelegated = await compToken.methods.getPriorVotes(address,proposal.startBlock).call();
	}
	catch(err) {
		console.log('reverted');
		console.log(err);
		return false;
	}

	if(!(currentBlock > proposal.startBlock && proposal.currentBlock < (proposal.endBlock-5)) || proposal.canceled) {
		console.log('Voting period over');
		return false;
	}

	return votesDelegated > 1e18 && !receipt.hasVoted && vAllowed;
}
async function vote(address, proposalId, support, v, r, s) {
	if([address,proposalId,support,v,r,s].includes(undefined)) {
		return false;
	}

	address = address.toString().toLowerCase();

    let sigAddress, canVoteVerified

    try {
	    [sigAddress, canVoteVerified] = await Promise.all([
	    	sigRelayer.methods.signatoryFromVoteSig(proposalId, support, v, r, s).call().toString().toLowerCase(),
	    	canVote(address, proposalId)
	    ]);
	}
	catch {
		return false;
	}

    if(address.localeCompare(sigAddress.toString().toLowerCase()) != 0) {
    	return false;
    }

    if(!canVoteVerified) {
    	return false;
    }

    let newTx = {};
    newTx.v = v;
    newTx.r = r;
    newTx.s = s;
    newTx.support = support;
    newTx.from = address;
	newTx.type = 'vote';
	newTx.createdAt = new Date();
	newTx.executed = false;

	try {
		await insertVoteTx(newTx);
	}

	catch {
		return false;
	}
	axios.get(process.env.NOTIFICATION_HOOK + 'New comp.vote voting sig');
	return true;
}

async function delegate(address, delegatee, nonce, expiry, v, r, s) {
	if([address,delegatee,nonce,expiry,v,r,s].includes(undefined)) {
		return false;
	}

	address = address.toString().toLowerCase();
	delegatee = delegatee.toString().toLowerCase();

	let sigAddress, canDelegateVerified;

	[sigAddress, canDelegateVerified] = await Promise.all([
		sigRelayer.methods.signatoryFromDelegateSig(delegatee, nonce, expiry, v, r, s).call(),
		canDelegate(address, delegatee)
	]);

	sigAddress = sigAddress.toString().toLowerCase()

	if(sigAddress.localeCompare(address) != 0) {
		return false;
	}


	if(!canDelegateVerified) {
		return false;
	}

	let newTx = {};

	newTx.from = address;
	newTx.v = v;
	newTx.r = r;
	newTx.s = s;
	newTx.nonce = nonce;
	newTx.expiry = expiry;
	newTx.type = 'delegate';
	newTx.createdAt = new Date();
	newTx.executed = false;

	console.log('here 1')

	try {
		await insertDelegateTx(newTx);
	}
	catch {
		return false;
	}
	console.log('here 3')

	axios.get(process.env.NOTIFICATION_HOOK + 'New comp.vote delegation sig');
	return true;
}

module.exports = {
	canDelegate,
	canVote,
	vote,
	delegate,
	runMiddleware
}




