# Output defects found while capturing real examples for tool pages (2026-10-07)

Each tool was run once on its own built-in example against production, to
take real output for its page. These were seen in those runs and kept OFF
the pages. They are candidates for the quality-audit queue (see
audit/QUALITY-AUDIT-KIT.md) — none has been fixed yet.

| Tool | Defect | Class |
|---|---|---|
| TipOfTongue | Pasta example (pecorino + pepper + crispy pork, no cream, no egg) answered **cacio e pepe "with guanciale"** — wrong dish (that is gricia) and wrong recipe; gricia ranked low and described as "sometimes includes tomato". Same in 3 of 3 runs. Movie example called Coraline's lead "his" (echoing the visitor) and missed that this is likely why they "remember it differently". | wrong recall facts |
| RentersDepositSaver (/rights) | California: leads with the old 2-month / 3-month deposit cap and mentions the 2024 one-month cap (AB 12) only as a hedge. Also asserts a general "receipt requirement". | stale law |
| HistoryToday | Rome parallel: Pompey's 67 BCE command placed as a grain-supply fix (it was the anti-piracy lex Gabinia; the grain command was 57 BCE); Caesar's cut of the grain rolls dated 59 BCE (it was 46 BCE). Hearst: "roughly 30 papers by 1917" (his peak chain came in the 1920s–30s). | invented/shifted history |
| NameStorm | Says "Forkful" and "Plateful" are three syllables (both two); "Nouri … works as a .com without argument" — availability asserted, not checked. | wrong count; unverified claim |
| BragSheetBuilder | Bullets add facts not supplied: "without additional headcount", "structured weekly 1:1 curriculum", "zero-disruption reliability", "cross-team". | invention (résumé risk) |
| BillRescue | "Self-pay discount … 30 to 60 percent even if you have insurance"; "kidney stone ER visits qualify" for financial assistance (eligibility is income-based). | overclaim |
| WaitingModeLiberator | "After the interview" window given `minutes: 5` while its note says evening minutes are not counted; total_free_minutes includes those 5. | internal inconsistency |
| WrongAnswersOnly | Fake findings attributed to real institutions (Max Planck Institute, "Copenhagen Institute"). By design a joke, but real-institution attribution is worth a rule. | judgment call |
| LayoverMaximizer | Named specific airport restaurants ("Rijsttafel Schiphol") that may not exist. | possible invention |
| ComplaintEscalationWriter | Suggests concrete email addresses (customerrelations@…) — hedged "confirm", but still invented. | invented contact |

Earlier the same day: SomeoneSaidItBetter placed Wilder's Act III Our Town
line "at a wedding" — fixed in 6b7bbc3b (origin rule + supplied-facts check).

## 2026-10-08 (index-review example runs)

| Tool | Defect | Class |
|---|---|---|
| MoneyDiplomat /split | The "Social Split" (custom) option's reasoning describes the itemised rule ("her main plus half the wine and dessert, plus proportional tax and tip") but its amounts differ from the itemised option (Ana $56.26 vs $69.39). Code rescales custom amounts to the total without checking the reasoning matches. Kept off the page. | reasoning/number mismatch |
| LaundroMat /advise | Mixed load (whites, wool sweater, dark jeans, down jacket): load_assessment says "three separate loads" while its own lists add up to four (whites, sweater, jacket, jeans each alone), and recommended_settings gives one Delicate/Cold/Low setting for every load including the whites. Assessment and settings kept off the page. | count/consistency |
| ToastWriter | Asked for 2 minutes; versions estimate 0:50–1:15. The story-led version adds "the night before" the presentation (input only said she stayed late). Shown: the straightforward version only. | length shortfall; small invention |
