import axios from "axios"; // Requests wrapper
import { useState } from "react"; // State management
import { web3p } from "containers"; // Context
import Layout from "components/layout"; // Layout wrapper
import styles from "styles/page.module.scss"; // Page styles

export default function Delegate({ defaultAccounts, defaultPages }) {
  const [loading, setLoading] = useState(false); // Accounts loading state
  const [pages, setPages] = useState(defaultPages); // Accounts pagination
  const [accounts, setAccounts] = useState(defaultAccounts); // Accounts array

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
            <div></div>
            <div>
              <span>Delegates</span>
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
              <h4>Addresses by Voting Weight</h4>
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
    },
  };
}
