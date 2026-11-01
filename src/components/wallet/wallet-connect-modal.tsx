"use client";

import { useState } from "react";
import { CheckCircle2, FlaskConical, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WALLET_PROVIDERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { connectWallet } from "@/services";
import type { WalletProvider } from "@/types";

const PROVIDER_STYLE: Record<WalletProvider, { gradient: string; tagline: string }> = {
  MetaMask: { gradient: "from-orange-500 to-amber-400", tagline: "Popular browser wallet" },
  WalletConnect: { gradient: "from-sky-500 to-blue-600", tagline: "Scan with any mobile wallet" },
  "Coinbase Wallet": { gradient: "from-blue-600 to-indigo-600", tagline: "Self-custody wallet" },
  Phantom: { gradient: "from-violet-500 to-fuchsia-500", tagline: "Multi-chain wallet" },
  Rainbow: { gradient: "from-pink-500 via-yellow-400 to-sky-500", tagline: "Colourful Ethereum wallet" },
};

export function WalletConnectModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [connecting, setConnecting] = useState<WalletProvider | null>(null);

  async function handleConnect(provider: WalletProvider) {
    setConnecting(provider);
    try {
      await connectWallet(provider);
      toast.success(`${provider} connected`, { description: "Demo wallet — no real blockchain connection was made." });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not connect wallet");
    } finally {
      setConnecting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (connecting ? undefined : onOpenChange(next))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
          <DialogDescription>Choose a provider to connect a simulated demo wallet.</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
          <FlaskConical className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong className="font-semibold">Demo Wallet.</strong> No real wallet SDK, private keys, signatures or RPC calls are used. A fake address and balances are generated locally.
          </p>
        </div>

        <ul className="grid gap-2" aria-label="Wallet providers">
          {WALLET_PROVIDERS.map((provider) => {
            const style = PROVIDER_STYLE[provider];
            const isBusy = connecting === provider;
            return (
              <li key={provider}>
                <button
                  type="button"
                  disabled={connecting !== null}
                  onClick={() => handleConnect(provider)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all",
                    "hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60",
                  )}
                >
                  <span className={cn("flex size-10 items-center justify-center rounded-xl bg-linear-to-br text-sm font-bold text-white", style.gradient)}>
                    {provider[0]}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{provider}</span>
                    <span className="block text-xs text-muted-foreground">{style.tagline}</span>
                  </span>
                  {isBusy ? (
                    <Loader2 className="size-4 animate-spin text-primary" aria-label="Connecting" />
                  ) : (
                    <CheckCircle2 className="size-4 text-muted-foreground/30" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldAlert className="size-3.5" /> Never share a real seed phrase. This prototype will never ask for one.
        </p>
      </DialogContent>
    </Dialog>
  );
}
