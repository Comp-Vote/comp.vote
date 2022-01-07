import { getDefaultProvider } from "@ethersproject/providers";
import { useEffect, useState } from "react";

const useENS = (address) => {
  const [ensName, setENSName] = useState();

  useEffect(() => {
    const resolveENS = async () => {
      if (address) {
        const provider = getDefaultProvider();
        const ensName = await provider.lookupAddress(address);
        setENSName(ensName);
      }
    };
    resolveENS();
  }, [address]);

  return { ensName };
};

export default useENS;
