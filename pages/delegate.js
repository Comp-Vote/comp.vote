import Layout from "components/layout"; // Layout wrapper
import styles from "styles/page.module.scss"; // Page styles

export default function Delegate() {
  return (
    <Layout>
      <div className={styles.head}>
        <div>
          <h1>Delegate By Signature</h1>
          <p>
            Delegating by signature lets you delegate your COMP to community
            members without having to send your transactions on-chain, saving
            fees.
          </p>
        </div>
      </div>
      <span>Delegate</span>
    </Layout>
  );
}
