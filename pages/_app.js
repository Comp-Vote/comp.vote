import "styles/global.scss"; // Global styles
import GlobalProvider from "containers"; // Context provider

// Export application
export default function CompVote({ Component, pageProps }) {
  return (
    // Wrap page in context provider
    <GlobalProvider>
      <Component {...pageProps} />
    </GlobalProvider>
  );
}
