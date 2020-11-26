import Layout from "components/layout"; // Layout wrapper
import styles from "styles/page.module.scss"; // Page styles

export default function Home() {
  return (
    <Layout>
      <div className={styles.head}>
        <div>
          <h1>Vote By Signature</h1>
          <p>
            Voting by signature lets you place votes across Compound Goverance
            proposals, without having to send your transactions on-chain, saving
            fees.
          </p>
        </div>
      </div>
      <div className={styles.body}>
        <div>
          <div className={styles.card}>
            <div>
              <h4>Recent Proposals</h4>
            </div>
            <div>
              <span>Proposals</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
