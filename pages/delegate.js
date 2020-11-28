import axios from "axios"; // Requests wrapper
import { useState } from "react"; // State management
import { web3p } from "containers"; // Context
import Layout from "components/layout"; // Layout wrapper
import styles from "styles/page.module.scss"; // Page styles

export default function Delegate({
  defaultAccounts,
  defaultPages,
  defaultDelegated,
}) {
  const [loading, setLoading] = useState(false); // Accounts loading state
  const [pages, setPages] = useState(defaultPages); // Accounts pagination
  const [accounts, setAccounts] = useState(defaultAccounts); // Accounts array
  const [delegated] = useState(defaultDelegated); // Max delegated votes

  // Web3 + Authenticate function from context
  const { web3, authenticate } = web3p.useContainer();

  console.log(accounts);

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

  return (
    <Layout>
      <div className={styles.head}>
        <div>
          <h1>Delegate By Signature</h1>
          <div>
            <p>
              Delegating by signature lets you delegate your COMP to community
              members without having to send your transactions on-chain, saving
              fees.
            </p>
          </div>
        </div>
      </div>
      <div className={styles.body}>
        <div>
          <div className={styles.card}>
            <div>
              <h4>Addresses by Voting Weight</h4>
            </div>
            <div className={styles.legend}>
              <span>Rank</span>
              <span>Vote Weight</span>
              <span>Proposals Voted</span>
            </div>
            <div>
              {accounts.map((delegate, i) => {
                return (
                  <div className={styles.delegate} key={i}>
                    <div>
                      <span>{delegate.rank}</span>
                    </div>
                    <div>
                      {delegate.image_url ? (
                        <img src={delegate.image_url} alt="Delegate avatar" />
                      ) : (
                        <img
                          src={`https://icotar.com/avatar/${delegate.address}.png?s=50`}
                          alt="Delegate avatar"
                        />
                      )}
                    </div>
                    <div>
                      <a
                        href={`https://etherscan.io/address/${delegate.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {delegate.display_name
                          ? delegate.display_name
                          : delegate.address.substr(0, 4) +
                            "..." +
                            delegate.address.slice(delegate.address.length - 4)}
                      </a>
                    </div>
                    <div>
                      <span>
                        {(
                          (parseFloat(delegate.votes) / delegated) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div>
                      <span>{delegate.proposals_voted}</span>
                    </div>
                    <div>
                      <button
                        onClick={
                          web3 ? () => console.log("Test") : authenticate
                        }
                        className={styles.info}
                      >
                        {web3 ? "Delegate" : "Authenticate"}
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
          <div className={styles.card}>
            <div>
              <h4>Custom Address</h4>
            </div>
            <div>
              <span>Delegates</span>
            </div>
          </div>
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
      defaultDelegated: parseFloat(historyResponse.data.votes_delegated),
    },
  };
}
