import { useState, useEffect, useCallback, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { MINTING_CONFIG } from "@/constants/minting";

export interface MintingCost {
  transactionFee: number; // in SOL
  metadataRent: number; // in SOL
  tokenAccountRent: number; // in SOL
  masterEditionRent: number; // in SOL
  platformFee: number; // in SOL (0 for now)
  total: number; // in SOL
  totalUSD: number | null; // in USD (null if not loaded)
  isLoading: boolean;
  error: string | null;
}

export interface MintingCostParams {
  nftName: string;
  creatorMessage: string;
  canvasSize: number;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Calculate the size of metadata account based on dynamic fields
 */
function calculateMetadataSize(params: MintingCostParams): number {
  const { nftName, creatorMessage } = params;

  // Base Metaplex metadata account size
  let size = MINTING_CONFIG.METADATA_BASE_SIZE;

  // Add dynamic field sizes
  size += nftName.length; // NFT name
  size += 5; // Symbol ("FORGE")
  size += 100; // Arweave URI estimate
  size += 2; // Seller fee basis points
  size += 34; // Creator address (1 creator)

  // Add creator message if stored on-chain
  // (These might be in off-chain metadata, but we'll include for safety)
  size += creatorMessage.length;

  return size;
}

/**
 * Debounce utility
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useMintingCost(params: MintingCostParams): MintingCost {
  const { connection } = useConnection();

  // State for each cost component
  const [transactionFee, setTransactionFee] = useState(0);
  const [metadataRent, setMetadataRent] = useState(0);
  const [tokenAccountRent, setTokenAccountRent] = useState(0);
  const [masterEditionRent, setMasterEditionRent] = useState(0);
  const [platformFee] = useState(MINTING_CONFIG.PLATFORM_FEE);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if this is the initial load
  const isInitialLoad = useRef(true);

  // Debounce metadata changes
  const debouncedParams = useDebounce(params, MINTING_CONFIG.METADATA_DEBOUNCE_MS);

  /**
   * Fetch rent exemption amounts
   */
  const fetchRentCosts = useCallback(async () => {
    try {
      const metadataSize = calculateMetadataSize(debouncedParams);

      const [metadataLamports, tokenLamports, editionLamports] =
        await Promise.all([
          connection.getMinimumBalanceForRentExemption(metadataSize),
          connection.getMinimumBalanceForRentExemption(
            MINTING_CONFIG.TOKEN_ACCOUNT_SIZE,
          ),
          connection.getMinimumBalanceForRentExemption(
            MINTING_CONFIG.MASTER_EDITION_SIZE,
          ),
        ]);

      setMetadataRent(metadataLamports / LAMPORTS_PER_SOL);
      setTokenAccountRent(tokenLamports / LAMPORTS_PER_SOL);
      setMasterEditionRent(editionLamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to fetch rent costs:", err);
      setError("Unable to fetch current network fees. Showing estimated cost.");

      // Set fallback values
      setMetadataRent(MINTING_CONFIG.FALLBACK_METADATA_RENT);
      setTokenAccountRent(MINTING_CONFIG.FALLBACK_TOKEN_RENT);
      setMasterEditionRent(MINTING_CONFIG.FALLBACK_EDITION_RENT);
    }
  }, [connection, debouncedParams]);

  /**
   * Estimate transaction fee
   */
  const fetchTransactionFee = useCallback(async () => {
    try {
      const recentFees = await connection.getRecentPrioritizationFees();

      if (recentFees && recentFees.length > 0) {
        // Calculate median fee
        const fees = recentFees
          .map((f) => f.prioritizationFee)
          .sort((a, b) => a - b);
        const median = fees[Math.floor(fees.length / 2)];

        // Add base transaction fee and buffer
        const totalFeeLamports =
          (median + MINTING_CONFIG.BASE_TRANSACTION_FEE) *
          MINTING_CONFIG.TRANSACTION_FEE_BUFFER;

        setTransactionFee(totalFeeLamports / LAMPORTS_PER_SOL);
      } else {
        // No recent fees, use base + buffer
        const totalFeeLamports =
          MINTING_CONFIG.BASE_TRANSACTION_FEE *
          MINTING_CONFIG.TRANSACTION_FEE_BUFFER;
        setTransactionFee(totalFeeLamports / LAMPORTS_PER_SOL);
      }
    } catch (err) {
      console.error("Failed to fetch transaction fee:", err);
      setTransactionFee(MINTING_CONFIG.FALLBACK_TX_FEE);
    }
  }, [connection]);

  /**
   * Fetch SOL price in USD via our API route (avoids CORS)
   */
  const fetchSolPrice = useCallback(async () => {
    try {
      const response = await fetch("/api/sol-price");
      const data = await response.json();

      if (data?.success && data?.price) {
        setSolPrice(data.price);
      } else {
        console.warn("SOL price not available");
        setSolPrice(null);
      }
    } catch (err) {
      console.error("Failed to fetch SOL price:", err);
      // Don't set error state for price fetch failure, just don't show USD
      setSolPrice(null);
    }
  }, []);

  /**
   * Initial load and metadata changes
   */
  useEffect(() => {
    const loadCosts = async () => {
      if (isInitialLoad.current) {
        setIsLoading(true);
      }

      // Fetch rent costs and transaction fees in parallel
      await Promise.all([fetchRentCosts(), fetchTransactionFee()]);

      // Fetch SOL price (don't block on this)
      fetchSolPrice();

      if (isInitialLoad.current) {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    };

    loadCosts();
  }, [debouncedParams, fetchRentCosts, fetchTransactionFee, fetchSolPrice]);

  /**
   * Periodic refresh of network fees
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTransactionFee();
    }, MINTING_CONFIG.NETWORK_FEE_REFRESH_MS);

    return () => clearInterval(interval);
  }, [fetchTransactionFee]);

  /**
   * Periodic refresh of SOL price
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSolPrice();
    }, MINTING_CONFIG.SOL_PRICE_REFRESH_MS);

    return () => clearInterval(interval);
  }, [fetchSolPrice]);

  // Calculate total
  const total =
    transactionFee +
    metadataRent +
    tokenAccountRent +
    masterEditionRent +
    platformFee;

  const totalUSD = solPrice ? total * solPrice : null;

  return {
    transactionFee,
    metadataRent,
    tokenAccountRent,
    masterEditionRent,
    platformFee,
    total,
    totalUSD,
    isLoading,
    error,
  };
}
