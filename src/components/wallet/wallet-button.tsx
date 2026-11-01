"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Copy, LogOut, Network as NetworkIcon, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NETWORKS } from "@/lib/constants";
import { formatNumber, shortenAddress } from "@/lib/format";
import { disconnectWallet, switchWalletNetwork } from "@/services";
import { useAppStore } from "@/store/app-store";
import { useRole } from "@/store/hooks";
import { WalletConnectModal } from "@/components/wallet/wallet-connect-modal";

/** Header wallet status: Connect button, or connected-address menu (demo wallet). */
export function WalletButton({ className }: { className?: string }) {
  const wallet = useAppStore((s) => s.wallet);
  const role = useRole();
  const [open, setOpen] = useState(false);

  async function copy() {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      toast.success("Wallet address copied");
    } catch {
      toast.error("Could not copy address");
    }
  }

  if (!wallet.connected) {
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)} className={className}>
          <Wallet className="size-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </Button>
        <WalletConnectModal open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className={className} aria-label="Wallet menu" />}>
        <span className="size-2 rounded-full bg-success shadow-[0_0_8px] shadow-success" aria-hidden />
        <span className="hidden font-mono text-xs sm:inline">{shortenAddress(wallet.address)}</span>
        <Wallet className="size-4 sm:hidden" />
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="space-y-1 px-2 py-2">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{wallet.provider}</span>
              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                Demo wallet
              </Badge>
            </span>
            <span className="block font-mono text-xs font-normal text-muted-foreground">{shortenAddress(wallet.address, 6)}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <div className="grid grid-cols-2 gap-1.5 px-2 pb-2">
          {Object.entries(wallet.balances).map(([token, amount]) => (
            <div key={token} className="rounded-md bg-muted/60 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">{token}</span>
              <span className="block font-semibold">{formatNumber(amount, amount < 100 ? 4 : 2)}</span>
            </div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Network</DropdownMenuLabel>
          {NETWORKS.map((n) => (
            <DropdownMenuItem
              key={n}
              onClick={async () => {
                await switchWalletNetwork(n);
                toast.success(`Switched to ${n}`);
              }}
            >
              <NetworkIcon /> {n}
              {wallet.network === n && <Check className="ml-auto text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copy}>
          <Copy /> Copy address
        </DropdownMenuItem>
        {role === "seeker" && (
          <DropdownMenuItem render={<Link href="/wallet" />}>
            <Wallet /> Open wallet
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await disconnectWallet();
            toast.success("Wallet disconnected");
          }}
        >
          <LogOut /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
