# /guides Index Page — Editorial Spec

**Purpose:** The landing page at `/guides` that earns the discreet homepage link. Per the handoff: *"A discreet header link to a thin or unconvincing index page is worse than no link at all."* The editorial work matters more than the visual.

---

## Page-level framing

### Title (browser tab + H1)
**DeftBrain Guides**

### Lede (one paragraph, top of page)

A growing collection of practical guides for the moments when something specific is on your mind — a hard conversation, a confusing diagnosis, a lease that doesn't sit right. They're written for the person who searched the exact phrase, not for the audience that wanted an overview. Each guide is short, structured, and ends with a tool that does the work the guide tells you how to do. The categories below are the kinds of moments we've been writing for.

### Footer line (bottom of page)

More guides shipping regularly. If there's a moment we haven't written for yet, the [tool catalog](/) is where the work continues.

---

## Categories — grouped editorially

The page reads better with light grouping than as twelve flat sections. Three groups feel right: **Work life**, **Practical life**, and **Personal life**, with one final orphan grouping for the categories that don't fit cleanly.

---

### Work life

#### Workplace
*Hard conversations, decoding the language of meetings, sending the email you mean to send.*

What's there: how to push back on a manager without burning the relationship; how to translate a passive-aggressive email into what's actually being said; how to send the version of the email you'd send if you'd slept on it. *(DifficultTalkCoach, DecoderRing, VelvetHammer — 18+ guides)*

#### Career
*Self-reviews, promotion cases, the work of advocating for yourself professionally.*

What's there: building the self-review when you can't remember what you did six months ago; making the promotion case when the work was real but quiet; writing the brag sheet you'll need at the next performance review. *(BragSheetBuilder — 5 guides)*

#### Meetings
*Notes that get read, action items that get done, decisions that stick.*

What's there: the difference between meeting minutes and meeting notes; capturing decisions in a way that survives the next meeting; running a debrief that makes the next project go better. *(TheDebrief — 5 guides)*

---

### Practical life

#### Home
*Leases, landlords, the small print that becomes the year you actually live.*

What's there: how to read a lease before signing it; spotting red flags in rental contracts; getting a security deposit back when the landlord doesn't want to give it; breaking a lease cleanly when life changes. *(LeaseTrapDetector — 6 guides)*

#### Health
*Doctor's visits, lab results, diagnoses written in a language you didn't take in school.*

What's there: preparing for a 15-minute appointment so it actually counts; getting your concerns taken seriously when a doctor isn't listening; reading blood test results without panicking; understanding what your doctor actually said after you nodded along. *(DoctorVisitPrep, DoctorVisitTranslator — 11 guides)*

#### Money
*High-pressure sales, predatory fees, the conversations where the other side has done this before and you haven't.*

What's there: recognizing sales manipulation tactics before they work on you; negotiating with a car salesman without getting played; saying no to a timeshare presentation; pushing back on bank fees. *(UpsellShield — 6 guides)*

---

### Personal life

#### Conversations
*Comebacks, family dynamics, the hard verbal moments you'll be in again.*

What's there: how to respond when someone says you're being too sensitive; what to say when family asks invasive questions at holidays; the comebacks you'll wish you'd thought of in the moment, prepared in advance. *(ComebackCooker — 5 guides)*

#### Apologies
*Calibrating apologies to the actual harm, in the right register, without the hedging that undoes them.*

What's there: the difference between an apology and an explanation; apologizing to a partner without making it worse; apologizing professionally without overcommitting. *(ApologyCalibrator — 5 guides)*

#### Speeches
*Toasts and tributes for weddings, retirements, memorials — the moments where you have to speak and don't want to wing it.*

What's there: writing a wedding toast that lands without being saccharine; speaking at a retirement that does justice to the career; the memorial speech when you weren't sure you could speak at all. *(ToastWriter — 5 guides)*

---

### Other

#### Planning
*Pre-mortems, pressure-testing, finding holes in your own thinking before they find you.*

What's there: the questions to ask before starting anything that costs you time; pressure-testing a plan you've already gotten attached to; identifying the failure modes you're not currently looking at. *(PreMortem — 5 guides)*

#### Naming
*Picking a name that won't fight you for the next decade.*

What's there: auditing a product or company name for the structural problems that show up later; testing names against the conditions they'll have to survive in. *(NameAudit — 5 guides)*

#### Pets
*Decoding what your pet's behavior actually means.*

What's there: why your dog is doing the thing; what a cat's pattern is telling you; when behavior is signal versus when it's just animal. *(PetWeirdnessDecoder — 4 guides)*

---

## Editorial notes (not for the page itself)

### What's deliberately left out

- **Parenting and relationships categories** are mentioned in your folder list but no guides from our drafted clusters land there. Either describe them yourself if guides exist, or omit them from the index until they do.
- **Specific guide titles** are mostly omitted from the index. The category pages do that work; the index sells the *category*, not the individual guide. This avoids the index becoming a directory listing.
- **Date stamps and counts** can be added during integration. I've put approximate guide counts in italics; replace with exact counts at build time.

### Why grouped

Twelve flat sections read as a tag list. Three groups (with a small orphan group) read as editorial structure. The grouping is editorial, not technical — it doesn't need to match the URL structure or the category routing.

### What earns the link

A homepage link reading "Guides" sends a small signal of editorial seriousness. The index page is what either confirms or undermines that signal. If a visitor lands here from the homepage and the page is a tag cloud, they bounce. If the page reads as if someone editorial chose what to feature and how to describe it, they read at least one category description, which is the win.

### Where the order matters

**Workplace first.** Largest cluster, broadest appeal, the category most likely to make a visitor click through. Setting the impression here.

**Practical life second.** High-need audience (legal, medical, money). The categories where the visitor is likely solving a specific problem rather than browsing.

**Personal life third.** Higher emotional stakes, narrower individual fit, but distinctive voice — these are the categories where the writing earns return visitors.

**Other last.** Smaller clusters, idiosyncratic.

### Visual integration notes

I've left styling out of this spec. The page should match the existing guide aesthetic — same headers, same body type, same link colors. The grouping headers ("Work life," "Practical life," "Personal life") should be lighter weight than the category names so the categories themselves remain the dominant visual unit. A subtle horizontal rule between groups would help; full section breaks would over-divide.

Each category name should link to its category page. Each "what's there" descriptor should be plain text, not a link — the category name does the linking work.
