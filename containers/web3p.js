import Web3 from "web3"; // Web3
import Web3Modal from "web3modal"; // Web3Modal
import { useState, useEffect } from "react"; // State management
import { createContainer } from "unstated-next"; // Unstated-next containerization
import WalletConnectProvider from "@walletconnect/web3-provider"; // WalletConnectProvider (Web3Modal)

// Web3Modal provider options
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      // Inject Infura
      infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    },
  },
};

function useWeb3() {
  const [web3, setWeb3] = useState(null); // Web3 provider
  const [modal, setModal] = useState(null); // Web3Modal
  const [address, setAddress] = useState(null); // ETH address

  /**
   * Sets up web3Modal and saves to state
   */
  const setupWeb3Modal = () => {
    // Create new web3Modal
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
      providerOptions: providerOptions,
    });

    // Set web3Modal
    setModal(web3Modal);
  };

  /**
   * Authenticate, save web3 provider, and save eth address
   */
  const authenticate = async () => {
    // Toggle modal
    const provider = await modal.connect();

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
    // Setup web3modal
    setupWeb3Modal();
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
