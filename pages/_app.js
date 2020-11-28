import "styles/global.scss"; // Global styles
import Router from "next/router"; // Next Router
import nProgress from "nprogress"; // nProgress loading bar
import GlobalProvider from "containers"; // Context provider
import "node_modules/nprogress/nprogress.css"; // NProgress styles

// Router load animations
Router.events.on("routeChangeStart", () => nProgress.start());
Router.events.on("routeChangeComplete", () => nProgress.done());
Router.events.on("routeChangeErorr", () => nProgress.done());

// Application
export default function CompVote({ Component, pageProps }) {
  return (
    // Wrap page in context provider
    <GlobalProvider>
      <Component {...pageProps} />
    </GlobalProvider>
  );
}
