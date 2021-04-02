// Import contract abis
import COMP_ABI from "helpers/abi/comp.abi";
import SIG_RELAYER_ABI from "helpers/abi/SigRelayer.abi";
import GOVERNER_ALPHA_ABI from "helpers/abi/GovernorAlpha.abi";
import GOVERNOR_BRAVO_ABI from "helpers/abi/GovernorBravo.abi";

// Mainnet contract addresses
const SIG_RELAYER_ADDRESS = "0xAAE15233798A477c47D1eA3d4586770A68b9D344";
const COMP_ADDRESS = "0xc00e94cb662c3520282e6f5717214004a7f26888";
const GOVERNANCE_ADDRESS = "0xc0Da02939E1441F497fd74F78cE7Decb17B66529";

// Export as individual exports
export {
  COMP_ABI,
  SIG_RELAYER_ABI,
  GOVERNER_ALPHA_ABI,
  GOVERNER_BRAVO_ABI,
  SIG_RELAYER_ADDRESS,
  COMP_ADDRESS,
  GOVERNANCE_ADDRESS,
};
