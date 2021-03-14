// Import contract abis
import COMP_ABI from "helpers/abi/comp.abi";
import SIG_RELAYER_ABI from "helpers/abi/SigRelayer.abi";
import GOVERNER_ALPHA_ABI from "helpers/abi/GovernorAlpha.abi";

// Mainnet contract addresses
const SIG_RELAYER_ADDRESS = "0x6E3e70d0e2268eE7a7975589f67A0e5C607e48Ea";
const COMP_ADDRESS = "0x61460874a7196d6a22d1ee4922473664b3e95270";
const GOVERNANCE_ADDRESS = "0x100044c436dfb66ff106157970bc89f243411ffd";

// Export as individual exports
export {
  COMP_ABI,
  SIG_RELAYER_ABI,
  GOVERNER_ALPHA_ABI,
  SIG_RELAYER_ADDRESS,
  COMP_ADDRESS,
  GOVERNANCE_ADDRESS,
};
