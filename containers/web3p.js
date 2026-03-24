import { useContext, useState, useEffect } from "react";
import { useAccount, useDisconnect, usePublicClient, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { isAddress, createPublicClient, createWalletClient, custom } from "viem";
import { mainnet } from "viem/chains";
import { createContainer } from "unstated-next";
import { RPCWeb3Provider } from "@compound-finance/comet-extension";
import { useRPC } from "../components/hooks/useRPC";
import { Embedded } from "containers";

function useWeb3() {
  const embedded = useContext(Embedded);
  const rpc = useRPC();

  // Wagmi state (non-embedded mode)
  const { address: wagmiAddress } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const wagmiPublicClient = usePublicClient();
  const { data: wagmiWalletClient } = useWalletClient();

  // Embedded mode state
  const [embeddedAddress, setEmbeddedAddress] = useState(null);
  const [embeddedPublicClient, setEmbeddedPublicClient] = useState(null);
  const [embeddedWalletClient, setEmbeddedWalletClient] = useState(null);

  useEffect(() => {
    if (!embedded) return;

    const provider = new RPCWeb3Provider(rpc.sendRPC);
    const transport = custom(provider);
    const pubClient = createPublicClient({ chain: mainnet, transport });
    const walClient = createWalletClient({ chain: mainnet, transport });

    setEmbeddedPublicClient(pubClient);
    setEmbeddedWalletClient(walClient);

    walClient.getAddresses().then(([addr]) => {
      setEmbeddedAddress(addr ?? null);
    });
  }, [embedded]);

  const address = embedded ? embeddedAddress : wagmiAddress;
  const publicClient = embedded ? embeddedPublicClient : wagmiPublicClient;
  const walletClient = embedded ? embeddedWalletClient : wagmiWalletClient;

  const authenticate = () => {
    if (!embedded) openConnectModal?.();
  };

  const unauthenticate = () => {
    if (embedded) {
      setEmbeddedAddress(null);
    } else {
      disconnect();
    }
  };

  const isValidAddress = (addr) => isAddress(addr);

  return {
    address,
    publicClient,
    walletClient,
    authenticate,
    unauthenticate,
    isValidAddress,
  };
}

// Create unstated-next container
const web3p = createContainer(useWeb3);
export default web3p;
