import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { markArrival } from '../utils/revealSection';

/**
 * Where the window and keyboard focus land after every page change, site-wide.
 *
 * BrowserRouter does none of this, and the browser's own scroll restoration
 * can't: it restores before React has drawn the page (lazy tools, guide
 * shelves), so Back clamps to a half-built page and lands somewhere else.
 * Pages used to patch this one by one, each differently.
 *
 *  - A new page (link, Forward-by-click): top of the window, focus its <h1>.
 *  - A link with #section: that section at the top, focus it.
 *  - Back / Forward / reload: the scroll position you left, and focus back on
 *    the link you clicked. Retried until the page is tall enough (up to ~3s),
 *    and abandoned the moment you scroll or click yourself.
 *  - A URL change that only replaces filters (setParams with replace): nothing.
 *
 * Positions live in sessionStorage keyed by history entry, so they survive a
 * trip out to a static guide page and back.
 */

const STORE = 'db-route-views';
const RETRY_MS = 75;
const MAX_TRIES = 40;

const idOf = loc => (loc.key && loc.key !== 'default' ? loc.key : loc.pathname + loc.search + loc.hash);
const loadViews = () => { try { return JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch (_) { return {}; } };
const linksTo = href => [...document.querySelectorAll('a[href]')].filter(a => a.getAttribute('href') === href);
const linkKey = a => { const href = a.getAttribute('href'); return { href, n: linksTo(href).indexOf(a) }; };

function focusQuietly(el) {
  if (!el) return;
  if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
    el.setAttribute('tabindex', '-1');
    el.setAttribute('data-route-focus', '');
  }
  el.focus({ preventScroll: true });
}

export default function RouteFocus() {
  const location = useLocation();
  const navType = useNavigationType();
  const views = useRef(null);
  if (!views.current) views.current = loadViews();
  const y = useRef(typeof window === 'undefined' ? 0 : window.scrollY);
  const link = useRef(null);
  // Scroll position when a link was clicked. A same-page #link jumps before the
  // route change arrives, so by then `y` already holds the new position and Back
  // would return to the section instead of the link (Organizations page,
  // 2026-11-28).
  const yAtClick = useRef(null);
  const current = useRef(null);
  const path = useRef(null);
  const cancel = useRef(() => {});

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const onScroll = () => { y.current = window.scrollY; };
    const onClick = e => { const a = e.target.closest && e.target.closest('a[href]'); if (a) { link.current = linkKey(a); yAtClick.current = window.scrollY; } };
    const save = () => {
      if (current.current) views.current[current.current] = { y: window.scrollY, link: link.current };
      try { sessionStorage.setItem(STORE, JSON.stringify(views.current)); } catch (_) { /* no restore, nothing else */ }
    };
    // A control that removes itself when pressed (Start over, a closing panel,
    // a step's Next) takes keyboard focus with it, and the browser drops focus
    // on <body>: a screen reader says only "web content" and the next Tab
    // starts from the top of the page (VoiceOver, 2026-11-28). Put focus on
    // the page's heading instead, so the visitor hears where they are.
    const onAct = () => {
      const before = document.activeElement;
      if (!before || before === document.body) return;
      setTimeout(() => {
        const now = document.activeElement;
        if ((now && now !== document.body) || before.isConnected) return;
        focusQuietly(document.querySelector('main h1') || document.querySelector('h1'));
      }, 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick, true);
    document.addEventListener('click', onAct, true);
    window.addEventListener('pagehide', save);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('click', onAct, true);
      window.removeEventListener('pagehide', save);
    };
  }, []);

  useLayoutEffect(() => {
    const id = idOf(location);
    if (id === current.current) return; // StrictMode re-run, or nothing changed
    const firstLoad = current.current === null;
    const samePage = path.current === location.pathname;

    if (!(navType === 'REPLACE' && samePage)) markArrival();
    if (!firstLoad) views.current[current.current] = { y: link.current && yAtClick.current !== null ? yAtClick.current : y.current, link: link.current };
    // A same-page #link arrives as POP (the browser's own hash jump), under the
    // same id every time. Its saved position is from the last visit and goes stale
    // when the page changes: a click on a #link always goes to its section.
    const hashClick = !!(link.current && location.hash && link.current.href.split('#')[1] === location.hash.slice(1));
    current.current = id;
    path.current = location.pathname;
    link.current = null;
    yAtClick.current = null;

    let saved = null;
    if (firstLoad) {
      const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      if (nav && (nav.type === 'back_forward' || nav.type === 'reload')) saved = views.current[id] || null;
      if (!saved && !location.hash) return; // a fresh visit already starts at the top
    } else if (navType === 'POP') {
      saved = hashClick ? null : views.current[id] || null;
      if (!saved && !location.hash) return; // e.g. Back across an in-page #link: the browser handles it
    } else if (navType === 'REPLACE' && samePage) {
      return; // filters and search boxes rewriting the URL
    }

    const hash = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    let tries = 0;
    let timer = null;
    let stopped = false;
    const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    const stop = () => {
      stopped = true;
      clearTimeout(timer);
      userEvents.forEach(ev => window.removeEventListener(ev, stop));
    };

    const attempt = () => {
      if (saved) {
        window.scrollTo(0, saved.y);
        if (Math.abs(window.scrollY - saved.y) > 2) return false;
        if (saved.link) {
          const a = linksTo(saved.link.href)[saved.link.n];
          if (a) a.focus({ preventScroll: true });
        }
        return true;
      }
      if (hash) {
        const el = document.getElementById(hash);
        if (!el) return false;
        el.scrollIntoView({ block: 'start' });
        focusQuietly(el);
        return true;
      }
      if (tries === 1) window.scrollTo(0, 0);
      const h1 = document.querySelector('main h1') || document.querySelector('h1');
      if (!h1) return false;
      focusQuietly(h1);
      return true;
    };
    const step = () => {
      if (stopped) return;
      tries += 1;
      if (attempt() || tries >= MAX_TRIES) stop();
      else timer = setTimeout(step, RETRY_MS);
    };

    cancel.current();
    cancel.current = stop;
    userEvents.forEach(ev => window.addEventListener(ev, stop, { passive: true }));
    step();
  }, [location, navType]);

  return null;
}
