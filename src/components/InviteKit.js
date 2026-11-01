// "Ask the other person": one visitor sends a link, the other person adds
// their own side, and both can see the result from where they stand.
//
// Like shared results (shareEncode.js), the invite travels inside the link
// and nothing is stored. It rides in the #hash, never the query string, so it
// is never sent to the server or written to a request log — the sender's
// side is in it. The hash is cleared as soon as it is read, so the address
// bar cannot pass it on by accident.
//
// Two kinds of link:
//   ask  — { f: topic, a: sender's side, n: sender's name }
//          The topic is shown; the sender's side is kept out of view until
//          the other person has written theirs, so theirs is their own
//          account rather than a reply. (It is in the link, so "out of
//          view", not secret — the copy says only that.)
//   back — { f, a, b }  the same two sides, for the sender to run from their
//          own seat.
//
// Each tool maps topic/side fields onto its own form; this file only carries
// them. Wired in: RoommateCourt, TheFinalWord, DateNight, MoneyDiplomat.
import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { encodeSharePayload, decodeSharePayload } from '../utils/shareEncode';
import { track } from '../utils/analytics';
import { CopyBtn } from './ActionButtons';

const FIELD_MAX = 1500;
const clipAll = (o) => Object.fromEntries(Object.entries(o || {})
  .filter(([, v]) => v != null && v !== '')
  .map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, FIELD_MAX) : v]));

export function inviteUrl(toolId, data) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://deftbrain.com';
  return `${origin}/${toolId}#join=${encodeSharePayload({ t: toolId, ...data })}`;
}

