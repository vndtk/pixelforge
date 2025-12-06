/**
 * Metaplex NFT Minting Utilities
 *
 * Handles NFT creation on Solana using Metaplex Token Metadata standard
 */

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createNft,
  verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import { Keypair } from "@solana/web3.js";
import { base58 } from "@metaplex-foundation/umi/serializers";

/**
 * Initializes Umi instance with Metaplex plugins
 */
export function createUmiInstance(
  rpcEndpoint: string,
  payerKeypair: Keypair
) {
  const umi = createUmi(rpcEndpoint);

  // Convert Solana keypair to Umi keypair
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(
    payerKeypair.secretKey
  );

  // Set up Umi with identity and Metaplex plugin
  umi.use(keypairIdentity(umiKeypair));
  umi.use(mplTokenMetadata());

  return umi;
}

/**
 * Mints a new NFT using Metaplex Token Metadata
 */
export async function mintNFT(params: {
  rpcEndpoint: string;
  payerKeypair: Keypair;
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  recipientAddress: string;
  collectionMint?: string;
  collectionUpdateAuthority?: Keypair;
}) {
  const {
    rpcEndpoint,
    payerKeypair,
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    recipientAddress,
    collectionMint,
    collectionUpdateAuthority,
  } = params;

  console.log("\n=== MINTING NFT WITH METAPLEX ===");
  console.log("RPC Endpoint:", rpcEndpoint);
  console.log("Payer:", payerKeypair.publicKey.toBase58());
  console.log("Recipient:", recipientAddress);
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("URI:", uri);
  console.log("Royalty:", sellerFeeBasisPoints / 100 + "%");
  console.log("Collection:", collectionMint || "None");

  // Initialize Umi
  const umi = createUmiInstance(rpcEndpoint, payerKeypair);

  // Generate a new mint address
  const mint = generateSigner(umi);
  console.log("Generated Mint Address:", mint.publicKey);

  try {
    // Create NFT
    console.log("\n📝 Creating NFT...");
    const createNftBuilder = createNft(umi, {
      mint,
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: percentAmount(sellerFeeBasisPoints / 100), // Convert basis points to percentage
      creators: [
        {
          address: publicKey(recipientAddress),
          verified: false, // Will be verified after transfer
          share: 100,
        },
      ],
      collection: collectionMint
        ? {
            key: publicKey(collectionMint),
            verified: false, // Will verify separately
          }
        : undefined,
      // Token owner will be the recipient
      tokenOwner: publicKey(recipientAddress),
    });

    // Send transaction
    const result = await createNftBuilder.sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
    });

    const signature = base58.deserialize(result.signature)[0];
    console.log("✅ NFT Created!");
    console.log("Transaction Signature:", signature);
    console.log("Mint Address:", mint.publicKey);

    // Verify collection if provided
    if (collectionMint && collectionUpdateAuthority) {
      console.log("\n🔐 Verifying collection...");

      try {
        // Convert collection authority to Umi keypair
        const authorityKeypair = umi.eddsa.createKeypairFromSecretKey(
          collectionUpdateAuthority.secretKey
        );
        const authoritySigner = createSignerFromKeypair(umi, authorityKeypair);

        // Verify collection
        const verifyBuilder = verifyCollectionV1(umi, {
          metadata: publicKey(mint.publicKey),
          collectionMint: publicKey(collectionMint),
          authority: authoritySigner,
        });

        const verifyResult = await verifyBuilder.sendAndConfirm(umi, {
          confirm: { commitment: "confirmed" },
        });

        const verifySignature = base58.deserialize(verifyResult.signature)[0];
        console.log("✅ Collection verified!");
        console.log("Verification Signature:", verifySignature);
      } catch (error) {
        console.warn("⚠️ Collection verification failed:", error);
        console.warn("NFT created but not verified in collection");
        // Don't throw - NFT is still created successfully
      }
    }

    return {
      success: true,
      mintAddress: mint.publicKey,
      signature,
    };
  } catch (error) {
    console.error("❌ Minting failed:", error);
    throw error;
  }
}

/**
 * Parses a private key from various formats
 */
export function parsePrivateKey(privateKeyString: string): Keypair {
  // Try parsing as JSON array first
  try {
    const keyArray = JSON.parse(privateKeyString);

    // Check if it's an array
    if (Array.isArray(keyArray)) {
      const uint8Array = Uint8Array.from(keyArray);
      console.log(`Parsed key as JSON array, length: ${uint8Array.length} bytes`);

      if (uint8Array.length !== 64) {
        throw new Error(`Invalid secret key size: ${uint8Array.length} bytes (expected 64)`);
      }

      return Keypair.fromSecretKey(uint8Array);
    } else {
      console.warn("JSON parsed but not an array, trying base64...");
      throw new Error("Not an array");
    }
  } catch (error) {
    console.log("Failed to parse as JSON array, trying base64...");

    // Try parsing as base64
    try {
      const decoded = Buffer.from(privateKeyString, "base64");
      console.log(`Parsed key as base64, length: ${decoded.length} bytes`);

      if (decoded.length !== 64) {
        throw new Error(`Invalid secret key size: ${decoded.length} bytes (expected 64)`);
      }

      return Keypair.fromSecretKey(decoded);
    } catch (base64Error) {
      console.error("Failed to parse as base64:", base64Error);
      throw new Error(
        `Failed to parse private key. Must be either a JSON array of 64 numbers or a base64 string. ` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
