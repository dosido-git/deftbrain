// QuoteCheck — qc_* keys. English only for now (launch-first, localize as a
// follow-up pass — see deftbrain-localization-rollout memory). Missing keys
// in other languages fall back to this 'en' block automatically (src/i18n/index.js).
// {{sym}} is the user's locale currency symbol (interpolated at render time).
export const quoteCheck = {
  en: {
    qc_title: "Quote Check",
    qc_your_situation: "What you told us",
    qc_tagline: "Paste your repair quote — know if you're being overcharged",

    qc_type_label: "What kind of repair?",
    qc_type_appliance: "Appliance",
    qc_type_car: "Car / Vehicle",
    qc_type_other: "Other",

    qc_item_label: "What needs repair?",
    qc_item_ph: "e.g. Whirlpool refrigerator, about 6 years old",

    qc_wrong_label: "What's wrong?",
    qc_wrong_ph: "e.g. Not cooling, making a loud buzzing noise",

    qc_told_label: "What did the repair person tell you?",
    qc_told_hint: "their diagnosis — optional, but helps a lot",
    qc_told_ph: "e.g. They said the compressor is bad and needs replacing",

    qc_price_label: "What were you quoted?",

    qc_breakdown_label: "Itemized breakdown they gave you",
    qc_breakdown_hint: "optional",
    qc_breakdown_ph: "e.g. Compressor {{sym}}350, labor {{sym}}200, service call {{sym}}95",

    qc_upload_label: "Upload the actual quote",
    qc_upload_hint: "optional — photo or PDF, I'll read it directly",
    qc_upload_cta: "Click to upload a photo or PDF",
    qc_err_file_type: "Please upload a JPG, PNG, or PDF file.",
    qc_err_file_size: "File is too large — please keep it under 10MB.",
    qc_err_file_read: "Couldn't read that file. Please try again.",

    qc_second_label: "Got a second quote?",
    qc_second_hint: "optional — I'll compare them",

    qc_age_label: "How old is it?",
    qc_age_hint: "optional — helps with repair-vs-replace",
    qc_age_ph: "e.g. 6 years",

    qc_analyzing: "Checking...",
    qc_check_it: "Check This Quote",
    qc_error: "Something went wrong. Please try again.",
    qc_new_quote: "Start Over",
    qc_recent: "Recent checks",
    qc_clear: "Clear",

    qc_verdict_likely_fair: "LIKELY FAIR",
    qc_verdict_somewhat_high: "SOMEWHAT HIGH",
    qc_verdict_overpriced: "OVERPRICED",
    qc_verdict_cant_tell: "CAN'T TELL YET",

    qc_price_check_heading: "Price Reality Check",
    qc_typical_range: "Typical range",
    qc_where_falls: "Where this quote falls",
    qc_confidence: "Confidence",
    qc_confidence_high: "high",
    qc_confidence_medium: "medium",
    qc_confidence_low: "low",

    qc_red_flags_heading: "Red Flags",
    qc_red_flags_none: "No red flags found — this looks like a clean quote.",

    qc_itemization_heading: "Itemization Check",
    qc_itemized_good: "This quote is itemized clearly.",
    qc_itemized_missing: "What's missing:",

    qc_replace_heading: "Repair vs. Replace",

    qc_script_heading: "What to Say",

    qc_questions_heading: "Questions to Ask Before You Approve",

    qc_second_opinion_heading: "Second Opinion?",
    qc_second_opinion_yes: "Worth getting a second opinion",
    qc_second_opinion_no: "A second opinion probably isn't necessary",

    qc_related: "Related tools",
    qc_leverage: "Leverage Logic",
    qc_contract: "Contract Decoder",
    qc_scam: "Scam Radar",

    qc_copy_header: "Quote Check Results",
    qc_copy_verdict: "Verdict:",
    qc_copy_typical: "Typical range:",
    qc_copy_flags: "Red flags:",
    qc_copy_script: "What to say:",
    qc_copy_questions: "Questions to ask:",

    qc_disclaimer: "AI-generated estimate based on general market patterns — not a substitute for a real quote comparison, especially for vehicle repairs.",

    qc_example_item: "Whirlpool refrigerator, about 6 years old",
    qc_example_wrong: "Not cooling properly, freezer section is fine but the fridge side is warm",
    qc_example_told: "Technician said the compressor is failing and needs full replacement",
    qc_example_breakdown: "Compressor and labor, no itemized breakdown given",
  },
  // Recap-strip label only — the rest of the tool is English-first for now
  // (missing keys fall back to the en block; see header note).
  es: { qc_your_situation: "Lo que nos contaste" },
  zh: { qc_your_situation: "你告诉我们的情况" },
  hi: { qc_your_situation: "आपने हमें जो बताया" },
  ar: { qc_your_situation: "ما أخبرتنا به" },
  pt: { qc_your_situation: "O que você nos contou" },
  fr: { qc_your_situation: "Ce que vous nous avez dit" },
  de: { qc_your_situation: "Was du uns erzählt hast" },
  ja: { qc_your_situation: "あなたが教えてくれたこと" },
  ko: { qc_your_situation: "알려주신 내용" },
  ru: { qc_your_situation: "Что вы нам рассказали" },
  th: { qc_your_situation: "สิ่งที่คุณบอกเรา" },
  vi: { qc_your_situation: "Những gì bạn đã chia sẻ" },
};
