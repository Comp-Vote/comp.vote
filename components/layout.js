import Head from "next/head"; // Meta
import Header from "components/header"; // Header component
import styles from "styles/layout.module.scss"; // Component styles

export default function Layout({ children }) {
  return (
    <div>
      {/* Meta Setup */}
      <Head></Head>

      {/* Header */}
      <div>
        <Header />
      </div>

      {/* Page content */}
      <div className={styles.content}>{children}</div>

      {/* Footer */}
      <div className={styles.footer}>
        <div>
          <span>
            A project by{" "}
            <a
              href="https://twitter.com/Arr00c"
              target="_blank"
              rel="noopener noreferrer"
            >
              arr00
            </a>{" "}
            and{" "}
            <a
              href="https://twitter.com/_anishagnihotri"
              target="_blank"
              rel="noopener noreferrer"
            >
              anish
            </a>
            .
          </span>
          <span>Community-led and built at heart.</span>
        </div>
      </div>
    </div>
  );
}
