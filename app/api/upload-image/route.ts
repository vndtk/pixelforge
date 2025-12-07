import { NextRequest, NextResponse } from "next/server";
import type {
  UploadImageRequest,
  UploadImageResponse,
} from "@/types/upload";
import { uploadToTurbo } from "@/lib/turbo";

/**
 * API endpoint to upload image to Arweave
 *
 * Receives base64 image data and uploads it to Arweave using Turbo.
 * Returns the permanent Arweave URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body: UploadImageRequest = await request.json();

    // Validate request
    if (!body.imageBase64) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing imageBase64 field",
        } as UploadImageResponse,
        { status: 400 }
      );
    }

    // Extract base64 data (remove data URL prefix if present)
    let base64Data = body.imageBase64;
    if (base64Data.startsWith("data:image/png;base64,")) {
      base64Data = base64Data.replace("data:image/png;base64,", "");
    }

    // Validate it's valid base64
    let imageBuffer: Buffer;
    try {
      imageBuffer = Buffer.from(base64Data, "base64");
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid base64 image data",
        } as UploadImageResponse,
        { status: 400 }
      );
    }

    console.log("\n=== IMAGE UPLOAD REQUEST ===");
    console.log("Image size:", Math.round(imageBuffer.length / 1024), "KB");
    console.log("Filename:", body.name || "unnamed.png");

    // Upload to Arweave via ArDrive Turbo
    const tags = body.name ? [{ name: "File-Name", value: body.name }] : [];

    const { url, id } = await uploadToTurbo(imageBuffer, "image/png", tags);

    return NextResponse.json(
      {
        success: true,
        imageUrl: url,
        transactionId: id,
      } as UploadImageResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upload image",
      } as UploadImageResponse,
      { status: 500 }
    );
  }
}
