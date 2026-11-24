import { useEffect } from 'react';

// Marks the current page noindex while it is mounted. index.html ships
// "index, follow"; this flips that tag and restores it on leave, so SPA
// navigation to an indexable page doesn't carry the noindex along.
export function useNoindex() {
  useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]');
    const before = robots?.getAttribute('content');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
    robots.setAttribute('content', 'noindex');
    return () => { if (before == null) robots.remove(); else robots.setAttribute('content', before); };
  }, []);
}
