"use client";

import dynamic from "next/dynamic";

// Dynamically import wallet components with SSR disabled to prevent hydration errors
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
  }
);

const WalletBalance = dynamic(() => import("./WalletBalance"), {
  ssr: false,
});

export default function Header() {
  return (
    <header className="bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="flex justify-between items-center px-8 py-5 w-full max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity cursor-pointer">
          Mintistry
        </div>
        <div className="flex items-center gap-4">
          <WalletBalance />
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!opacity-90 !rounded-none !border !border-border" />
        </div>
      </div>
    </header>
  );
}
