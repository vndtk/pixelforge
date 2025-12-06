import { NextRequest, NextResponse } from "next/server";
import { mintNFT, parsePrivateKey } from "@/lib/metaplex";
import { Keypair } from "@solana/web3.js";

/**
 * Request body for minting NFT
 */
interface MintNFTAPIRequest {
  metadataUri: string;
  name: string;
  symbol: string;
  sellerFeeBasisPoints: number;
  recipientAddress: string;
}

/**
 * Response from minting API
 */
interface MintNFTAPIResponse {
  success: boolean;
  signature?: string;
  mintAddress?: string;
  error?: string;
  message?: string;
}

/**
 * API endpoint to mint NFT on Solana
 *
 * This endpoint creates a new NFT on Solana using Metaplex Token Metadata.
 * It requires the metadata to already be uploaded to Arweave.
 *
 * The NFT is minted directly to the recipient's wallet.
 */
export async function POST(request: NextRequest) {
  try {
    const body: MintNFTAPIRequest = await request.json();

    // Validate required fields
    if (
      !body.metadataUri ||
      !body.name ||
      !body.symbol ||
      !body.recipientAddress
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message:
            "metadataUri, name, symbol, and recipientAddress are required",
        } as MintNFTAPIResponse,
        { status: 400 }
      );
    }

    console.log("\n=== MINT NFT API REQUEST ===");
    console.log("Metadata URI:", body.metadataUri);
    console.log("Name:", body.name);
    console.log("Symbol:", body.symbol);
    console.log("Royalty:", body.sellerFeeBasisPoints, "basis points");
    console.log("Recipient:", body.recipientAddress);

    // Get environment variables
    const rpcEndpoint =
      process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
      "https://api.devnet.solana.com";
    const collectionMint = process.env.NEXT_PUBLIC_COLLECTION_MINT;
    const collectionAuthorityKey = process.env.COLLECTION_UPDATE_AUTHORITY;

    // The payer will be the collection update authority
    // (In production, you might want a separate payer keypair)
    if (!collectionAuthorityKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
          message: "COLLECTION_UPDATE_AUTHORITY not configured",
        } as MintNFTAPIResponse,
        { status: 500 }
      );
    }

    let payerKeypair: Keypair;
    let collectionUpdateAuthority: Keypair | undefined;

    try {
      payerKeypair = parsePrivateKey(collectionAuthorityKey);
      collectionUpdateAuthority = collectionMint
        ? parsePrivateKey(collectionAuthorityKey)
        : undefined;
    } catch (error) {
      console.error("Failed to parse private keys:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
          message: "Invalid private key format",
        } as MintNFTAPIResponse,
        { status: 500 }
      );
    }

    console.log("Payer Wallet:", payerKeypair.publicKey.toBase58());
    console.log("Collection Mint:", collectionMint || "None");
    console.log("RPC Endpoint:", rpcEndpoint);

    // Mint the NFT
    try {
      const result = await mintNFT({
        rpcEndpoint,
        payerKeypair,
        name: body.name,
        symbol: body.symbol,
        uri: body.metadataUri,
        sellerFeeBasisPoints: body.sellerFeeBasisPoints || 500,
        recipientAddress: body.recipientAddress,
        collectionMint,
        collectionUpdateAuthority,
      });

      console.log("\n✅ NFT MINTED SUCCESSFULLY!");
      console.log("Mint Address:", result.mintAddress);
      console.log("Transaction:", result.signature);

      return NextResponse.json(
        {
          success: true,
          mintAddress: result.mintAddress,
          signature: result.signature,
          message: "NFT minted successfully",
        } as MintNFTAPIResponse,
        { status: 200 }
      );
    } catch (mintError) {
      console.error("Minting error:", mintError);

      // Extract error message
      const errorMessage =
        mintError instanceof Error
          ? mintError.message
          : "Unknown minting error";

      return NextResponse.json(
        {
          success: false,
          error: "Minting failed",
          message: errorMessage,
        } as MintNFTAPIResponse,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      } as MintNFTAPIResponse,
      { status: 500 }
    );
  }
}
