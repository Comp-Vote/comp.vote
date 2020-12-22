import styles from "styles/page.module.scss"; // Component-scope CSS

// Export Swagger API CTA
export default function APICTA() {
  return (
    // Wrap in card component
    <div className={`${styles.swagger}`}>
      {/* Left text container */}
      <div>
        <h4>Public API</h4>
        <p>
          Integrate gas-less voting and delegation directly within your
          application, through our managed Public API.
        </p>
        <a
          href="https://app.swaggerhub.com/apis-docs/arr00/COMP.vote/1.0#/default"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Documentation</span>
          <img
            src="/brand/icn-arrow.svg"
            alt="Right Arrow"
            width="17"
            height="11"
          />
        </a>
      </div>

      {/* Right governance grahic container */}
      <div>
        <img src="/brand/gov-illo.svg" alt="API illustration" />
      </div>
    </div>
  );
}
