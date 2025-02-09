import { JsonRpcProvider } from "@ethersproject/providers";
import { useEffect, useState } from "react";

const useENS = (address) => {
  const [ensName, setENSName] = useState();

  useEffect(() => {
    const resolveENS = async () => {
      if (address) {
        const provider = new JsonRpcProvider(
          process.env.NEXT_PUBLIC_INFURA_RPC
        );
        const ensName = await provider.lookupAddress(address);
        setENSName(ensName);
      }
    };
    resolveENS();
  }, [address]);

  return { ensName };
};

export default useENS;
