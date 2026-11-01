"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SimulatedBadge } from "@/components/shared/escrow-summary-card";
import { WalletPanel } from "@/components/wallet/wallet-panel";

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Your demo wallet, token balances and earnings from escrow-backed freelance contracts."
        actions={<SimulatedBadge />}
      />
      <WalletPanel />
    </div>
  );
}
