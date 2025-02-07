import Web3 from "web3"; // Web3
import axios from "axios"; // Axios requests
import {
  GOVERNOR_BRAVO_ABI,
  GOVERNOR_CHARLIE_ABI,
  GOVERNOR_CHARLIE_ADDRESS,
  GOVERNANCE_ADDRESS,
  MULTICALL_ABI,
  MULTICALL_ADDRESS,
} from "helpers/abi"; // Contract ABIs + Addresses

/// Global defining key values for proposal states
const statesKey = [
  "Pending", // creation block
  "Active", // start block
  "Canceled", // cancelation block
  "Defeated", // end block
  "Succeeded", // end block
  "Queued", // executionETA - 2 days
  "Expired",
  "Executed", // execution block
];

/// Global defining titles for misformatted proposals
const MISFORMATTED_PROPOSAL_TITLES = {
  380: "[Gauntlet] Supply Cap Recommendations (12/09/24)",
};

const initialProposalBravo = 42;
const initialProposalCharlie = 394;

/**
 * Instantiates server-side web3 connection
 */
const Web3Handler = () => {
  // Setup web3 handler
  const web3 = new Web3(process.env.NEXT_PUBLIC_INFURA_RPC);

  // Setup contracts
  const multicall = new web3.eth.Contract(MULTICALL_ABI, MULTICALL_ADDRESS);

  const governance = new web3.eth.Contract(
    GOVERNOR_BRAVO_ABI,
    GOVERNANCE_ADDRESS
  );

  const governorCharlie = new web3.eth.Contract(
    GOVERNOR_CHARLIE_ABI,
    GOVERNOR_CHARLIE_ADDRESS
  );

  // Return web3 + contracts
  return {
    web3,
    governance,
    multicall,
    governorCharlie,
  };
};

export default async (req, res) => {
  let { page_number = 1, page_size = 10, get_state_times = false } = req.query;
  page_size = Number(page_size);
  page_number = Number(page_number);
  const { web3, governance, multicall, governorCharlie } = Web3Handler();
  const proposalCount = Number(
    await governorCharlie.methods.proposalCount().call()
  );
  const proposalCountMinusAlpha = proposalCount + 1 - initialProposalBravo;

  const offset = (page_number - 1) * page_size;

  let graphRes, states;
  let resData = {};

  let pagination_summary = {};

  pagination_summary.page_number = Number(page_number);
  pagination_summary.total_pages = Math.ceil(
    proposalCountMinusAlpha / page_size
  );

  if (page_number < 1 || page_number > pagination_summary.total_pages) {
    res.status(400).send("Invalid page number");
    return;
  }

  pagination_summary.page_size = page_size;
  pagination_summary.total_entries = proposalCount;
  pagination_summary.total_available_entries = proposalCountMinusAlpha;
  resData.pagination_summary = pagination_summary;

  if (page_number > pagination_summary.total_pages) {
    res.status(500).send("Invalid page number");
    return;
  }

  if (page_number == pagination_summary.total_pages) {
    // Last page. Modify page size to show all remaining proposals
    page_size = proposalCountMinusAlpha - offset;
  }

  [graphRes, states] = await Promise.all([
    axios.post(
      `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/GHB6EWsmMXy2AJaCodmK2AmZviitTZf3Tbo8YEfuh6St`,
      {
        query:
          `{
          proposals(first:` +
          page_size +
          ` skip:` +
          offset +
          ` orderBy:startBlock orderDirection:desc) {
            id
            description
            creationTime
            startBlock
            endBlock
            executionTime
            cancellationTime
            executionETA
          }
        }`,
      }
    ),
    multicall.methods
      .aggregate(
        genStateCalls(
          proposalCount - offset,
          Math.max(initialProposalBravo, proposalCount - offset - page_size),
          web3
        )
      )
      .call(),
  ]);
  let stringStates = [];
  for (const state of states["returnData"]) {
    stringStates.push(statesKey[Number(state[state.length - 1])]);
  }
  let proposalData = [];
  for (const proposal of graphRes.data.data.proposals) {
    let newProposal = {};
    newProposal.title =
      MISFORMATTED_PROPOSAL_TITLES[proposal.id] ??
      proposal.description.split("\n")[0].substring(2);
    newProposal.id = proposal.id;
    newProposal.tally_url = `https://www.tally.xyz/gov/compound/proposal/${proposal.id}?govId=eip155:1:0xc0Da02939E1441F497fd74F78cE7Decb17B66529`;

    const currentState = stringStates.shift();
    let time = null;
    if (get_state_times == "true" || get_state_times == true) {
      time = await getTimeFromState(currentState, proposal, web3);
    }
    let stateObj = { value: currentState, start_time: time };

    newProposal.state = stateObj;
    proposalData.push(newProposal);
  }
  resData.proposals = proposalData;
  res.json(resData);
};

/**
 * Generate hex calls for fetching the state of a range of proposals. Only support Bravo and Charlie proposals.
 * @param {Number} last Last proposal id to fetch state for
 * @param {Number} first First proposal id to fetch state for
 * @param {Web3} web3 Web3 instance, used for encoding parameters
 * @returns Array of calls for multicall. Ordered from last to first proposal id.
 */
function genStateCalls(last, first, web3) {
  let res = [];
  if (last >= initialProposalCharlie) {
    res = res.concat(
      genCalls(
        GOVERNOR_CHARLIE_ADDRESS,
        "0x3e4f49e6",
        last,
        Math.max(first, initialProposalCharlie - 1),
        web3
      )
    );
  }
  if (first < initialProposalCharlie) {
    res = res.concat(
      genCalls(
        GOVERNANCE_ADDRESS,
        "0x3e4f49e6",
        Math.min(last, initialProposalCharlie - 1),
        first,
        web3
      )
    );
  }
  return res;
}

/**
 * Generate hex calls for a call signature and a range of uint256 parameter input
 * @param {String} target Contract to call
 * @param {String} callPrefix Function hex sig
 * @param {Number} last Last input
 * @param {Number} first First input (not inclusive)
 * @param {Web3} web3 Web3 instance, used for encoding parameters
 * @returns [] Call input for multicall
 */
function genCalls(target, callPrefix, last, first, web3) {
  let res = [];
  for (let i = last; i > first; i--) {
    res.push({
      target: target,
      callData:
        callPrefix + web3.eth.abi.encodeParameter("uint256", i).substring(2),
    });
  }
  return res;
}

async function getTimeFromState(state, proposal, web3) {
  let blockToFetch;
  let time = null;

  switch (state) {
    case "Pending":
      time = parseInt(proposal.creationTime);
      break;
    case "Active":
      blockToFetch = proposal.startBlock;
      break;
    case "Canceled":
      time = parseInt(proposal.cancellationTime);
      break;
    case "Defeated":
      blockToFetch = proposal.endBlock;
      break;
    case "Succeeded":
      blockToFetch = proposal.endBlock;
      break;
    case "Queued":
      time = parseInt(proposal.executionETA) - 60 * 60 * 24 * 2; // two days
      break;
    case "Expired":
      time = parseInt(proposal.executionETA) + 1209600; // Grace period of 2 weeks
      break;
    case "Executed":
      time = parseInt(proposal.executionTime);
      break;
    default:
      console.log("fatal error");
      console.log("state is " + state);
  }

  if (time == null) {
    const block = await web3.eth.getBlock(blockToFetch);
    return block.timestamp;
  }

  return time;
}
