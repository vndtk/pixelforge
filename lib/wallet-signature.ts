import { WalletContextState } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

/**
 * Creates a message to sign for minting verification
 */
export function createMintingMessage(params: {
  walletAddress: string;
  nftName: string;
  timestamp: number;
}): string {
  return `PixelForge NFT Minting Request

Wallet: ${params.walletAddress}
NFT Name: ${params.nftName}
Timestamp: ${params.timestamp}

By signing this message, you authorize the minting of this NFT.`;
}

/**
 * Signs a message using the connected wallet
 */
export async function signMintingRequest(
  wallet: WalletContextState,
  nftName: string
): Promise<{ signature: string; timestamp: number; message: string } | null> {
  if (!wallet.signMessage || !wallet.publicKey) {
    console.error("Wallet does not support message signing");
    return null;
  }

  try {
    const timestamp = Date.now();
    const message = createMintingMessage({
      walletAddress: wallet.publicKey.toBase58(),
      nftName,
      timestamp,
    });

    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);

    // Sign the message
    const signatureBytes = await wallet.signMessage(messageBytes);

    // Convert signature to base58 string
    const signature = bs58.encode(signatureBytes);

    return {
      signature,
      timestamp,
      message,
    };
  } catch (error) {
    console.error("Failed to sign message:", error);
    return null;
  }
}

/**
 * Verifies a signature (for backend use)
 * Note: This is for reference - actual verification should happen on backend
 */
export function verifySignatureFormat(signature: string): boolean {
  try {
    // Check if it's valid base58
    const decoded = bs58.decode(signature);
    // Ed25519 signatures are 64 bytes
    return decoded.length === 64;
  } catch {
    return false;
  }
}
