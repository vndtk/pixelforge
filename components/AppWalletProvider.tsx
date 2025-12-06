"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultAddressSelector,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-adapter-mobile";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new SolanaMobileWalletAdapter({
        appIdentity: {
          name: "Mintistry",
          uri: typeof window !== "undefined" ? window.location.origin : "https://mintistry.app",
          icon: "/vercel.svg", // Ensure you have an icon or use a relative path
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        addressSelector: createDefaultAddressSelector(),
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
        cluster: network,
      }),
      new PhantomWalletAdapter(),
    ],
    [network],
  );

  const onError = React.useCallback((error: Error) => {
    console.error("Wallet error:", error);
    // Dispatch custom event that can be caught by components
    window.dispatchEvent(new CustomEvent("walletError", { detail: error }));
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
