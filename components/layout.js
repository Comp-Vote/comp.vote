import Head from "next/head"; // Meta
import Header from "components/header"; // Header component
import styles from "styles/layout.module.scss"; // Component styles

export default function Layout({ children }) {
  return (
    <div>
      {/* Meta Setup */}
      <Head>
        {/* Meta */}
        <title>Comp.Vote</title>
        <meta name="title" content="Comp.Vote" />
        <meta
          name="description"
          content="Gas-less voting and delegation for Compound Finance governance. Sign and relay your transactions for free."
        />

        {/* Open Graph + Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://comp.vote" />
        <meta property="og:title" content="Comp.Vote" />
        <meta
          property="og:description"
          content="Gas-less voting and delegation for Compound Finance governance. Sign and relay your transactions for free."
        />
        <meta property="og:image" content="https://comp.vote/brand/meta.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://comp.vote" />
        <meta property="twitter:title" content="Comp.Vote" />
        <meta
          property="twitter:description"
          content="Gas-less voting and delegation for Compound Finance governance. Sign and relay your transactions for free."
        />
        <meta
          property="twitter:image"
          content="https://comp.vote/brand/meta.png"
        />

        {/* Favicon */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#00d395"
        />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="theme-color" content="#ffffff" />
      </Head>

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
          <span>Community-led and built with love.</span>
          <span>
            Need support? <a href="mailto:help@comp.vote">help@comp.vote</a>
          </span>
        </div>
      </div>
    </div>
  );
}
