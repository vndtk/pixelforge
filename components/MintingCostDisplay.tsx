"use client";

import React from "react";
import { MintingCost } from "@/hooks/useMintingCost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";

interface MintingCostDisplayProps {
  cost: MintingCost;
  userBalance: number; // in SOL
}

/**
 * Format SOL amount with appropriate decimal places
 */
function formatSOL(amount: number): string {
  if (amount === 0) return "0 SOL";
  if (amount < 0.0001) return amount.toFixed(6) + " SOL";
  return amount.toFixed(4) + " SOL";
}

/**
 * Format USD amount
 */
function formatUSD(amount: number): string {
  return "$" + amount.toFixed(2) + " USD";
}

export function MintingCostDisplay({
  cost,
  userBalance,
}: MintingCostDisplayProps) {
  const hasInsufficientBalance = userBalance < cost.total;
  const shortfall = hasInsufficientBalance ? cost.total - userBalance : 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-wider uppercase flex items-center gap-2">
          💰 MINTING COST
          {cost.isLoading && !cost.error && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error State */}
        {cost.error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/50">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-xs text-yellow-500">
              {cost.error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {cost.isLoading ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculating minting cost...</span>
            </div>
            <div className="text-xs">Estimated: ~0.015-0.020 SOL</div>
          </div>
        ) : (
          <>
            {/* Cost Breakdown */}
            <div className="space-y-2 font-mono text-sm">
              {/* Transaction Fee */}
              {cost.transactionFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Transaction Fee:</span>
                  <span className="text-foreground font-medium">
                    {formatSOL(cost.transactionFee)}
                  </span>
                </div>
              )}

              {/* Metadata Storage */}
              {cost.metadataRent > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Metadata Storage:
                  </span>
                  <span className="text-foreground font-medium">
                    {formatSOL(cost.metadataRent)}
                  </span>
                </div>
              )}

              {/* Token Account */}
              {cost.tokenAccountRent > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Token Account:</span>
                  <span className="text-foreground font-medium">
                    {formatSOL(cost.tokenAccountRent)}
                  </span>
                </div>
              )}

              {/* Master Edition */}
              {cost.masterEditionRent > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Master Edition:</span>
                  <span className="text-foreground font-medium">
                    {formatSOL(cost.masterEditionRent)}
                  </span>
                </div>
              )}

              {/* Platform Fee (if applicable) */}
              {cost.platformFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Platform Fee:</span>
                  <span className="text-foreground font-medium">
                    {formatSOL(cost.platformFee)}
                  </span>
                </div>
              )}
            </div>

            {/* Separator */}
            <Separator />

            {/* Total */}
            <div className="space-y-1">
              <div className="flex justify-between items-center font-mono">
                <span className="text-base font-bold">Total:</span>
                <div className="text-right">
                  <div className="text-base font-bold text-rose-400">
                    {formatSOL(cost.total)}
                  </div>
                  {cost.totalUSD !== null && (
                    <div className="text-xs text-muted-foreground">
                      (~{formatUSD(cost.totalUSD)})
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Balance Check */}
            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center font-mono text-sm">
                <span className="text-muted-foreground">Your Balance:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatSOL(userBalance)}</span>
                  {hasInsufficientBalance ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {hasInsufficientBalance && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/50">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-500">
                    Insufficient balance. You need{" "}
                    <span className="font-mono font-bold">
                      {formatSOL(shortfall)}
                    </span>{" "}
                    more to mint this NFT.
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
