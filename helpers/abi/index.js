// Import contract abis
import COMP_ABI from "helpers/abi/comp.abi";
import SIG_RELAYER_ABI from "helpers/abi/SigRelayer.abi";
import GOVERNOR_BRAVO_ABI from "helpers/abi/GovernorBravo.abi";
import MULTICALL_ABI from "helpers/abi/multicall.abi";
import GOVERNOR_CHARLIE_ABI from "helpers/abi/GovernorCharlie.abi";

// Mainnet contract addresses
const SIG_RELAYER_ADDRESS = "0xAAE15233798A477c47D1eA3d4586770A68b9D344";
const COMP_ADDRESS = "0xc00e94cb662c3520282e6f5717214004a7f26888";
const GOVERNANCE_ADDRESS = "0xc0Da02939E1441F497fd74F78cE7Decb17B66529";
const GOVERNOR_CHARLIE_ADDRESS = "0x309a862bbC1A00e45506cB8A802D1ff10004c8C0";
const MULTICALL_ADDRESS = "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441";

// Export as individual exports
export {
  COMP_ABI,
  SIG_RELAYER_ABI,
  GOVERNOR_BRAVO_ABI,
  GOVERNOR_CHARLIE_ABI,
  SIG_RELAYER_ADDRESS,
  COMP_ADDRESS,
  GOVERNANCE_ADDRESS,
  GOVERNOR_CHARLIE_ADDRESS,
  MULTICALL_ABI,
  MULTICALL_ADDRESS,
};
