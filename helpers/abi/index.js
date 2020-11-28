// Import contract abis
import COMP_ABI from "helpers/abi/comp.abi";
import SIG_RELAYER_ABI from "helpers/abi/SigRelayer.abi";
import GOVERNER_ALPHA_ABI from "helpers/abi/GovernorAlpha.abi";

// Mainnet contract addresses
const SIG_RELAYER_ADDRESS = "0xf61d8eef3f479dfa24beaa46bf6f235e6e2f7af8";
const COMP_ADDRESS = "0xc00e94cb662c3520282e6f5717214004a7f26888";
const GOVERNANCE_ADDRESS = "0xc0da01a04c3f3e0be433606045bb7017a7323e38";

// Export as individual exports
export {
  COMP_ABI,
  SIG_RELAYER_ABI,
  GOVERNER_ALPHA_ABI,
  SIG_RELAYER_ADDRESS,
  COMP_ADDRESS,
  GOVERNANCE_ADDRESS,
};
