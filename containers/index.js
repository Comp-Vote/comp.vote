import vote from "containers/vote"; // Voting functions
import web3p from "containers/web3p"; // Web3 provider

// Global state provider
export default function GlobalProvider({ children }) {
  return (
    <web3p.Provider>
      <vote.Provider>{children}</vote.Provider>
    </web3p.Provider>
  );
}

// Export individual containers
export { web3p, vote };
