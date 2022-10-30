import { createContext } from "react";
import vote from "containers/vote"; // Voting functions
import web3p from "containers/web3p"; // Web3 provider
import delegate from "containers/delegate"; // Delegation functions
import { useRouter } from 'next/router'

export const Embedded = createContext(false);

// Global state provider
export default function GlobalProvider({ children }) {
  let router = useRouter();

  let embedded = Object.keys(router.query).includes('embedded');

  return (
    <Embedded.Provider value={embedded}>
      <web3p.Provider>
        <vote.Provider>
          <delegate.Provider>{children}</delegate.Provider>
        </vote.Provider>
      </web3p.Provider>
    </Embedded.Provider>
  );
}

// Export individual containers
export { vote, web3p, delegate };
