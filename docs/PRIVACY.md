# Privacy Policy

**Effective:** May 1, 2026
**Last updated:** September 25, 2026

## The short version

DeftBrain is built to need almost nothing from you. There are no accounts, no cookies, no advertising, and nothing you type into a tool is stored on our servers. Signing up for the optional newsletter is the one place an email address enters the picture at all — voluntary, and handled by a separate mailing service, not by us (details below). We do run a small, anonymous, first-party analytics system — corrected into this policy below, where it was previously described as not existing — but it carries no name, no account, and none of your actual words. Anything you submit to a tool is sent to Anthropic's Claude API to generate a result, and the result comes back to your browser. That's the whole interaction in the typical case.

A handful of specific tools also talk to other services to do their job — pronunciation audio goes through ElevenLabs, social-handle availability checks ping Instagram, X, TikTok, GitHub, and YouTube, and the fake-review tool fetches a URL you paste. Each of these is described below.

This page explains what happens when you use DeftBrain, who else might see what you submit, and what control you have. It is written in plain English. It is not a contract drafted to obscure things.

## Who we are

DeftBrain is a sole proprietorship operated from Massachusetts, USA. For privacy questions, write to **privacy@deftbrain.com**.

"We" and "us" throughout this page refer to DeftBrain. There is one operator. There is no parent company, no investors, and no advertisers.

## What happens when you use a tool

When you type something into a DeftBrain tool — describe a difficult conversation, paste a job description, ask for a recipe — your input travels:

1. Over HTTPS to our server hosted on Railway.
2. From our server to Anthropic's Claude API for processing.
3. The result returns to our server, which sends it back to your browser.

We do not store your input or the result on our servers. We do not write either to a database, to disk, or to our application logs. The audit that confirmed this and the code change that prevents future regressions were both completed on the effective date of this policy.

If a tool offers to "remember" your work between sessions — for example, DifficultTalkCoach saves your past topics and rehearsals — that data lives in your browser's `localStorage`. It does not leave your device. We can't see it, and clearing your browser data removes it.

## What we don't do

A privacy policy is partly a list of things companies don't want their users to think about. For DeftBrain:

