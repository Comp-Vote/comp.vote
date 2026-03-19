import "styles/global.scss"; // Global styles
import "@rainbow-me/rainbowkit/styles.css"; // RainbowKit styles
import Router from "next/router"; // Next Router
import nProgress from "nprogress"; // nProgress loading bar
import GlobalProvider from "containers"; // Context provider
import "node_modules/nprogress/nprogress.css"; // NProgress styles
import { Analytics } from "node_modules/@vercel/analytics/dist/react/index.js";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../lib/wagmi";

// Router load animations
Router.events.on("routeChangeStart", () => nProgress.start());
Router.events.on("routeChangeComplete", () => nProgress.done());
Router.events.on("routeChangeErorr", () => nProgress.done());

const queryClient = new QueryClient();

// Application
export default function CompVote({ Component, pageProps }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <GlobalProvider>
            <Component {...pageProps} />
          </GlobalProvider>
          <Analytics />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
