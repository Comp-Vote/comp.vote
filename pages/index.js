import axios from "axios"; // Requests wrapper
import dayjs from "dayjs"; // Dayjs
import { useContext, useState } from "react"; // State management
import Layout from "components/layout"; // Layout wrapper
import APICTA from "components/api_cta"; // API CTA
import { web3p, vote } from "containers"; // Context
import styles from "styles/page.module.scss"; // Page styles
import BeatLoader from "react-spinners/BeatLoader"; // Loading state
import { Embedded } from "containers"; // Embedded

export default function Home(props) {
  const [pages, setPages] = useState(props.defaultPages); // Proposal pagination
  const embedded = useContext(Embedded);

  const proposalsContent = (
    <ProposalsContent {...props} pages={pages} setPages={setPages} />
  );
  if (embedded) {
    // Don't wrap the content when embedded.
    return proposalsContent;
  }

  return (
    <Layout>
      {/* Page head */}
      <div className={styles.head}>
        <div>
          {/* Description of voting by signature */}
          <h1>Vote By Signature</h1>
          <div>
            <p>
              Voting by signature lets you place votes across Compound
              Governance proposals, without having to send your transactions
              on-chain, saving fees.
            </p>
          </div>

          {/* Number of voteable proposals */}
          <div>
            <h2>{pages.entries}</h2>
            <h3>Total Proposals</h3>
          </div>
        </div>
      </div>
      <div className={styles.body}>
        {proposalsContent}
        {/* Swagger API CTA card */}
        <APICTA />
      </div>
    </Layout>
  );
}

function ProposalsContent({ defaultProposals, pages, setPages }) {
  const [loading, setLoading] = useState(false); // Proposal loading state
  const [proposals, setProposals] = useState(defaultProposals); // Proposals array
  const [buttonLoading, setButtonLoading] = useState({ id: null, type: null }); // Current button loading state

  // Web3 + Authenticate function from context
  const { web3, authenticate } = web3p.useContainer();
  const { voteFor, voteAgainst, voteAbstain } = vote.useContainer();

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
    const nextPage = `/api/governance/proposals?page_size=10&get_state_times=true&page_number=${
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
   * voteFor, voteAgainst, or abstain with loading states
   * @param {number} proposalId to cast a vote on
   * @param {number} type 0 === voteFor, 1 === voteAgainst, 2 === abstain
   */
  const voteWithLoading = async (proposalId, type) => {
    // Toggle button loading to true
    setButtonLoading({ id: proposalId, type: type });
    try {
      // Call voteFor or voteAgainst based on type
      switch (Number(type)) {
        case 0:
          await voteFor(proposalId);
          break;
        case 1:
          await voteAgainst(proposalId);
          break;
        default:
          await voteAbstain(proposalId);
      }
    } catch {
      // If MetaMask cancellation, toggle button loading to false
      setButtonLoading({ id: null, type: null });
    }

    // Else, toggle loading to false on success
    setButtonLoading({ id: null, type: null });
  };

  return (
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
                    {proposal.title.split(" ").splice(0, 9).join(" ")}
                    {proposal.title.split(" ").length > 10 ? "..." : ""}
                  </h4>

                  {/* Proposal ID + Status + Status update date */}
                  <span>
                    {proposal.id} • {firstUppercase(proposal.state.value)}{" "}
                    {dayjs
                      .unix(proposal.state.start_time)
                      .format("MMMM D, YYYY")}
                  </span>
                </div>

                {/* Proposal actions */}
                <div>
                  <button
                    onClick={() => {
                      console.log(proposal);
                      window.open(
                        // With target set to Compound governance proposal on tally
                        proposal.tally_url,
                        // In new tab
                        "_blank"
                      );
                    }}
                    className={styles.info}
                  >
                    Info
                  </button>
                  {proposal.state.value === "Active" ||
                  proposal.state.value === "Pending" ? (
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
                        <button
                          onClick={() => voteWithLoading(proposal.id, 2)}
                          className={styles.abstain}
                        >
                          {buttonLoading.id === proposal.id &&
                          buttonLoading.type === 2 ? (
                            <BeatLoader size={9} />
                          ) : (
                            "Abstain"
                          )}
                        </button>
                      </>
                    ) : (
                      // Else, return button to authenticate for active proposals
                      <button className={styles.info} onClick={authenticate}>
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
  );
}

export async function getServerSideProps() {
  // Collect first page data
  const deployedUrl =
    process.env.VERCEL_URL == "localhost:3000"
      ? `http://${process.env.VERCEL_URL}`
      : `https://${process.env.VERCEL_URL}`;
  const firstPage =
    deployedUrl +
    "/api/governance/proposals?page_size=10&get_state_times=true&page_number=1";
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
