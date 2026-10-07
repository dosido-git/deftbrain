module.exports = {
  slug:          'how-to-read-an-itemized-hospital-bill',
  category:      'money',
  categoryLabel: 'Money',
  title:         "How to Read an Itemized Hospital Bill (Line by Line, Without a Medical Degree)",
  titleHtml:     "How to Read an Itemized Hospital Bill <em>(Line by Line, Without a Medical Degree)</em>",
  shortTitle:    "How to Read an Itemized Hospital Bill",
  navTitle:      "how to read an itemized hospital bill",
  description:   "How to read an itemized hospital bill: what each column means, the billing errors that show up most often, and how to check it against your insurer's EOB.",
  deck:          "To read an itemized hospital bill, match each line's date, revenue code, CPT or HCPCS code, units, and charge to what actually happened during your care, then compare the amount you are asked to pay with your insurer's Explanation of Benefits. Duplicate lines, wrong units, and services you never received are the most common errors.",
  ledes: [
    `The first bill from a hospital is usually a summary: one total, maybe a few categories, and a due date. That summary is not the bill you can check. The itemized bill is, and you generally have to ask for it. When it arrives it can run several pages of dates, four-digit numbers, five-character codes, abbreviations, and prices with no obvious logic.

It reads that way because it was written for the insurer's systems, not for you. Once you know what the columns mean, it becomes something you can actually check, and checking it is worthwhile: errors such as duplicate charges, wrong quantities, and services you never received are common enough that people who look often find something.`,
    `What follows: how to get the right document, what each column means, the errors worth looking for, and how to compare the bill with your insurer's statement.`,
  ],
  steps: [
    { name: 'Ask for the itemized bill, with codes', body: "Call the hospital's billing office and ask for an itemized statement that includes the billing codes, not just descriptions. A summary bill only lists totals by category. The itemized version lists every charge on its own line. Ask for the medical records for the same stay if you want to confirm services, since the itemized bill shows what was charged and the records show what was done. Hospitals provide itemized bills on request. While you review it, you can ask in writing that the account be put on hold rather than sent to collections; many billing offices agree. Note the date and the name of the person you spoke with." },
    { name: 'What each column on an itemized hospital bill means', body: "Most itemized bills share the same columns. Date of service: the day the charge happened. Revenue code: a four-digit number for the department, such as 0250 for pharmacy, 0300 for laboratory, 0450 for the emergency room, and 0360 for operating room services. CPT or HCPCS code: a five-character code for the specific service or supply (for example, 99283 is a mid-level emergency visit). Description: often abbreviated almost beyond recognition. Units: how many of that item or service. Charge: the hospital's list price, which is usually far above what any insurer actually pays. You can look up any CPT or HCPCS code with a quick search, and the description that comes back is usually much clearer than the bill's." },
    { name: 'The billing errors that show up most often', body: "Duplicate charges: the same code on the same date twice, which can be legitimate (two separate doses) but is often a double entry. Wrong units: 10 tablets billed as 100, or a day of a monitor billed as several. Charges dated after you left, or before you arrived. Services you did not receive, such as a medication you declined or a test that was cancelled. A room charge for the day of discharge: many hospitals do not charge for it, and Medicare does not pay for it, so it is worth asking about. A higher emergency visit level than the visit felt like: the five levels run from 99281 to 99285, and the level changes the price considerably. Unbundling: separate charges for supplies or steps that are normally included in a single procedure charge. For a wider checklist that works on any statement, see [how to spot billing errors on a statement](/guides/money/how-to-spot-billing-errors-on-a-statement)." },
    { name: 'Check the bill against your insurer\'s statement', body: "If you have insurance, your insurer sends an Explanation of Benefits (EOB) for the same stay. It is not a bill. It shows what the hospital charged, what the insurer allowed, what it paid, and what it says you owe. The amount on the hospital's bill should match the EOB's patient responsibility. If the bill asks for more, ask the billing office why, because a common cause is a charge that is still being processed or was billed incorrectly. A line the insurer denied is worth a closer look too: a denial for a coding reason can sometimes be fixed by the hospital resubmitting with the right code, rather than by you paying it. Since 2022, the federal No Surprises Act has also limited surprise bills from out-of-network providers for most emergency care and for some care at in-network hospitals, and people without insurance can ask for a good-faith estimate before scheduled care; a final bill $400 or more above that estimate can be disputed. If the insurer denied the claim outright, [Not So Fast!](/NotSoFast) lays out the appeal routes, including external review." },
    { name: 'Prices, assistance, and what a review can change', body: "Hospitals in the U.S. have been required since 2021 to publish their standard charges, including what they have negotiated with insurers and what they accept as a cash price. Those figures give a sense of whether a charge is out of line. Nonprofit hospitals, which are most hospitals, must also have a written financial assistance policy, and many people who qualify never apply; eligibility often reaches well above the poverty line. A review can end in several ways: a corrected bill, a reduced balance, a payment plan with no interest, assistance that covers part or all of it, or confirmation that the bill is right. Each of those is more information than you had when the envelope arrived, and [how to negotiate a medical bill](/guides/money/how-to-negotiate-a-medical-bill) covers the conversation if it comes to that." },
  ],
  cta: {
    glyph:    '🧾',
    headline: "Go through the bill with someone who reads these all day.",
    body:     "Tell Bill Rescue what the bill says and what happened during the visit. It helps you spot the lines worth questioning, explains what the codes mean, and gives you the words for the call or the letter, with a practice mode for the conversation itself.",
    features: [
      "Itemized-bill error spotting",
      "Hospital-specific scripts and letters",
      "Financial assistance templates",
      "Practice the billing call first",
    ],
    toolId:   'BillRescue',
    toolName: 'Bill Rescue',
  },
  published: '2026-10-05',
  modified:  '2026-10-05',
};