// Reads and clears an invite for this tool. Call once, on mount. The result
// is kept per page load: clearing the hash means a second read (React's
// development double-render, a remount) would otherwise find nothing.
const readCache = {};
export function readInvite(toolId) {
  if (typeof window === 'undefined') return null;
  if (toolId in readCache) return readCache[toolId];
  const m = window.location.hash.match(/^#join=([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  readCache[toolId] = parseInvite(toolId, m[1]);
  return readCache[toolId];
}

function parseInvite(toolId, raw) {
  const m = [null, raw];
  const p = decodeSharePayload(m[1]);
  try { window.history.replaceState(null, '', window.location.pathname); } catch (_) { /* old browsers keep the hash */ }
  if (!p || p.t !== toolId || !['ask', 'back'].includes(p.k)) return null;
  const inv = { kind: p.k, topic: p.f || {}, a: p.a || {}, b: p.b || {}, name: typeof p.n === 'string' ? p.n.slice(0, 40) : '' };
  track(inv.kind === 'ask' ? 'invite_opened' : 'invite_back_opened', { tool: toolId });
  return inv;
}

// Every way to send the link to one person. The device's share sheet, where
// there is one, lists every app they have; the direct links are for browsers
// without it (desktop Chrome, Firefox). Copy covers anything not listed.
const SendTo = ({ url, text, title, c, onSent }) => {
  const { t } = useTranslation();
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const btn = `px-3 py-2 rounded-lg text-sm font-semibold border ${c.border} ${c.btnSecondary}`;
  const msg = encodeURIComponent(`${text} ${url}`);
  const link = (href, label, newTab = true) => (
    <a href={href} onClick={onSent} className={btn} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>
  );
  return (
    <>
      {canShare && (
        <button type="button" onClick={async () => { try { await navigator.share({ title, text, url }); onSent(); } catch (_) { /* cancelled */ } }}
          className={btn}>📤 {t('invite_send')}</button>
      )}
      {link(`sms:?&body=${msg}`, t('invite_sms'), false)}
      {link(`https://wa.me/?text=${msg}`, 'WhatsApp')}
      {link(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, 'Telegram')}
      {link(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`, t('share_email'), false)}
      <CopyBtn content={url} label={t('invite_copy')} exact quiet onCopied={onSent} />
    </>
  );
};

// Sender's panel: optional first name, then the link.
// noteKey: what the sender is told the other person will see. Default fits a
// hidden side; tools where the topic is shown pass their own.
export const AskThem = ({ toolId, toolTitle, topic, side, c, disabled, noteKey = 'invite_note', btnKey = 'invite_ask_btn' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const url = inviteUrl(toolId, { k: 'ask', f: clipAll(topic), a: clipAll(side), ...(name.trim() ? { n: name.trim().slice(0, 40) } : {}) });
  const text = t('invite_message', { tool: toolTitle });
  const sent = () => track('invite_sent', { tool: toolId });

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} disabled={disabled}
        className={`px-3 py-2 rounded-lg text-sm font-semibold border ${c.border} ${c.btnSecondary} disabled:opacity-40`}>
        👥 {t(btnKey)}
      </button>
    );
  }
  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.card} space-y-3`}>
      <p className={`text-sm font-semibold ${c.labelText}`}>{t('invite_heading')}</p>
      <p className={`text-[13px] ${c.textMuted}`}>{t(noteKey)}</p>
      <label className="block">
        <span className={`text-[13px] ${c.textMuted} block mb-1`}>{t('invite_name_label')}</span>
        <input value={name} onChange={e => setName(e.target.value)} maxLength={40}
          className={`w-full px-3 py-2 rounded-lg border text-sm ${c.input} outline-none`} />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <SendTo url={url} text={text} title={toolTitle} c={c} onSent={sent} />
      </div>
    </div>
  );
};

// What the other person sees above the form, and what the sender sees when
// the link comes back.
export const InviteBanner = ({ invite, topicText, c, titleKey = 'invite_banner_title', titleAnonKey = 'invite_banner_title_anon', bodyKey = 'invite_banner_body', returnedTitleKey = 'invite_returned_title', returnedBodyKey = 'invite_returned_body' }) => {
  const { t } = useTranslation();
  if (!invite) return null;
  const ask = invite.kind === 'ask';
  const title = ask
    ? (invite.name ? t(titleKey, { name: invite.name }) : t(titleAnonKey))
    : t(returnedTitleKey);
  return (
    <div role="status" className={`p-4 rounded-xl border ${c.border} ${c.card} mb-4 space-y-2`}>
      <p className={`text-[15px] font-semibold ${c.labelText}`}>👥 {title}</p>
      <p className={`text-[13px] ${c.textMuted}`}>{ask ? t(bodyKey) : t(returnedBodyKey)}</p>
      {ask && topicText && (
        <div>
          <p className={`text-xs font-semibold ${c.textMuted}`}>{t('invite_topic_label')}</p>
          <p dir="auto" className={`text-sm ${c.textSecondary} whitespace-pre-line`}>{topicText}</p>
        </div>
      )}
    </div>
  );
};

// After the other person's result: a link that opens both sides for the sender.
export const SendBack = ({ toolId, toolTitle, invite, bSide, c, bodyKey = 'invite_back_body', bodyAnonKey = 'invite_back_body_anon' }) => {
  const { t } = useTranslation();
  if (!invite || invite.kind !== 'ask') return null;
  const url = inviteUrl(toolId, { k: 'back', f: clipAll(invite.topic), a: clipAll(invite.a), b: clipAll(bSide) });
  const sent = () => track('invite_completed', { tool: toolId });
  const who = invite.name ? t(bodyKey, { name: invite.name }) : t(bodyAnonKey);
  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.card} mt-4 space-y-2`}>
      <p className={`text-sm font-semibold ${c.labelText}`}>👥 {t('invite_back_title')}</p>
      <p className={`text-[13px] ${c.textMuted}`}>{who}</p>
      <div className="flex flex-wrap items-center gap-2">
        <SendTo url={url} text={t('invite_back_title')} title={toolTitle} c={c} onSent={sent} />
      </div>
    </div>
  );
};
