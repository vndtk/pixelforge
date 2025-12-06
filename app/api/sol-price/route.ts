import { NextResponse } from "next/server";

// Cache the price for 5 minutes to avoid rate limiting
let cachedPrice: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 300000; // 5 minutes in milliseconds

/**
 * API endpoint to fetch SOL price in USD
 *
 * This proxies the CoinGecko API to avoid CORS issues and implements
 * caching to prevent rate limiting.
 */
export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedPrice && now - cachedPrice.timestamp < CACHE_DURATION) {
      console.log("Returning cached SOL price:", cachedPrice.price);
      return NextResponse.json(
        {
          success: true,
          price: cachedPrice.price,
          cached: true,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
          },
        }
      );
    }

    // Fetch from CoinGecko
    console.log("Fetching fresh SOL price from CoinGecko...");
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 300, // Cache for 5 minutes
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data?.solana?.usd;

    if (!price) {
      throw new Error("Invalid response from CoinGecko");
    }

    // Update cache
    cachedPrice = {
      price,
      timestamp: now,
    };

    console.log("SOL price updated:", price);

    return NextResponse.json(
      {
        success: true,
        price,
        cached: false,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching SOL price:", error);

    // Return cached price if available, even if stale
    if (cachedPrice) {
      console.log("Returning stale cached price due to error");
      return NextResponse.json(
        {
          success: true,
          price: cachedPrice.price,
          cached: true,
          stale: true,
        },
        { status: 200 }
      );
    }

    // No cache available, return error
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch price",
        price: null,
      },
      { status: 500 }
    );
  }
}
