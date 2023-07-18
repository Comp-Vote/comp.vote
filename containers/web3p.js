import { useContext } from "react";
import Web3 from "web3"; // Web3
import { useState, useEffect } from "react"; // State management
import { createContainer } from "unstated-next"; // Unstated-next containerization
import { EthereumProvider } from "@walletconnect/ethereum-provider"; // EthereumProvider (WalletConnect3Modal)
import { RPCWeb3Provider } from "@compound-finance/comet-extension";
import { useRPC } from "../components/hooks/useRPC";
import { Embedded } from "containers"; // Embedded

function useWeb3() {
  const embedded = useContext(Embedded);
  const rpc = useRPC();
  const [web3, setWeb3] = useState(null); // Web3 provider
  const [address, setAddress] = useState(null); // ETH address

  /**
   * Authenticate, save web3 provider, and save eth address
   */
  const authenticate = async () => {
    let provider;
    // Toggle modal
    if (!embedded) {
      // EthereumProvider provider options (triggers WalletConnectModal)
      provider = await EthereumProvider.init({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID, // required
        chains: [1], // required
        showQrModal: true, // requires @walletconnect/modal
      });
      await provider.enable();
    } else {
      provider = new RPCWeb3Provider(rpc.sendRPC);
    }

    // Generate web3 object and save
    const web3 = new Web3(provider);
    setWeb3(web3);

    // Collect address
    const accounts = await web3.eth.getAccounts();
    const address = accounts[0];
    setAddress(address);
    return;
  };

  /**
   * Unauthenticate and clear cache
   */
  const unauthenticate = async () => {
    // Check if logged in
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      // Close provider
      await web3.currentProvider.close();
    }

    // Nullify web3 provider and address
    setAddress(null);
    setWeb3(null);
  };

  /**
   * Checks validity of Ethereum address
   * @param {String} address to check
   * @returns {Boolean} true if address is valid
   */
  const isValidAddress = (address) => {
    return web3.utils.isAddress(address);
  };

  // On mount
  useEffect(() => {
    authenticate();
  }, []);

  return {
    web3,
    address,
    authenticate,
    unauthenticate,
    isValidAddress,
  };
}

// Create unstated-next container
const web3p = createContainer(useWeb3);
export default web3p;
