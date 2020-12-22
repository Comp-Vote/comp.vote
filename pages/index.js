import axios from "axios"; // Requests wrapper
import dayjs from "dayjs"; // Dayjs
import { useState } from "react"; // State management
import Layout from "components/layout"; // Layout wrapper
import APICTA from "components/api_cta"; // API CTA
import { web3p, vote } from "containers"; // Context
import styles from "styles/page.module.scss"; // Page styles
import BeatLoader from "react-spinners/BeatLoader"; // Loading state

export default function Home({ defaultProposals, defaultPages }) {
  const [loading, setLoading] = useState(false); // Proposal loading state
  const [pages, setPages] = useState(defaultPages); // Proposal pagination
  const [proposals, setProposals] = useState(defaultProposals); // Proposals array
  const [buttonLoading, setButtonLoading] = useState({ id: null, type: null }); // Current button loading state

  // Web3 + Authenticate function from context
  const { web3, authenticate } = web3p.useContainer();
  const { voteFor, voteAgainst } = vote.useContainer();

  /**
   * Util: Uppercase first letter of word
   * @param {string} word to uppercase first letter of
   */
  const firstUppercase = (word) => {
    if (typeof word !== "string") return "";
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  /**
   * Pagination handler
   */
  const getNextPage = async () => {
    // Toggle loading state
    setLoading(true);

    // Collect next page request string and request
    const nextPage = `https://api.compound.finance/api/v2/governance/proposals?page_number=${
      pages.current + 1
    }`;
    const response = await axios.get(nextPage);

    // Update proposals array with new proposals
    setProposals([...proposals, ...response.data.proposals]);

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
   * Opens Compoung Governance proposal information in new tab
   * @param {Number} proposalId for Compound governance proposal
   */
  const proposalInfo = (proposalId) => {
    // Navigate
    window.open(
      // With target set to Compound governance proposal
      `https://compound.finance/governance/proposals/${proposalId}`,
      // In new tab
      "_blank"
    );
  };

  /**
   * voteFor or voteAgainst with loading states
   * @param {number} proposalId to vote for or against
   * @param {number} type 0 === voteFor, 1 === voteAgainst
   */
  const voteWithLoading = async (proposalId, type) => {
    // Toggle button loading to true
    setButtonLoading({ id: proposalId, type: type });

    try {
      // Call voteFor or voteAgainst based on type
      type === 0 ? await voteFor(proposalId) : await voteAgainst(proposalId);
    } catch {
      // If MetaMask cancellation, toggle button loading to false
      setButtonLoading({ id: null, type: null });
    }

    // Else, toggle loading to false on success
    setButtonLoading({ id: null, type: null });
  };

  return (
    <Layout>
      {/* Page head */}
      <div className={styles.head}>
        <div>
          {/* Description of voting by signature */}
          <h1>Vote By Signature</h1>
          <div>
            <p>
              Voting by signature lets you place votes across Compound Goverance
              proposals, without having to send your transactions on-chain,
              saving fees.
            </p>
          </div>

          {/* Number of voteable proposals */}
          <div>
            <h2>{pages.entries}</h2>
            <h3>Total Proposals</h3>
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className={styles.body}>
        <div>
          {/* Recent proposals card */}
          <div className={styles.card}>
            {/* Card header */}
            <div>
              <h4>Recent Proposals</h4>
            </div>

            {/* Card proposals */}
            <div>
              {proposals.map((proposal, i) => {
                // For each proposal in proposals array return:
                return (
                  <div className={styles.proposal} key={i}>
                    {/* Proposal info */}
                    <div>
                      {/* Truncated proposal name */}
                      <h4>
                        {proposal.title.split(" ").splice(0, 10).join(" ")}
                        {proposal.title.split(" ").length > 10 ? "..." : ""}
                      </h4>

                      {/* Proposal ID + Status + Status update date */}
                      <span>
                        {proposal.id} •{" "}
                        {firstUppercase(
                          proposal.states[proposal.states.length - 1].state
                        )}{" "}
                        {dayjs
                          .unix(
                            proposal.states[proposal.states.length - 1]
                              .start_time
                          )
                          .format("MMMM D, YYYY")}
                      </span>
                    </div>

                    {/* Proposal actions */}
                    <div>
                      <button
                        onClick={() => proposalInfo(proposal.id)}
                        className={styles.info}
                      >
                        Info
                      </button>
                      {proposal.states[proposal.states.length - 1].state ===
                      "active" ? (
                        // Check if proposal is active
                        web3 ? (
                          // If authenticated and proposal active, return voting + info buttons
                          <>
                            <button
                              onClick={() => voteWithLoading(proposal.id, 0)}
                              className={styles.for}
                            >
                              {buttonLoading.id === proposal.id &&
                              buttonLoading.type === 0 ? (
                                <BeatLoader size={9} />
                              ) : (
                                "Vote For"
                              )}
                            </button>
                            <button
                              onClick={() => voteWithLoading(proposal.id, 1)}
                              className={styles.against}
                            >
                              {buttonLoading.id === proposal.id &&
                              buttonLoading.type === 1 ? (
                                <BeatLoader size={9} />
                              ) : (
                                "Vote Against"
                              )}
                            </button>
                          </>
                        ) : (
                          // Else, return button to authenticate for active proposals
                          <button
                            className={styles.info}
                            onClick={authenticate}
                          >
                            Authenticate to vote
                          </button>
                        )
                      ) : // Else, return only Info button
                      null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* More proposals loading button */}
            {pages.current < pages.max ? (
              // If current number of pages < max, show:
              <div className={styles.cardMore}>
                {/* Load more proposals button */}
                <button onClick={getNextPage} disabled={loading}>
                  {loading ? "Loading..." : "Load More Proposals"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Swagger API CTA card */}
        <APICTA />
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  // Collect first page data
  const firstPage =
    "https://api.compound.finance/api/v2/governance/proposals?page_number=1";
  const response = await axios.get(firstPage);

  // Return:
  return {
    props: {
      // First 10 proposals
      defaultProposals: response.data.proposals,
      defaultPages: {
        // Number of total proposals
        entries: response.data.pagination_summary.total_entries,
        // Current paginated proposal page (default: 1)
        current: response.data.pagination_summary.page_number,
        // Maximum number of paginated proposal pages
        max: response.data.pagination_summary.total_pages,
      },
    },
  };
}
