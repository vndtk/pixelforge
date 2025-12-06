import { NextRequest, NextResponse } from "next/server";
import type {
  UploadMetadataRequest,
  UploadMetadataResponse,
} from "@/types/minting";
import { uploadToTurbo } from "@/lib/turbo";

/**
 * API endpoint to upload NFT metadata to Arweave
 *
 * Receives metadata (name, description, image URL, attributes) and uploads
 * a Metaplex-compatible JSON file to Arweave.
 * Returns the permanent metadata URI.
 */
export async function POST(request: NextRequest) {
  try {
    const body: UploadMetadataRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name and imageUrl",
        } as UploadMetadataResponse,
        { status: 400 }
      );
    }

    console.log("\n=== METADATA UPLOAD REQUEST ===");
    console.log("Name:", body.name);
    console.log("Symbol:", body.symbol);
    console.log("Description:", body.description || "None");
    console.log("Image URL:", body.imageUrl);
    console.log("Attributes:", body.attributes?.length || 0);

    // Build Metaplex-compatible metadata JSON
    const metadata = {
      name: body.name,
      symbol: body.symbol || "FORGE",
      description:
        body.description || `${body.name} - Pixel art created on PixelForge`,
      image: body.imageUrl,
      external_url: body.externalUrl || "https://pixelforge.app",
      seller_fee_basis_points: body.sellerFeeBasisPoints || 500, // 5% default royalty
      attributes: body.attributes || [],
      properties: {
        category: "image",
        files: [
          {
            uri: body.imageUrl,
            type: "image/png",
          },
        ],
        creators: body.creatorAddress
          ? [
              {
                address: body.creatorAddress,
                share: 100,
              },
            ]
          : [],
      },
    };

    console.log("\n=== METADATA JSON ===");
    console.log(JSON.stringify(metadata, null, 2));

    // Upload metadata JSON to Arweave via ArDrive Turbo
    const metadataString = JSON.stringify(metadata);
    const metadataBuffer = Buffer.from(metadataString);

    const tags = [{ name: "NFT-Name", value: body.name }];

    const { url, id } = await uploadToTurbo(
      metadataBuffer,
      "application/json",
      tags
    );

    return NextResponse.json(
      {
        success: true,
        metadataUri: url,
        transactionId: id,
        metadata: metadata,
      } as UploadMetadataResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading metadata:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upload metadata",
      } as UploadMetadataResponse,
      { status: 500 }
    );
  }
}
