"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownToLine, FlaskConical, Layers, LogOut, ShieldAlert, ShieldCheck, Wallet, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { TransactionHistory } from "@/components/contracts/transaction-history";
import { contractTotals } from "@/components/contracts/contract-utils";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { CopyButton } from "@/components/shared/copy-button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SelectField } from "@/components/shared/select-field";
import { NETWORKS, WALLET_PROVIDERS } from "@/lib/constants";
import { formatCurrency, formatNumber, shortenAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import { disconnectWallet, switchWalletNetwork } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useCurrentCandidate, useHydrated } from "@/store/hooks";
import type { Network } from "@/types";
import { EarningsChart, type EarningsDatum } from "./earnings-chart";
import { ReceiveDialog } from "./receive-dialog";
import { MOCK_USD_RATES, TOKEN_NAMES, toUsd } from "./token-rates";
import { WalletConnectModal } from "./wallet-connect-modal";

const NETWORK_INFO: Record<Network, { chainId: number; blurb: string; dot: string }> = {
  Ethereum: { chainId: 1, blurb: "The original smart-contract settlement layer", dot: "from-indigo-400 to-violet-500" },
  Polygon: { chainId: 137, blurb: "Low-fee scaling for payments and consumer apps", dot: "from-violet-400 to-fuchsia-500" },
  Base: { chainId: 8453, blurb: "Coinbase's Ethereum layer-2 for on-chain apps", dot: "from-sky-400 to-blue-600" },
  Arbitrum: { chainId: 42161, blurb: "Optimistic rollup popular with DeFi teams", dot: "from-cyan-400 to-sky-600" },
};

function DemoWalletBadge() {
  return (
    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
      <FlaskConical className="size-3" aria-hidden />
      Demo Wallet
    </Badge>
  );
}

function NoRealKeysNote({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-semibold">Demo Wallet only.</strong> There are no real keys, no signing and no RPC calls. The address and balances are
        generated locally so you can explore escrow payments safely.
      </p>
    </div>
  );
}

