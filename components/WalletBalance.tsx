"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function WalletBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!publicKey || !connection) {
      setBalance(null);
      return;
    }

    // Capture the publicKey for this effect run to check against later
    const effectPublicKey = publicKey;
    let cancelled = false;

    setLoading(true);
    setError(null);

    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(effectPublicKey);
        // Only update state if this effect hasn't been cancelled
        if (!cancelled) {
          setBalance(balance / LAMPORTS_PER_SOL);
        }
      } catch (err) {
        console.error("Error fetching balance:", err);
        // Only update state if this effect hasn't been cancelled
        if (!cancelled) {
          setError("Failed to load balance");
        }
      } finally {
        // Only update loading state if this effect hasn't been cancelled
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    const subscriptionId = connection.onAccountChange(
      effectPublicKey,
      (accountInfo) => {
        // Only update state if this effect hasn't been cancelled
        if (!cancelled) {
          setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
        }
      }
    );

    return () => {
      // Cancel this effect run to prevent state updates
      cancelled = true;
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [publicKey, connection]);

  if (!publicKey) {
    return null;
  }

  if (error) {
    return (
      <span className="text-xs text-muted-foreground text-red-500">
        {error}
      </span>
    );
  }

  if (loading && balance === null) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Loading...
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground font-medium">
      {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
    </span>
  );
}
