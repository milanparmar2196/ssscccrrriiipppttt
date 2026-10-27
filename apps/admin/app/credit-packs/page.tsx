"use client";

import RecordLibrary from "../../components/RecordLibrary";

export default function CreditPacksPage() {
  return (
    <RecordLibrary
      title="Credit Packs"
      description="Credit packs are admin grant bundles — a one-click standard amount to grant from a user's detail page. They carry no price and no checkout (no billing provider). Grants always land as ledger entries with a reason; balances are never edited directly."
      basePath="/admin/credit-packs"
      keyField="key"
      columns={["key", "name", "credits", "status", "_version"]}
      newTemplate={{ name: "", credits: 0 }}
    />
  );
}
