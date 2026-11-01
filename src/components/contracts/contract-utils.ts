import type { Contract, Milestone } from "@/types";

export interface ContractTotals {
  total: number;
  /** milestones that have been funded at some point (incl. already released) */
  funded: number;
  released: number;
  /** funds currently held in escrow */
  inEscrow: number;
  /** total - released */
  remaining: number;
  /** milestone amounts not yet funded */
  pending: number;
  releasedCount: number;
  milestoneCount: number;
  /** 0-100, released milestones / total milestones */
  progress: number;
}

export function contractTotals(contract: Contract): ContractTotals {
  let funded = 0;
  let released = 0;
  let pending = 0;
  let releasedCount = 0;
  for (const m of contract.milestones) {
    if (m.status === "pending") pending += m.amount;
    else funded += m.amount;
    if (m.status === "released") {
      released += m.amount;
      releasedCount += 1;
    }
  }
  const milestoneCount = contract.milestones.length;
  return {
    total: contract.totalAmount,
    funded,
    released,
    inEscrow: contract.escrowBalance,
    remaining: Math.max(0, contract.totalAmount - released),
    pending,
    releasedCount,
    milestoneCount,
    progress: milestoneCount > 0 ? (releasedCount / milestoneCount) * 100 : 0,
  };
}

/** First milestone that is not yet released (milestones are ordered). */
export function nextMilestone(contract: Contract): Milestone | undefined {
  return contract.milestones.find((m) => m.status !== "released");
}

/** Latest milestone due date = expected delivery date. */
export function finalDueDate(contract: Contract): string | undefined {
  let latest: string | undefined;
  for (const m of contract.milestones) {
    if (!latest || Date.parse(m.dueDate) > Date.parse(latest)) latest = m.dueDate;
  }
  return latest;
}

export function contractHref(contractId: string, viewer: "seeker" | "employer"): string {
  return viewer === "seeker" ? `/contracts/${contractId}` : `/employer/contracts/${contractId}`;
}
