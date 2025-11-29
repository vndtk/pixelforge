"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();
  const [mintCount, setMintCount] = useState(0);

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



  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      <h1 className="text-4xl md:text-7xl font-bold text-primary animate-pulse">
        Welcome to Forge!
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Create, mint, and trade pixel art on the Solana blockchain. Connect your wallet to get started.
      </p>

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

      <div className="text-muted-foreground font-mono animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <span className="text-primary font-bold">{mintCount.toLocaleString()}+</span> NFTs minted
      </div>
    </div>
  );
}
