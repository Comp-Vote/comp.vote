import axios from "axios"; // Axios requests
import { web3p } from "containers"; // Web3
import { createContainer } from "unstated-next"; // Unstated-next containerization

// Reference implementation: https://github.com/TennisBowling/comp.vote/blob/master/bySig/vote_by_signature.html
function useVote() {
  // Context
  const { web3, address } = web3p.useContainer();

  /**
   * Generate voting message
   * @param {Number} proposalId for Compound Governance proposal
   * @param {boolean} support for or against
   */
  const createVoteBySigMessage = (proposalId, support) => {
    // Types
    const types = {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Ballot: [
        { name: "proposalId", type: "uint256" },
        { name: "support", type: "uint8" },
      ],
    };

    // Return message to sign
    return JSON.stringify({
      types,
      primaryType: "Ballot",
      // Compound Governor contract
      domain: {
        name: "Compound Governor Bravo",
        chainId: 1,
        verifyingContract: "0xc0Da02939E1441F497fd74F78cE7Decb17B66529",
      },
      // Message
      message: {
        proposalId,
        support: support,
      },
    });
  };

  /**
   * Returns promise of web3 signature
   * @param {string} msgParams to sign
   */
  const signVote = async (msgParams) => {
    return new Promise((resolve, reject) => {
      // Sign message
      web3.currentProvider.sendAsync(
        {
          method: "eth_signTypedData_v4",
          params: [address, msgParams],
          from: address,
        },
        async (error, result) => {
          // If no error
          if (!error) {
            // Resolve promise with resulting signature
            resolve(result.result);
          } else {
            // Reject promise with resulting error
            reject(error);
          }
        }
      );
    });
  };

  /**
   * Generate a FOR vote for the proposalId
   * @param {Number} proposalId of Compound governance proposal
   */
  const voteFor = async (proposalId) => {
    // Generate and sign message
    const msgParams = createVoteBySigMessage(proposalId, 1);
    const signedMsg = await signVote(msgParams);

    // POST vote to server
    await castVote(proposalId, 1, signedMsg);
  };

  /**
   * Generate an AGAINST vote for the proposalId
   * @param {Number} proposalId of compund governance proposal
   */
  const voteAgainst = async (proposalId) => {
    // Generate and sign message
    const msgParams = createVoteBySigMessage(proposalId, 0);
    const signedMsg = await signVote(msgParams);

    // POST vote to server
    await castVote(proposalId, 0, signedMsg);
  };

  /**
   * Generate an ABSTAIN vote for the proposalId
   * @param {Number} proposalId of compund governance proposal
   */
  const voteAbstain = async (proposalId) => {
    // Generate and sign message
    const msgParams = createVoteBySigMessage(proposalId, 2);
    const signedMsg = await signVote(msgParams);

    // POST vote to server
    await castVote(proposalId, 2, signedMsg);
  };

  /**
   * POSTS vote to back-end
   * @param {Number} proposalId of compound governance proposal
   * @param {boolean} support indicating for || against status for proposal
   * @param {string} signedMsg from Web3
   */
  const castVote = async (proposalId, support, signedMsg) => {
    // Collect r, s, v
    const r = "0x" + signedMsg.substring(2, 66);
    const s = "0x" + signedMsg.substring(66, 130);
    const v = "0x" + signedMsg.substring(130, 132);

    // Post to back-end
    await axios
      .post("/api/vote", {
        address,
        r,
        s,
        v,
        proposalId,
        support,
      })
      // If successful
      .then(() => {
        // Alert successful
        alert("Success!");
      })
      // Else,
      .catch((error) => {
        // Alert error message
        alert("Error: " + error.response.data.message);
      });
  };

  return {
    voteFor,
    voteAgainst,
    voteAbstain
  };
}

// Create unstated-next container
const vote = createContainer(useVote);
export default vote;
