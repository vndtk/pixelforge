/**
 * Metaplex NFT Minting Utilities
 *
 * Handles NFT creation on Solana using Metaplex Core standard
 */

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { createV1 } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { Keypair } from "@solana/web3.js";
import { base58 } from "@metaplex-foundation/umi/serializers";

/**
 * Initializes Umi instance with Metaplex Core plugin
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

  // Set up Umi with identity and Metaplex Core plugin
  umi.use(keypairIdentity(umiKeypair));
  umi.use(mplCore());

  return umi;
}

/**
 * Mints a new NFT using Metaplex Core
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
    uri,
    sellerFeeBasisPoints,
    recipientAddress,
    collectionMint,
  } = params;

  console.log("\n=== MINTING NFT WITH METAPLEX CORE ===");
  console.log("RPC Endpoint:", rpcEndpoint);
  console.log("Payer:", payerKeypair.publicKey.toBase58());
  console.log("Recipient:", recipientAddress);
  console.log("Name:", name);
  console.log("URI:", uri);
  console.log("Royalty:", sellerFeeBasisPoints / 100 + "%");
  console.log("Collection:", collectionMint || "None");

  // Initialize Umi
  const umi = createUmiInstance(rpcEndpoint, payerKeypair);

  // Generate a new asset address (Core uses 'asset' instead of 'mint')
  const asset = generateSigner(umi);
  console.log("Generated Asset Address:", asset.publicKey);

  try {
    // Create Core NFT
    console.log("\n📝 Creating Core NFT...");

    // Build plugins array
    const plugins: any[] = [
      {
        type: "Royalties",
        basisPoints: sellerFeeBasisPoints,
        creators: [
          {
            address: publicKey(recipientAddress),
            percentage: 100,
          },
        ],
        ruleSet: { type: "None" },
      },
    ];

    // Add collection plugin if collection is specified
    if (collectionMint) {
      plugins.push({
        type: "Collection",
        collection: publicKey(collectionMint),
      });
    }

    const createAssetBuilder = createV1(umi, {
      asset,
      name,
      uri,
      owner: publicKey(recipientAddress),
      plugins,
    });

    // Send transaction
    const result = await createAssetBuilder.sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
    });

    const signature = base58.deserialize(result.signature)[0];
    console.log("✅ Core NFT Created!");
    console.log("Transaction Signature:", signature);
    console.log("Asset Address:", asset.publicKey);

    return {
      success: true,
      mintAddress: asset.publicKey,
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
