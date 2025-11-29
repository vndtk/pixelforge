"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletNotReadyError } from "@solana/wallet-adapter-base";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

export default function Home() {
  const { connected, wallet, connecting } = useWallet();
  const router = useRouter();
  const [mintCount, setMintCount] = useState(0);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId: number;

    const frame = () => {
      const now = Date.now();
      // Increment by approximately 100 per second
      const count = Math.floor((now - startTime) / 10);
      setMintCount(count);
      animationFrameId = requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Clear wallet error when wallet connects successfully
  useEffect(() => {
    if (connected) {
      setWalletError(null);
    }
  }, [connected]);

  // Check if selected wallet is ready
  useEffect(() => {
    if (wallet && !connected && !connecting) {
      // Give a small delay to allow connection to start
      const timer = setTimeout(() => {
        if (wallet.readyState !== "Installed" && wallet.readyState !== "Loadable") {
          setWalletError(
            `${wallet.adapter.name} is not installed. Please install the ${wallet.adapter.name} extension and refresh the page.`
          );
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [wallet, connected, connecting]);

  // Listen for wallet errors
  useEffect(() => {
    const handleWalletError = (event: Event) => {
      const customEvent = event as CustomEvent<Error>;
      const error = customEvent.detail;

      if (error instanceof WalletNotReadyError || error.name === "WalletNotReadyError") {
        setWalletError("No wallet found. Please install a Solana wallet like Phantom to continue.");
      } else if (error.name === "WalletConnectionError") {
        setWalletError("Failed to connect wallet. Please try again.");
      } else if (error.name === "WalletNotConnectedError") {
        setWalletError("Wallet disconnected. Please reconnect to continue.");
      } else {
        setWalletError("An error occurred with your wallet. Please try again.");
      }
    };

    window.addEventListener("walletError", handleWalletError);

    return () => {
      window.removeEventListener("walletError", handleWalletError);
    };
  }, []);



  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      <h1 className="text-4xl md:text-7xl font-bold text-primary animate-pulse">
        Welcome to Forge!
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Create, mint, and trade pixel art on the Solana blockchain. Connect your wallet to get started.
      </p>

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        {walletError && (
          <Card className="border-red-500/50 bg-red-500/10 w-full">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div className="space-y-1 text-left">
                  <p className="text-sm font-medium text-red-500">
                    Wallet Error
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {walletError}
                  </p>
                  <button
                    onClick={() => setWalletError(null)}
                    className="text-xs text-red-500 hover:text-red-400 underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          {connected ? (
            <button
              onClick={() => router.push("/create")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-bold cursor-pointer"
            >
              Draw Now
            </button>
          ) : (
            <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !h-10 !px-4 !py-2 !inline-flex !items-center !justify-center !whitespace-nowrap !rounded-none !text-sm !font-medium !ring-offset-background !transition-colors !focus-visible:outline-none !focus-visible:ring-2 !focus-visible:ring-ring !focus-visible:ring-offset-2 !disabled:pointer-events-none !disabled:opacity-50">
              Connect Wallet
            </WalletMultiButton>
          )}
        </div>
      </div>

      <div className="text-muted-foreground font-mono animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <span className="text-primary font-bold">{mintCount.toLocaleString()}+</span> NFTs minted
      </div>
    </div>
  );
}