- **No accounts.** You can't create one, and we don't want you to.
- **No required email, ever.** No account to create, no email-gated downloads — nothing on the site requires an email address to use any tool. The one optional exception is the newsletter; see below.
- **No third-party analytics.** No Google Analytics, no Plausible, no ad-tech pixel of any kind. We do run our own small, anonymous, first-party analytics — see the next section for exactly what that means, since an earlier version of this page said this didn't exist at all and that was wrong.
- **No cookies.** We don't set any. No first-party cookies, no third-party cookies, no consent banner. There's nothing to consent to. (Our analytics uses your browser's `localStorage`/`sessionStorage` instead, for the narrow purpose described below — not a cookie, and not sent to any outside party either.)
- **No advertising.** No ads, no retargeting pixels, no marketing partners.
- **No selling, sharing, or renting of personal information.** Specifically and explicitly: we do not "sell" personal information as defined by California or any other US state privacy law. We have no users database to sell from.

## Anonymous usage analytics

This section is new as of the "Last updated" date above. Earlier versions of this policy said DeftBrain ran no analytics of any kind. That was inaccurate — we run a small, first-party analytics system, and this section describes exactly what it does instead of asserting it doesn't exist.

The goal is narrow: seeing whether a tool actually gets used and finished, not building a profile of who is visiting. What gets recorded, as anonymous events with no name or account attached to any of them:

- That a page loaded, a tool ran, and whether it finished or errored.
- Which section of a long page someone actually scrolled to, and which of several result variants (if a tool offers more than one) they opened.
- A coarse "have I been here before" flag and a rough recency bucket (new, within a week, within a month, longer) — derived from a timestamp your browser already holds, not from anything we assign you.
- An approximate location — city, region, country — looked up from your IP address *at the moment of the request*, using a lookup table stored on our own server (no call to any outside service). The IP address itself is used for that one moment, to filter out bots and known cloud-hosting traffic in addition to the location lookup, and then discarded. We do not store your IP address.
- Your browser's language setting, the site you arrived from if you followed a link here, and which DeftBrain page you were on just before the current one.

What is never recorded: your name, an email address, an account identifier (there is none to record), anything you type into a tool, or any single identifier that would let two separate visits be linked to the same person. No cookie is set for this or anything else — the coarse "have I been here before" flag lives in your browser's own `localStorage` and is never joined with anything else that could identify you.

This data is written to a private, append-only log on our own server — never sent to Google, Meta, or any analytics vendor — and is visible only to the operator, behind a private access key. A separate, browser-level opt-out exists: visiting the site with `?operator=1` once turns off every beacon from that browser going forward (`?operator=0` turns it back on). That mechanism exists so the operator's own visits don't skew the numbers, but it works the same way for anyone who uses it.

## Feedback and tool ideas you submit voluntarily

Two things on this site work differently from a tool's input and output, and **are** stored: if you answer "was this helpful?" and add an optional comment, or use the "no tool for your problem? describe it" form, what you write is saved to the same private log described above — because the entire point of both is for the operator to read them. Neither is anonymized beyond whatever you choose to leave out, so treat both boxes the way you'd treat an email to a stranger: useful to send, not the place to put anything you wouldn't want kept.

## The newsletter, if you sign up

This section is new as of the "Last updated" date above. Earlier versions of this policy said flatly that DeftBrain collects no emails and runs no mailing list. That was wrong — there is an optional, opt-in newsletter, and its sign-up form appears on this page and others.

Signing up sends your email address — and, for spam-filtering purposes, your IP address at that moment — to Buttondown, the email service that actually sends the newsletter, not to us. We keep only the fact that a subscription happened and which page it came from, never the address itself. Buttondown handles the confirmation email (double opt-in — nothing is sent until you confirm) and the one-click unsubscribe link in every issue that follows.

If you never sign up, none of this applies to you.

## Third parties involved when you use DeftBrain

Three companies are reliably part of any tool you use:

### Anthropic

Our tools are powered by Anthropic's Claude API. Whatever you type into a tool is sent to Anthropic so Claude can generate a response. Under Anthropic's standard commercial API terms — which is what we use:

- **Retention:** API inputs and outputs are stored for up to 7 days, then automatically deleted, unless a request is flagged by Anthropic's trust-and-safety classifiers as violating their usage policy.
- **Training:** API data is **not** used to train Anthropic's models. This is contractual.
- **Anthropic's privacy policy:** https://www.anthropic.com/legal/privacy

### Railway

Our hosting provider. Standard request information (your IP address, user agent, the URL you visited, response time, status code) is captured in Railway's infrastructure logs and retained for **7 days** before automatic deletion. We have signed Railway's Data Processing Agreement, the standard contract under GDPR Article 28 that governs how a hosting provider processes data on a customer's behalf.

We do not log your tool inputs or outputs to Railway's logs.

Railway's privacy policy: https://railway.com/legal/privacy

### Fastly

Railway delivers traffic through Fastly's CDN. Fastly may briefly process your IP and request data to serve cached pages efficiently. They are a sub-processor of Railway under Railway's DPA.

## Per-tool third-party calls

A few specific tools make additional outbound requests to do their job. They are disclosed individually:

- **Pronounce It Right Audio.** When you request audio for a word, the word is sent to ElevenLabs' text-to-speech API to generate the spoken pronunciation. ElevenLabs' privacy policy is on their website at elevenlabs.io.
- **Name Audit and Name Storm.** When checking handle availability for a candidate name, our server makes an HTTP `HEAD` request to Instagram, X (Twitter), TikTok, GitHub, and YouTube, with the candidate name as part of the URL path. We don't log in to those platforms or send any data beyond the URL itself; we observe only whether the URL returns "found" or "not found." Each platform may log the request in its own standard server logs.
- **Fake Review Detective.** When you submit a URL to analyze, our server fetches that URL's HTML to extract reviews. The site you submit will see a request from our server's IP address, not yours. We pass a generic browser User-Agent string.

If a tool we add later interacts with new third parties, this section will be updated in the same change that adds the tool.

## What about server logs?

Railway captures standard HTTP request information — IP address, user agent, URL, status code, response time — and retains it for 7 days. This is a typical web-hosting practice and is the legal basis under which essentially every website operates.

Under GDPR, an IP address is considered personal data even though it doesn't always feel like it. We rely on Article 6(1)(f) ("legitimate interests" — running and securing a web service) as the lawful basis for processing this information.

Our application code does not write user-submitted content to logs. We audited and removed all such logging on the effective date of this policy, and added an automated check to prevent it from being reintroduced.

## Your browser's storage

Some tools (DifficultTalkCoach, Recharge Radar, Friendship Fade Alerter, and others) offer to remember your work between sessions. They do this by writing to your browser's `localStorage`, a built-in browser feature that lets a website store small amounts of data on your own device.

Three things to know:

1. The data stays on your device. We can't read it, and it isn't sent to any server.
2. It is not sent over the network.
3. You can clear it any time — by clearing your browser's storage for deftbrain.com, or by using a "reset" button inside a tool.

## Retention summary

| Location | What's stored | How long |
|---|---|---|
| Our servers | Tool inputs, tool outputs | Not retained — pass through to Anthropic |
| Anthropic | Tool inputs and outputs (via API) | 7 days, then deleted; not used for training |
| Railway | HTTP request logs (IP, URL, etc.) | 7 days, then deleted |
| Your browser | Tool data via localStorage | Until you clear it |

## International data transfers

DeftBrain operates from Massachusetts, USA. Anthropic, Railway, and ElevenLabs are US-based companies. If you access DeftBrain from outside the United States — from the EU, UK, or elsewhere — your tool input is processed in the US.

For users in the EU and UK, this means your data crosses an international border. We rely on Standard Contractual Clauses (SCCs) and equivalent mechanisms via our processors' agreements to protect this transfer in line with GDPR/UK GDPR Chapter V requirements.

## Your rights

Depending on where you live, you have rights regarding your personal data. Because we hold so little of it, most rights requests resolve quickly.

**If you're in the EU or UK (GDPR / UK GDPR):** You have the rights to access, rectify, erase, restrict, port, or object to processing of your personal data, and to lodge a complaint with your national data-protection authority. To exercise any of these rights, email **privacy@deftbrain.com**.

**If you're in California (CCPA / CPRA):** You have the rights to know what personal information we collect, to delete it, to correct it, to opt out of sale or sharing (we do neither), and to limit the use of sensitive personal information. We do not discriminate against users who exercise these rights.

**If you're in another US state with a comprehensive privacy law** — Virginia, Colorado, Connecticut, Utah, Texas, and a growing list — you have substantially the same rights as California residents. Email the same address.

**Practical reality:** Since we don't store your tool inputs, outputs, or any account data, an access or deletion request will most often result in us confirming that we hold nothing tied to you. The narrow exception is Railway's request logs, which auto-expire within 7 days regardless and which we can request be deleted earlier on your behalf.

## Children

DeftBrain is not directed at children, and we do not knowingly collect personal data from anyone under 16. If you believe a child has submitted personal data to us, email privacy@deftbrain.com and we will work to ensure that data — which would only exist in transient request logs — is removed.

## Security

We take measures appropriate for the nature of the data we handle:

- All traffic to and from DeftBrain is encrypted via HTTPS (TLS).
- We don't store user inputs, outputs, accounts, or passwords. The smallest dataset is the most defensible.
- Our hosting provider (Railway) is SOC 2 Type II certified.
- We monitor and patch our dependencies for known vulnerabilities.

No system is fully secure. If you discover a security issue, email privacy@deftbrain.com.

## Changes to this policy

When DeftBrain's data practices change — when we add analytics, when we form an LLC, when we add a tool that talks to a new third party — this page changes with them, on the same day, in the same code commit. The "Last updated" date at the top reflects the most recent change.

If a change materially affects existing users, we will note it clearly at the top of this page for at least 30 days.

## Contact

For any privacy question, request, or concern: **privacy@deftbrain.com**.

For everything else about DeftBrain: **deftbrain.com**.

## Revision history

- **2026-05-01** — Initial publication.

---

*This policy reflects our actual practices, not aspirational language. If anything you observe on the site contradicts what is written here, email privacy@deftbrain.com. We will fix the practice or fix the policy, whichever is wrong.*
