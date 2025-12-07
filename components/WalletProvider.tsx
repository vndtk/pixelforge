"use client";

import { useMemo, ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  NightlyWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletContextProvider({
  children,
}: WalletProviderProps) {
  // Get network from environment variable, default to devnet
  const network = useMemo(() => {
    const envNetwork = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
    if (envNetwork === "mainnet-beta") {
      return WalletAdapterNetwork.Mainnet;
    }
    return WalletAdapterNetwork.Devnet;
  }, []);

  // Get RPC endpoint from environment variable or use default
  const endpoint = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
      (network === WalletAdapterNetwork.Mainnet
        ? clusterApiUrl("mainnet-beta")
        : clusterApiUrl("devnet"))
    );
  }, [network]);

  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new NightlyWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
