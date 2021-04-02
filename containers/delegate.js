import axios from "axios"; // Axios requests
import { web3p } from "containers"; // Web3
import { COMP_ABI } from "helpers/abi"; // Compound (COMP) Governance Token ABI
import { useState, useEffect } from "react"; // State management
import { createContainer } from "unstated-next"; // Unstated-next containerization

// Reference implementation: https://github.com/TennisBowling/comp.vote/blob/master/bySig/delegate_by_signature.html
function useDelegate() {
  // Context
  const { web3, address } = web3p.useContainer();

  // Local state
  const [currentDelegate, setCurrentDelegate] = useState(null); // Current delegate

  /**
   * Generate delegation message
   * @param {string} delegatee address to delegate voting power to
   * @param {integer} nonce transaction nonce
   */
  const createDelegateBySigMessage = (delegatee, nonce = 0) => {
    // Types
    const types = {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Delegation: [
        { name: "delegatee", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
      ],
    };

    // Return message to sign
    return JSON.stringify({
      types,
      primaryType: "Delegation",
      // Compound COMP token contract
      domain: {
        name: "Compound",
        chainId: 1,
        verifyingContract: "0xc00e94cb662c3520282e6f5717214004a7f26888",
      },
      // Message
      message: {
        // Delegatee address
        delegatee,
        nonce: nonce,
        expiry: 10e9,
      },
    });
  };

  /**
   * Returns promise of web3 signature
   * @param {string} msgParams to sign
   */
  const signDelegation = async (msgParams) => {
    // Return promise
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
   * POSTS delegation to back-end
   * @param {string} delegatee address to delegate voting power to
   * @param {integer} nonce transaction nonce
   * @param {string} signedMsg from Web3
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
        nonce,
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

  /**
   * Create a delegation to delegatee
   * @param {string} delegate address to delegate voting power to
   */
  const createDelegation = async (delegatee) => {
    // Compound (COMP) Governance token contract
    const compoundContract = new web3.eth.Contract(
      COMP_ABI,
      "0xc00e94cb662c3520282e6f5717214004a7f26888"
    );

    // Collect interaction nonce
    const nonce = await compoundContract.methods.nonces(address).call();

    // Generate delegation message to sign
    const msgParams = createDelegateBySigMessage(delegatee, nonce);
    const signedMsg = await signDelegation(msgParams);

    // POST vote to server
    await castDelegation(delegatee, nonce, signedMsg);
  };

  /**
   * Checks if a user has an existing delegation
   */
  const checkDelegation = async () => {
    // Compound (COMP) Governance token contract
    const compoundContract = new web3.eth.Contract(
      COMP_ABI,
      "0xc00e94cb662c3520282e6f5717214004a7f26888"
    );

    // Collect current delegate
    const delegate = await compoundContract.methods.delegates(address).call();

    // Update delegate in state
    const noDelegate = "0x0000000000000000000000000000000000000000";
    if (delegate !== noDelegate) setCurrentDelegate(delegate);
  };

  // --> On address change (lock/unlock)
  useEffect(() => {
    // Set current delegate to null
    setCurrentDelegate(null);

    // If authenticated
    if (web3 && address) {
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
