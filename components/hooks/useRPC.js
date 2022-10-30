import { useMemo, useEffect } from 'react';
import { RPC, buildRPC } from '@compound-finance/comet-extension';

export function useRPC() {
  let rpc = useMemo(buildRPC, []);

  useEffect(() => {
    rpc.attachHandler()
    return rpc.detachHandler;
  }, [rpc]);

  return rpc;
}
