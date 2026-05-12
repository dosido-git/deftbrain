// ── cross-reference-map.md addition for ScamRadar ──
// Add ScamRadar to the consumer protection cluster:
// > SubSweep ↔ BillRescue ↔ BuyWise ↔ FakeReviewDetective ↔ MoneyDiplomat

// Extend cluster to:
// > SubSweep ↔ BillRescue ↔ BuyWise ↔ FakeReviewDetective ↔ ScamRadar ↔ ComplaintEscalationWriter ↔ MoneyDiplomat

// New cross-ref rows to add to the table:

| **ScamRadar**              | ← FakeReviewDetective  | Post-result  | "Spotted a suspicious seller? Run the message through 🎣 ScamRadar before you buy." |
| **ScamRadar**              | ← ComplaintEscalationWriter | Pre-result | "Already been scammed? 📨 Complaint Escalation Writer helps you fight back." |
| **ScamRadar**              | ← MagicMouth           | Post-result  | "Need to dispute a charge from a scam? 🪄 Magic Mouth scripts the call." |
| **FakeReviewDetective**    | ← ScamRadar            | Post-result  | "Seller looks legit? Check the reviews with 🔍 Fake Review Detective before buying." |
| **ComplaintEscalationWriter** | ← ScamRadar         | Pre-result   | "Think you're about to be scammed? 🎣 ScamRadar can confirm before you engage." |
| **MagicMouth**             | ← ScamRadar            | Pre-result   | "Got a suspicious message? 🎣 ScamRadar tells you if it's a scam first." |
