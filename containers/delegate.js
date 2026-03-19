import axios from "axios"; // Axios requests
import { web3p } from "containers"; // Web3
import { COMP_ABI, COMP_ADDRESS } from "helpers/abi"; // Compound (COMP) Governance Token ABI
import { useState, useEffect } from "react"; // State management
import { createContainer } from "unstated-next"; // Unstated-next containerization

// Reference implementation: https://github.com/TennisBowling/comp.vote/blob/master/bySig/delegate_by_signature.html
function useDelegate() {
  // Context
  const { publicClient, walletClient, address } = web3p.useContainer();

  // Local state
  const [currentDelegate, setCurrentDelegate] = useState(null); // Current delegate

  /**
   * Sign an EIP-712 delegation message
   * @param {string} delegatee address to delegate voting power to
   * @param {bigint} nonce transaction nonce
   */
  const signDelegation = async (delegatee, nonce) => {
    return walletClient.signTypedData({
      account: address,
      domain: {
        name: "Compound",
        chainId: 1,
        verifyingContract: COMP_ADDRESS,
      },
      types: {
        Delegation: [
          { name: "delegatee", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
        ],
      },
      primaryType: "Delegation",
      message: {
        delegatee,
        nonce,
        expiry: BigInt(10e9),
      },
    });
  };

  /**
   * POSTS delegation to back-end
   * @param {string} delegatee address to delegate voting power to
   * @param {bigint} nonce transaction nonce
   * @param {string} signedMsg hex signature from wallet
   */
  const castDelegation = async (delegatee, nonce, signedMsg) => {
    // Collect r, s, v
    const r = "0x" + signedMsg.substring(2, 66);
    const s = "0x" + signedMsg.substring(66, 130);
    const v = "0x" + signedMsg.substring(130, 132);

    // Post to back-end
    await axios
      .post("/api/delegate", {
        address,
        r,
        s,
        v,
        expiry: 10e9,
        delegatee,
        nonce: nonce.toString(),
      })
      .then(() => {
        alert("Success!");
      })
      .catch((error) => {
        alert("Error: " + error.response.data.message);
      });
  };

  /**
   * Create a delegation to delegatee
   * @param {string} delegatee address to delegate voting power to
   */
  const createDelegation = async (delegatee) => {
    const nonce = await publicClient.readContract({
      address: COMP_ADDRESS,
      abi: COMP_ABI,
      functionName: "nonces",
      args: [address],
    });

    const signedMsg = await signDelegation(delegatee, nonce);

    // POST delegation to server
    await castDelegation(delegatee, nonce, signedMsg);
  };

  /**
   * Checks if a user has an existing delegation
   */
  const checkDelegation = async () => {
    const delegate = await publicClient.readContract({
      address: COMP_ADDRESS,
      abi: COMP_ABI,
      functionName: "delegates",
      args: [address],
    });

    const noDelegate = "0x0000000000000000000000000000000000000000";
    if (delegate !== noDelegate) setCurrentDelegate(delegate);
  };

  // --> On address change (lock/unlock)
  useEffect(() => {
    // Set current delegate to null
    setCurrentDelegate(null);

    // If authenticated
    if (publicClient && address) {
      // Recheck delegation status
      checkDelegation();
    }
  }, [address]);

  return {
    currentDelegate,
    createDelegation,
  };
}

// Create unstated-next container
const delegate = createContainer(useDelegate);
export default delegate;
