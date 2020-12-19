import vote from "containers/vote"; // Voting functions
import web3p from "containers/web3p"; // Web3 provider
import delegate from "containers/delegate"; // Delegation functions

// Global state provider
export default function GlobalProvider({ children }) {
  return (
    <web3p.Provider>
      <vote.Provider>
        <delegate.Provider>{children}</delegate.Provider>
      </vote.Provider>
    </web3p.Provider>
  );
}

// Export individual containers
export { vote, web3p, delegate };
