
const {startDatabase} = require('./database/mongo');
const {insertDelegateTx, insertVoteTx , getTxs, delegationAllowed, voteAllowed} = require('./database/awaitingTxs');
const Web3 = require('web3');
const fs = require('fs');
const axios = require('axios');
const web3 = new Web3(process.env.WEB3_URL);
const sigRelayerAbi = JSON.parse(fs.readFileSync('pages/api/helperFunctions/abi/SigRelayer.abi'));
const compAbi = JSON.parse(fs.readFileSync('pages/api/helperFunctions/abi/comp.abi'));
const governanceAlphaAbi = JSON.parse(fs.readFileSync('pages/api/helperFunctions/abi/GovernorAlpha.abi'));
const sigRelayer = new web3.eth.Contract(sigRelayerAbi,'0xf61d8eef3f479dfa24beaa46bf6f235e6e2f7af8');
const compToken = new web3.eth.Contract(compAbi,'0xc00e94cb662c3520282e6f5717214004a7f26888');
const governanceAlpha = new web3.eth.Contract(governanceAlphaAbi,'0xc0da01a04c3f3e0be433606045bb7017a7323e38');


async function canDelegate(address,delegateTo="0x") {
	let fromAddress = address;

	if(fromAddress === undefined) {
		console.log('from address false');
		return false;
	}
	fromAddress = address.toString().toLowerCase()
	let compBalance,currentDelegate,delAllowed;
	try {
		[compBalance,currentDelegate,delAllowed] = await Promise.all([
			compToken.methods.balanceOf(fromAddress).call(),
			compToken.methods.delegates(fromAddress).call(),
			delegationAllowed(fromAddress)
		]);
	}
	catch {
		console.log('reverted');
		return false;
	}
	console.log(compBalance);
	console.log(currentDelegate);
	console.log(delAllowed);
	return delAllowed && compBalance >= 1e18 && (delegateTo == "0x" || delegateTo.toLowerCase().compareLocale(currentDelegate.toLowerCase()) == 0);
};

async function canVote(address,propId) {
	let fromAddress = address;
	let proposalId = propId;

	if(fromAddress === undefined || proposalId === undefined) {
		console.log('invalid params');
		return false;
	}

	fromAddress = fromAddress.toString().toLowerCase();

	let proposal,votesDelegated,receipt,currentBlock,vAllowed;

	try {
		[proposal,receipt,currentBlock,vAllowed] = await Promise.all([
			governanceAlpha.methods.proposals(proposalId).call(),
			governanceAlpha.methods.getReceipt(proposalId,fromAddress).call(),
			web3.eth.getBlockNumber(),
			voteAllowed(fromAddress,proposalId)
		]);
		votesDelegated = await compToken.methods.getPriorVotes(fromAddress,proposal.startBlock).call();
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

module.exports = {
	canDelegate,
	canVote
}


