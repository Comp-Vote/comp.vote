import axios from "axios"; // Requests wrapper
import { useState } from "react"; // State management
import Layout from "components/layout"; // Layout wrapper
import APICTA from "components/api_cta"; // API CTA
import styles from "styles/page.module.scss"; // Page styles
import { web3p, delegate } from "containers"; // Context
import BeatLoader from "react-spinners/BeatLoader"; // Loading state

export default function Delegate({
  defaultAccounts,
  defaultPages,
  defaultDelegated,
}) {
  const [loading, setLoading] = useState(false); // Accounts loading state
  const [delegated] = useState(defaultDelegated); // Max delegated votes
  const [pages, setPages] = useState(defaultPages); // Accounts pagination
  const [customAddress, setCustomAddress] = useState(""); // Custom voting address
  const [buttonLoading, setButtonLoading] = useState(null); // Delegation button loading state
  const [accounts, setAccounts] = useState(defaultAccounts); // Accounts array

  // Web3 + Authenticate function from context
  const { web3, address, authenticate, isValidAddress } = web3p.useContainer();
  const { currentDelegate, createDelegation } = delegate.useContainer();

  /**
   * Pagination handler
   */
  const getNextPage = async () => {
    // Toggle loading state
    setLoading(true);

    // Collect next page request string and request

    const nextPage = `https://api.compound.finance/api/v2/governance/accounts?page_size=10&page_number=${
      pages.current + 1
    }&with_history=false&network=mainnet`;
    const response = await axios.get(nextPage);

    // Update proposals array with new proposals
    setAccounts([...accounts, ...response.data.accounts]);

    // Increment current page number in pages object
    setPages((pages) => ({
      // Destructure keys
      ...pages,
      // Update current key with incremented value
      current: pages.current + 1,
    }));

    // Toggle loading state
    setLoading(false);
  };

  /**
   * createDelegation with button loading state
   * @param {string} address to delegate to
   * @param {number} rank 0 === custom delegation, else rank === address rank in table
   */
  const createDelegationWithLoading = async (address, rank) => {
    // Toggle button loading to true
    setButtonLoading(rank);

    try {
      // Call createDelegation
      await createDelegation(address);
    } catch {
      // If MetaMask cancellation, force toggle loading to false
      setButtonLoading(null);
    }

    // Else, toggle loading to false on success
    setButtonLoading(null);
  };

  return (
    <Layout>
      {/* Page head */}
      <div className={styles.head}>
        <div>
          {/* Description of delegating by signature */}
          <h1>Delegate By Signature</h1>
          <div>
            <p>
              Delegating by signature lets you delegate your COMP to community
              members without having to send your transactions on-chain, saving
              fees.
            </p>
          </div>

          {/* Current delegation status if delegated */}
          {currentDelegate ? (
            // If delegated, display information
            <div>
              <h2>
                <a
                  // Link to Compound Governance profile
                  href={`https://compound.finance/governance/address/${currentDelegate}?target_network=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentDelegate.substr(0, 5) +
                    // Address of delegate
                    "..." +
                    currentDelegate.slice(currentDelegate.length - 5)}
                </a>
              </h2>
              <h3>Delegating To</h3>
            </div>
          ) : null}
        </div>
      </div>

      {/* Page body */}
      <div className={styles.body}>
        <div>
          {/* Top addresses by voting weight card */}
          <div className={styles.card}>
            {/* Card header */}
            <div>
              <h4>Addresses by Voting Weight</h4>
            </div>

            {/* Card legend */}
            <div className={styles.legend}>
              <span>Rank</span>
              <span>Vote Weight</span>
              <span>Proposals Voted</span>
            </div>

            {/* Card delegates content */}
            <div>
              {accounts.map((delegate, i) => {
                // For each delegate
                return (
                  // Render delegate card
                  <div className={styles.delegate} key={i}>
                    {/* Delegate rank by vote weight */}
                    <div>
                      <span>{delegate.rank}</span>
                    </div>

                    {/* Delegate avatar */}
                    <div>
                      {delegate.image_url ? (
                        // If avatar provided, use image_url
                        <img src={delegate.image_url} alt="Delegate avatar" />
                      ) : (
                        // Else generate avatar based on address
                        <img
                          src={`https://icotar.com/avatar/${delegate.address}.png?s=50`}
                          alt="Delegate avatar"
                        />
                      )}
                    </div>

                    {/* Delegate name */}
                    <div>
                      <a
                        // Link name to Etherscan address
                        href={`https://etherscan.io/address/${delegate.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {
                          // If delegate has display name
                          delegate.display_name
                            ? // Show custom display name
                              delegate.display_name
                            : // Else if delegate has associated crowd proposal
                            delegate.crowd_proposal
                            ? // Show associated crowd proposal title
                              delegate.crowd_proposal.title
                            : // Else, show truncated address
                              delegate.address.substr(0, 4) +
                              "..." +
                              delegate.address.slice(
                                delegate.address.length - 4
                              )
                        }
                      </a>
                    </div>

                    {/* Delegate vote weight */}
                    <div>
                      <span>
                        {
                          // Calculate vote weight (total / delegate) * 100
                          (
                            (parseFloat(delegate.votes) / delegated) *
                            100
                          ).toFixed(2)
                        }
                        %
                      </span>
                    </div>

                    {/* Delegate voted proposal count */}
                    <div>
                      <span>{delegate.proposals_voted}</span>
                    </div>

                    {/* Delegate action buttons */}
                    <div>
                      <button
                        // If web3 ? delegate function : authenticate state
                        onClick={
                          web3
                            ? () =>
                                createDelegationWithLoading(
                                  delegate.address,
                                  delegate.rank
                                )
                            : authenticate
                        }
                        className={styles.info}
                      >
                        {web3 ? (
                          buttonLoading === delegate.rank ? (
                            <BeatLoader size={9} />
                          ) : (
                            "Delegate"
                          )
                        ) : (
                          "Authenticate"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* More accounts loading button */}
            {pages.current < pages.max ? (
              // If current number of pages < max, show:
              <div className={styles.cardMore}>
                {/* Load more accounts button */}
                <button onClick={getNextPage} disabled={loading}>
                  {loading ? "Loading..." : "Load More Delegates"}
                </button>
              </div>
            ) : null}
          </div>

          {/* Custom address delegation card */}
          <div className={styles.card}>
            <div>
              <h4>Custom Address</h4>
            </div>
            <div>
              <div className={styles.customDelegate}>
                {web3 ? (
                  <>
                    <input
                      type="text"
                      placeholder="0xac5720d6ee2d7872b88914c9c5fa9bf38e72faf6"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                    />
                    {isValidAddress(customAddress) ? (
                      // If enterred address is valid, display delegation button
                      <button
                        // Delegate to input address
                        onClick={() =>
                          createDelegationWithLoading(customAddress, 0)
                        }
                        className={styles.info}
                      >
                        {buttonLoading === 0 ? (
                          <BeatLoader size={9} />
                        ) : (
                          "Delegate"
                        )}
                      </button>
                    ) : (
                      // Else, display invalid address button
                      <button disabled>Invalid Address</button>
                    )}

                    {/* Self delegation */}
                    <button
                      onClick={() => createDelegationWithLoading(address, -1)}
                      className={styles.info}
                    >
                      {buttonLoading === -1 ? (
                        <BeatLoader size={9} />
                      ) : (
                        "Self-delegate"
                      )}
                    </button>
                  </>
                ) : (
                  <button onClick={authenticate} className={styles.info}>
                    Authenticate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Swagger API CTA card */}
          <APICTA />
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  // Collect first page data
  const firstPage =
    "https://api.compound.finance/api/v2/governance/accounts?page_size=10&page_number=1&with_history=false&network=mainnet";
  const response = await axios.get(firstPage);

  // Collect delegated vote count
  const historyURL =
    "https://api.compound.finance/api/v2/governance/history?network=mainnet";
  const historyResponse = await axios.get(historyURL);

  // Return:
  return {
    props: {
      // First 10 addresses
      defaultAccounts: response.data.accounts,
      defaultPages: {
        // Current paginated proposal page (default: 1)
        current: response.data.pagination_summary.page_number,
        // Maximum number of paginated proposal pages
        max: response.data.pagination_summary.total_pages,
      },
      // Total delegated vote count
      defaultDelegated: parseFloat(historyResponse.data.votes_delegated),
    },
  };
}
