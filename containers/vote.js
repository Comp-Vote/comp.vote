import axios from "axios"; // Axios requests
import { web3p } from "containers"; // Web3
import { createContainer } from "unstated-next"; // Unstated-next containerization
import { GOVERNOR_CHARLIE_ADDRESS, GOVERNOR_CHARLIE_ABI } from "helpers/abi";

function useVote() {
  // Context
  const { publicClient, walletClient, address } = web3p.useContainer();

  /**
   * Sign an EIP-712 ballot for the given proposal and support value
   * @param {Number} proposalId for Compound Governance proposal
   * @param {Number} support 0 = against, 1 = for, 2 = abstain
   */
  const signBallot = async (proposalId, support) => {
    const nonce = await publicClient.readContract({
      address: GOVERNOR_CHARLIE_ADDRESS,
      abi: GOVERNOR_CHARLIE_ABI,
      functionName: "nonces",
      args: [address],
    });

    return walletClient.signTypedData({
      account: address,
      domain: {
        name: "Compound Governor",
        version: "1",
        chainId: 1,
        verifyingContract: GOVERNOR_CHARLIE_ADDRESS,
      },
      types: {
        Ballot: [
          { name: "proposalId", type: "uint256" },
          { name: "support", type: "uint8" },
          { name: "voter", type: "address" },
          { name: "nonce", type: "uint256" },
        ],
      },
      primaryType: "Ballot",
      message: {
        proposalId: BigInt(proposalId),
        support,
        voter: address,
        nonce,
      },
    });
  };

  /**
   * POSTS vote to back-end
   * @param {Number} proposalId of compound governance proposal
   * @param {Number} support indicating for || against || abstain status
   * @param {string} signedMsg hex signature from wallet
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
      .then((res) => {
        alert(
          `Success! View your transaction here https://etherscan.io/tx/${res.data.txHash}`
        );
      })
      .catch((error) => {
        alert("Error: " + error.response.data.message);
      });
  };

  const voteFor = async (proposalId) => {
    const sig = await signBallot(proposalId, 1);
    await castVote(proposalId, 1, sig);
  };

  const voteAgainst = async (proposalId) => {
    const sig = await signBallot(proposalId, 0);
    await castVote(proposalId, 0, sig);
  };

  const voteAbstain = async (proposalId) => {
    const sig = await signBallot(proposalId, 2);
    await castVote(proposalId, 2, sig);
  };

  return {
    voteFor,
    voteAgainst,
    voteAbstain,
  };
}

// Create unstated-next container
const vote = createContainer(useVote);
export default vote;