function DisconnectedHero() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-grid relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-12 text-center sm:px-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-linear-to-br from-indigo-500/25 to-violet-500/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-xl space-y-5">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-violet-500/30">
            <Wallet className="size-8" aria-hidden />
          </span>
          <DemoWalletBadge />
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Connect a <span className="gradient-text">demo wallet</span>
          </h2>
          <p className="text-pretty text-muted-foreground">
            Connect a simulated wallet to see token balances, receive escrow payouts and watch your earnings grow as clients release milestone
            payments. Pick any provider — it is all generated locally in your browser.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="gradient" size="lg" onClick={() => setOpen(true)}>
              <Wallet aria-hidden />
              Connect Wallet
            </Button>
            <Link href="/contracts" className={buttonVariants({ variant: "outline", size: "lg" })}>
              View my contracts
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Escrow-backed payouts", body: "See released milestone payments from your contracts reflected in your earnings." },
          { icon: ArrowDownToLine, title: "Receive anywhere", body: "Get a demo address and a decorative receive pattern for each supported network." },
          { icon: Zap, title: "Switch networks", body: "Move between Ethereum, Polygon, Base and Arbitrum to preview multi-chain flows." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-3 font-heading text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <section aria-label="Supported networks" className="rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
          <Layers className="size-4 text-primary" aria-hidden />
          Supported networks
        </h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {NETWORKS.map((network) => {
            const info = NETWORK_INFO[network];
            return (
              <li key={network} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <span aria-hidden className={cn("mt-0.5 size-8 shrink-0 rounded-full bg-linear-to-br", info.dot)} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{network}</p>
                  <p className="text-xs text-muted-foreground">Chain ID {info.chainId} · simulated</p>
                  <p className="mt-1 text-xs text-pretty text-muted-foreground">{info.blurb}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">Demo providers: {WALLET_PROVIDERS.join(", ")}.</p>
      </section>

      <NoRealKeysNote />
      <WalletConnectModal open={open} onOpenChange={setOpen} />
    </div>
  );
}

function ConnectedWallet() {
  const wallet = useAppStore((s) => s.wallet);
  const candidate = useCurrentCandidate();
  const contracts = useAppStore((s) => s.contracts);
  const transactions = useAppStore((s) => s.transactions);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const tokens = useMemo(() => {
    const rows = Object.entries(wallet.balances).map(([symbol, amount]) => ({ symbol, amount, usd: toUsd(amount, symbol) }));
    const total = rows.reduce((sum, r) => sum + r.usd, 0);
    return { rows: rows.sort((a, b) => b.usd - a.usd), total };
  }, [wallet.balances]);

  const myContracts = useMemo(
    () => (candidate ? contracts.filter((c) => c.freelancerId === candidate.id) : []),
    [contracts, candidate],
  );
  const myTransactions = useMemo(() => {
    const ids = new Set(myContracts.map((c) => c.id));
    return transactions.filter((t) => ids.has(t.contractId));
  }, [transactions, myContracts]);

  const earnings = useMemo(() => {
    const chart: EarningsDatum[] = myContracts.map((c) => {
      const t = contractTotals(c);
      return {
        name: c.title.length > 18 ? `${c.title.slice(0, 17)}…` : c.title,
        released: toUsd(t.released, c.token),
        inEscrow: toUsd(t.inEscrow, c.token),
        upcoming: toUsd(t.pending, c.token),
      };
    });
    return {
      released: chart.reduce((sum, d) => sum + d.released, 0),
      inEscrow: chart.reduce((sum, d) => sum + d.inEscrow, 0),
      upcoming: chart.reduce((sum, d) => sum + d.upcoming, 0),
      chart,
    };
  }, [myContracts]);

  async function changeNetwork(next: string) {
    const network = next as Network;
    setSwitching(true);
    try {
      await switchWalletNetwork(network);
      toast.success(`Switched to ${network}`, { description: "Simulated — no network connection was made." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not switch network");
    } finally {
      setSwitching(false);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectWallet();
      toast.success("Wallet disconnected", { description: "The demo wallet session was cleared." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disconnect");
    }
  }

  const address = wallet.address ?? "";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            aria-label="Wallet"
            className="card-glow relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-linear-to-br from-indigo-500/25 to-violet-500/15 blur-3xl"
            />
            <div className="relative space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-violet-500/30">
                    {wallet.provider?.[0] ?? "W"}
                  </span>
                  <div>
                    <p className="font-heading text-base font-semibold">{wallet.provider}</p>
                    <p className="text-xs text-muted-foreground">Connected on {wallet.network}</p>
                  </div>
                </div>
                <DemoWalletBadge />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Total balance (≈ USD at mock rates)</p>
                <p className="font-heading text-4xl font-bold tracking-tight tabular-nums">
                  <span className="gradient-text">{formatCurrency(tokens.total, "USD", 2)}</span>
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Address</p>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
                    <span className="font-mono text-sm" title={address}>
                      {shortenAddress(address, 6)}
                    </span>
                    <CopyButton value={address} label="Wallet address" className="ml-auto size-7" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="wallet-network" className="text-sm font-medium">
                    Network
                  </label>
                  <SelectField
                    id="wallet-network"
                    value={wallet.network}
                    onChange={changeNetwork}
                    disabled={switching}
                    options={NETWORKS.map((n) => ({ value: n, label: n }))}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="gradient" onClick={() => setReceiveOpen(true)}>
                  <ArrowDownToLine aria-hidden />
                  Receive
                </Button>
                <Button variant="outline" onClick={() => setDisconnectOpen(true)}>
                  <LogOut aria-hidden />
                  Disconnect
                </Button>
              </div>
            </div>
          </motion.section>

          <section aria-label="Token balances" className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-base font-semibold">Token balances</h2>
              <span className="text-xs text-muted-foreground">Mock values</span>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {tokens.rows.map((row) => {
                const share = tokens.total > 0 ? (row.usd / tokens.total) * 100 : 0;
                return (
                  <li key={row.symbol} className="flex items-center gap-3 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500/80 to-violet-500/80 text-xs font-bold text-white">
                      {row.symbol.slice(0, 3)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {row.symbol} <span className="font-normal text-muted-foreground">· {TOKEN_NAMES[row.symbol] ?? row.symbol}</span>
                        </p>
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(row.usd, "USD", 2)}</p>
                      </div>
                      <div className="mt-0.5 flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {formatNumber(row.amount, row.amount < 100 ? 4 : 2)} {row.symbol}
                        </span>
                        <span className="tabular-nums">
                          1 {row.symbol} ≈ {formatCurrency(MOCK_USD_RATES[row.symbol] ?? 0, "USD", 2)}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${row.symbol} share of portfolio`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(share)}
                        className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"
                      >
                        <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Recent activity" className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-base font-semibold">Recent activity</h2>
              <Link href="/contracts" className="text-xs font-medium text-primary hover:underline">
                All contracts
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Simulated escrow transactions on your contracts. Select one for details.</p>
            <TransactionHistory
              transactions={myTransactions}
              limit={6}
              showContract
              className="mt-2"
              emptyText="No escrow activity yet. Transactions appear here once a client funds a milestone."
            />
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section aria-label="Earnings summary" className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-base font-semibold">Earnings summary</h2>
            <p className="text-xs text-muted-foreground">Across your freelance contracts (≈ USD)</p>
            <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-lg border border-success/30 bg-success/10 p-3">
                <dt className="text-xs text-muted-foreground">Released</dt>
                <dd className="font-heading text-lg font-semibold text-success tabular-nums">{formatCurrency(earnings.released, "USD")}</dd>
              </div>
              <div className="rounded-lg border border-info/30 bg-info/10 p-3">
                <dt className="text-xs text-muted-foreground">Pending release (in escrow)</dt>
                <dd className="font-heading text-lg font-semibold text-info tabular-nums">{formatCurrency(earnings.inEscrow, "USD")}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">Awaiting funding</dt>
                <dd className="font-heading text-lg font-semibold tabular-nums">{formatCurrency(earnings.upcoming, "USD")}</dd>
              </div>
            </dl>
            <div className="mt-4">
              {earnings.chart.length > 0 ? (
                <EarningsChart data={earnings.chart} />
              ) : (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  No contracts yet.{" "}
                  <Link href="/projects" className="font-medium text-primary hover:underline">
                    Find a project
                  </Link>{" "}
                  to start earning.
                </p>
              )}
            </div>
          </section>

          <NoRealKeysNote />
        </aside>
      </div>

      <ReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} address={address} network={wallet.network} />
      <ConfirmationDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        destructive
        title="Disconnect demo wallet?"
        confirmLabel="Disconnect"
        onConfirm={handleDisconnect}
        description="The simulated wallet session ends and its address is cleared. You can connect a new demo wallet at any time. Nothing real is affected."
      />
    </div>
  );
}

/** Seeker wallet screen: connect hero or the connected demo-wallet dashboard. */
export function WalletPanel() {
  const hydrated = useHydrated();
  const connected = useAppStore((s) => s.wallet.connected);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }
  return connected ? <ConnectedWallet /> : <DisconnectedHero />;
}
