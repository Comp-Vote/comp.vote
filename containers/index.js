import web3p from "containers/web3p"; // Web3 provider

// Global state provider
export default function GlobalProvider({ children }) {
  return <web3p.Provider>{children}</web3p.Provider>;
}

// Export individual containers
export { web3p };
