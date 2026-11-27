import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { usePartner } from '../hooks/usePartner';

// "Their help inside our answers" (partner perk 1, owner 2026-11-27): when a
// visit came through a partner's page, every tool shows how to reach a person
// at that organization. Rendered once by ToolPageWrapper, never per tool. The
// partner's own wording (label, hours) is shown as the partner wrote it.
const telHref = phone => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

export default function PartnerContacts({ isDark }) {
  const partner = usePartner();
  const { t } = useTranslation();
  if (!partner || !partner.contacts.length) return null;
  const c = {
    box: isDark ? 'border-zinc-600 bg-zinc-800 text-zinc-100' : 'border-stone-200 bg-white text-stone-800',
    muted: isDark ? 'text-zinc-400' : 'text-stone-500',
    link: isDark ? 'text-amber-300' : 'text-[#1e3a5f]',
  };
  return (
    <aside className={`mt-4 rounded-2xl border px-5 py-4 ${c.box}`} aria-label={t('partner_reach_person', { name: partner.name })} style={{ breakInside: 'avoid' }}>
      <p className="m-0 font-semibold">{t('partner_reach_person', { name: partner.name })}</p>
      <ul className="m-0 mt-2 list-none p-0 space-y-1.5">
        {partner.contacts.map(ct => (
          <li key={`${ct.label}${ct.phone || ''}${ct.url || ''}`} className="m-0">
            <span aria-hidden="true">{ct.url && !ct.phone ? '🔗 ' : '📞 '}</span>
            {ct.label}
            {ct.phone && <> <a className={`font-semibold underline ${c.link}`} href={telHref(ct.phone)}>{ct.phone}</a></>}
            {ct.url && <> <a className={`font-semibold underline ${c.link}`} href={ct.url} target="_blank" rel="noopener noreferrer">{ct.urlText || ct.url.replace(/^https?:\/\//, '')}</a></>}
            {ct.hours && <span className={`ms-1 text-sm ${c.muted}`}>· {ct.hours}</span>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
