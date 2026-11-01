"use client";

import { useParams } from "next/navigation";
import { ContractWorkspace } from "@/components/contracts/contract-workspace";

export default function EmployerContractPage() {
  const { id } = useParams<{ id: string }>();
  return <ContractWorkspace contractId={id} viewer="employer" />;
}
