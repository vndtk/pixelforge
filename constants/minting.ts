export const MINTING_CONFIG = {
  // Account sizes (in bytes)
  METADATA_BASE_SIZE: 679,
  TOKEN_ACCOUNT_SIZE: 165,
  MASTER_EDITION_SIZE: 282,

  // Fees
  BASE_TRANSACTION_FEE: 5000, // lamports
  TRANSACTION_FEE_BUFFER: 1.2, // 20% buffer
  PLATFORM_FEE: 0, // SOL (set to 0 for now)

  // Refresh intervals
  NETWORK_FEE_REFRESH_MS: 60000, // 60 seconds
  SOL_PRICE_REFRESH_MS: 300000, // 5 minutes
  METADATA_DEBOUNCE_MS: 500, // 0.5 seconds

  // Fallback values (if network calls fail)
  FALLBACK_TX_FEE: 0.00001, // SOL
  FALLBACK_METADATA_RENT: 0.01, // SOL
  FALLBACK_TOKEN_RENT: 0.002, // SOL
  FALLBACK_EDITION_RENT: 0.003, // SOL
} as const;
