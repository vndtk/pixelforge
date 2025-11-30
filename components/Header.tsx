"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
    () =>
        import("@solana/wallet-adapter-react-ui").then(
            (mod) => mod.WalletMultiButton,
        ),
    { ssr: false },
);

export default function Header() {
    const { connected } = useWallet();

    return (
        <header className="bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
            <div className="flex justify-between items-center px-8 py-5 w-full max-w-7xl mx-auto">
                <div className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity cursor-pointer">
                    Forge
                </div>
                <div className="flex items-center gap-4">
                    <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !h-10 !px-4 !py-2 !inline-flex !items-center !justify-center !whitespace-nowrap !rounded-none !text-sm !font-medium !ring-offset-background !transition-colors !focus-visible:outline-none !focus-visible:ring-2 !focus-visible:ring-ring !focus-visible:ring-offset-2 !disabled:pointer-events-none !disabled:opacity-50">
                        {connected ? undefined : "Connect Wallet"}
                    </WalletMultiButton>
                </div>
            </div>
        </header>
    );
}
